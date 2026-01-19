import { createFileRoute } from '@tanstack/react-router'
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { ExploreTrackerService } from '@agent-tracker/core';

// Singleton service instance for SSE
let service: ExploreTrackerService | null = null;
const connections = new Set<ReadableStreamDefaultController<Uint8Array>>();

function getService(): ExploreTrackerService {
  if (!service) {
    service = new ExploreTrackerService({ enableLogging: false });
    service.start();

    // Subscribe to session updates and broadcast to all SSE connections
    service.subscribe(() => {
      const encoder = new TextEncoder();
      const data = JSON.stringify({ type: 'session_updated', timestamp: Date.now() });
      const message = encoder.encode(`event: session_updated\ndata: ${data}\n\n`);

      connections.forEach((controller) => {
        try {
          controller.enqueue(message);
        } catch {
          // Connection closed, remove from set
          connections.delete(controller);
        }
      });
    });
  }
  return service;
}

export const Route = createAPIFileRoute('/api/events')({
  GET: async ({ request }) => {
    // Initialize the service to start tracking
    getService();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();

        // Add this connection to the set
        connections.add(controller);

        // Send initial connection message
        controller.enqueue(encoder.encode('event: connected\ndata: {"connected": true}\n\n'));

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode('event: heartbeat\ndata: {}\n\n'));
          } catch {
            clearInterval(heartbeat);
            connections.delete(controller);
          }
        }, 30000);

        // Clean up when request is aborted
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          connections.delete(controller);
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  },
});

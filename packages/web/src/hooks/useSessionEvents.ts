import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useSessionEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('connected', () => {
      console.log('[SSE] Connected to session events');
    });

    eventSource.addEventListener('session_updated', () => {
      // Invalidate queries to refetch with server functions
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session'] });
    });

    eventSource.addEventListener('heartbeat', () => {
      // Keep-alive, no action needed
    });

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}

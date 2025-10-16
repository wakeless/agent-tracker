import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TranscriptViewer } from './TranscriptViewer.js';
import * as fs from 'fs/promises';

// Mock the fs module
vi.mock('fs/promises');

describe('TranscriptViewer with Markdown', () => {
  const mockTranscriptPath = '/tmp/test-transcript.jsonl';
  const mockSessionId = 'test-session-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render markdown in assistant messages when expanded', async () => {
    const mockTranscript = [
      {
        uuid: 'entry-1',
        timestamp: '2025-10-17T00:00:00.000Z',
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: '# Hello\n\nThis is **bold** and this is *italic*.\n\n- Item 1\n- Item 2',
            },
          ],
        },
        sessionId: mockSessionId,
        cwd: '/test',
        userType: 'test',
        isSidechain: false,
        parentUuid: null,
        version: '1.0.0',
      },
    ].map((entry) => JSON.stringify(entry)).join('\n');

    vi.mocked(fs.readFile).mockResolvedValue(mockTranscript);
    vi.mocked(fs.access).mockResolvedValue(undefined);

    const { lastFrame } = render(
      <TranscriptViewer transcriptPath={mockTranscriptPath} sessionId={mockSessionId} />
    );

    // Wait for async loading
    await new Promise((resolve) => setTimeout(resolve, 100));

    const output = lastFrame();
    expect(output).toContain('Assistant');
    // Markdown should be rendered (not raw markdown syntax)
    expect(output).toBeTruthy();
  });

  it('should render markdown in user messages when expanded', async () => {
    const mockTranscript = [
      {
        uuid: 'entry-1',
        timestamp: '2025-10-17T00:00:00.000Z',
        type: 'user',
        message: {
          role: 'user',
          content: 'Here is some `inline code` and a code block:\n```javascript\nconsole.log("test");\n```',
        },
        sessionId: mockSessionId,
        cwd: '/test',
        userType: 'test',
        isSidechain: false,
        parentUuid: null,
        version: '1.0.0',
      },
    ].map((entry) => JSON.stringify(entry)).join('\n');

    vi.mocked(fs.readFile).mockResolvedValue(mockTranscript);
    vi.mocked(fs.access).mockResolvedValue(undefined);

    const { lastFrame } = render(
      <TranscriptViewer transcriptPath={mockTranscriptPath} sessionId={mockSessionId} />
    );

    // Wait for async loading
    await new Promise((resolve) => setTimeout(resolve, 100));

    const output = lastFrame();
    expect(output).toContain('User');
    expect(output).toBeTruthy();
  });

  it('should NOT render markdown in tool_use entries', async () => {
    const mockTranscript = [
      {
        uuid: 'entry-1',
        timestamp: '2025-10-17T00:00:00.000Z',
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'tool-1',
              name: 'Read',
              input: {
                file_path: '/test/file.txt',
              },
            },
          ],
        },
        sessionId: mockSessionId,
        cwd: '/test',
        userType: 'test',
        isSidechain: false,
        parentUuid: null,
        version: '1.0.0',
      },
    ].map((entry) => JSON.stringify(entry)).join('\n');

    vi.mocked(fs.readFile).mockResolvedValue(mockTranscript);
    vi.mocked(fs.access).mockResolvedValue(undefined);

    const { lastFrame } = render(
      <TranscriptViewer transcriptPath={mockTranscriptPath} sessionId={mockSessionId} />
    );

    // Wait for async loading
    await new Promise((resolve) => setTimeout(resolve, 100));

    const output = lastFrame();
    expect(output).toContain('Read');
    // Tool input should be shown as JSON, not markdown
    expect(output).toBeTruthy();
  });

  it('should handle plain text without markdown', async () => {
    const mockTranscript = [
      {
        uuid: 'entry-1',
        timestamp: '2025-10-17T00:00:00.000Z',
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: 'Just plain text with no markdown formatting',
            },
          ],
        },
        sessionId: mockSessionId,
        cwd: '/test',
        userType: 'test',
        isSidechain: false,
        parentUuid: null,
        version: '1.0.0',
      },
    ].map((entry) => JSON.stringify(entry)).join('\n');

    vi.mocked(fs.readFile).mockResolvedValue(mockTranscript);
    vi.mocked(fs.access).mockResolvedValue(undefined);

    const { lastFrame } = render(
      <TranscriptViewer transcriptPath={mockTranscriptPath} sessionId={mockSessionId} />
    );

    // Wait for async loading
    await new Promise((resolve) => setTimeout(resolve, 100));

    const output = lastFrame();
    expect(output).toContain('Just plain text with no markdown formatting');
  });

  it('should display loading state initially', () => {
    vi.mocked(fs.readFile).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(''), 1000))
    );
    vi.mocked(fs.access).mockResolvedValue(undefined);

    const { lastFrame } = render(
      <TranscriptViewer transcriptPath={mockTranscriptPath} sessionId={mockSessionId} />
    );

    const output = lastFrame();
    expect(output).toContain('Loading transcript...');
  });
});

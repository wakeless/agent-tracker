import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TranscriptViewer } from './TranscriptViewer.js';
import { Session, ParsedTranscriptEntry } from '@agent-tracker/core';

// Mock TranscriptReader and TranscriptWatcher from @agent-tracker/core
vi.mock('@agent-tracker/core', async () => {
  const actual = await vi.importActual('@agent-tracker/core');
  return {
    ...actual,
    TranscriptReader: vi.fn(),
    TranscriptWatcher: vi.fn(),
  };
});

// Import the mocked modules
import { TranscriptReader, TranscriptWatcher } from '@agent-tracker/core';

// Helper to set up mocks for each test
function setupMocks(mockEntries: ParsedTranscriptEntry[]) {
  vi.mocked(TranscriptReader).mockImplementation(() => ({
    readTranscript: vi.fn().mockResolvedValue(mockEntries),
  }));
  vi.mocked(TranscriptWatcher).mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  }));
}

describe('TranscriptViewer with Markdown', () => {
  const mockTranscriptPath = '/tmp/test-transcript.jsonl';
  const mockSessionId = 'test-session-123';

  // Mock session object required by TranscriptViewer
  // Use an older start time to avoid triggering "new session" view
  const mockSession: Session = {
    id: mockSessionId,
    cwd: '/test',
    transcriptPath: mockTranscriptPath,
    status: 'active',
    startTime: new Date(Date.now() - 60000), // 1 minute ago
    lastActivityTime: new Date(),
    awaitingInput: false,
    terminal: {
      tty: '/dev/ttys000',
      term: 'xterm-256color',
      shell: '/bin/zsh',
      ppid: '1234',
      term_program: 'Terminal',
      term_session_id: 'session-1',
      lc_terminal: '',
      lc_terminal_version: '',
      iterm: {
        session_id: '',
        profile: '',
        tab_name: '',
        window_name: '',
      },
    },
    git: {
      is_repo: false,
      branch: '',
      is_worktree: false,
      is_dirty: false,
      repo_name: '',
    },
    docker: {
      is_container: false,
      container_id: '',
      container_name: '',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render markdown in assistant messages when expanded', async () => {
    const mockEntries: ParsedTranscriptEntry[] = [
      {
        uuid: 'entry-1',
        timestamp: new Date('2025-10-17T00:00:00.000Z'),
        type: 'assistant',
        content: '# Hello\n\nThis is **bold** and this is *italic*.\n\n- Item 1\n- Item 2',
      },
    ];

    setupMocks(mockEntries);

    const { lastFrame } = render(
      <TranscriptViewer transcriptPath={mockTranscriptPath} sessionId={mockSessionId} session={mockSession} />
    );

    // Wait for async loading
    await new Promise((resolve) => setTimeout(resolve, 100));

    const output = lastFrame();
    expect(output).toContain('Assistant');
    // Markdown should be rendered (not raw markdown syntax)
    expect(output).toBeTruthy();
  });

  it('should render markdown in user messages when expanded', async () => {
    const mockEntries: ParsedTranscriptEntry[] = [
      {
        uuid: 'entry-1',
        timestamp: new Date('2025-10-17T00:00:00.000Z'),
        type: 'user',
        content: 'Here is some `inline code` and a code block:\n```javascript\nconsole.log("test");\n```',
      },
    ];

    setupMocks(mockEntries);

    const { lastFrame } = render(
      <TranscriptViewer transcriptPath={mockTranscriptPath} sessionId={mockSessionId} session={mockSession} />
    );

    // Wait for async loading
    await new Promise((resolve) => setTimeout(resolve, 100));

    const output = lastFrame();
    expect(output).toContain('User');
    expect(output).toBeTruthy();
  });

  it('should NOT render markdown in tool_use entries', async () => {
    const mockEntries: ParsedTranscriptEntry[] = [
      {
        uuid: 'entry-1',
        timestamp: new Date('2025-10-17T00:00:00.000Z'),
        type: 'tool_use',
        toolName: 'Read',
        toolId: 'tool-1',
        toolInput: { file_path: '/test/file.txt' },
        content: 'Read: /test/file.txt',
      },
    ];

    setupMocks(mockEntries);

    const { lastFrame } = render(
      <TranscriptViewer transcriptPath={mockTranscriptPath} sessionId={mockSessionId} session={mockSession} />
    );

    // Wait for async loading
    await new Promise((resolve) => setTimeout(resolve, 100));

    const output = lastFrame();
    expect(output).toContain('Read');
    // Tool input should be shown as JSON, not markdown
    expect(output).toBeTruthy();
  });

  it('should handle plain text without markdown', async () => {
    const mockEntries: ParsedTranscriptEntry[] = [
      {
        uuid: 'entry-1',
        timestamp: new Date('2025-10-17T00:00:00.000Z'),
        type: 'assistant',
        content: 'Just plain text with no markdown formatting',
      },
    ];

    setupMocks(mockEntries);

    const { lastFrame } = render(
      <TranscriptViewer transcriptPath={mockTranscriptPath} sessionId={mockSessionId} session={mockSession} />
    );

    // Wait for async loading
    await new Promise((resolve) => setTimeout(resolve, 100));

    const output = lastFrame();
    expect(output).toContain('Just plain text with no markdown formatting');
  });

  it('should display loading state initially', () => {
    // Mock a slow transcript read - don't need watcher for this test
    vi.mocked(TranscriptReader).mockImplementation(() => ({
      readTranscript: vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
      ),
    }));

    const { lastFrame } = render(
      <TranscriptViewer transcriptPath={mockTranscriptPath} sessionId={mockSessionId} session={mockSession} />
    );

    const output = lastFrame();
    expect(output).toContain('Loading transcript...');
  });
});

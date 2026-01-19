/**
 * Mock session data for testing
 */

export interface MockSession {
  id: string;
  cwd: string;
  transcriptPath: string;
  terminal: {
    tty: string;
    term: string;
    shell: string;
    ppid: string;
    term_program: string;
    term_session_id: string;
    lc_terminal: string;
    lc_terminal_version: string;
    iterm: {
      session_id: string;
      profile: string;
      tab_name: string;
      window_name: string;
    };
  };
  git: {
    is_repo: boolean;
    branch: string;
    is_worktree: boolean;
    is_dirty: boolean;
    repo_name: string;
  };
  status: 'active' | 'inactive' | 'ended';
  startTime: string;
  lastActivityTime: string;
  endTime?: string;
  awaitingInput: boolean;
  displayName?: string;
  isPhantom?: boolean;
}

export interface MockTranscriptEntry {
  uuid: string;
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'thinking' | 'system';
  content: string;
  timestamp: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  isError?: boolean;
}

export const mockSessions: MockSession[] = [
  {
    id: 'test-session-1',
    cwd: '/home/user/project-a',
    transcriptPath: '/home/user/.claude/projects/-home-user-project-a/test-session-1.jsonl',
    terminal: {
      tty: '/dev/pts/0',
      term: 'xterm-256color',
      shell: '/bin/bash',
      ppid: '1234',
      term_program: 'iTerm.app',
      term_session_id: 'session-1',
      lc_terminal: 'iTerm2',
      lc_terminal_version: '3.4.0',
      iterm: {
        session_id: 'iterm-session-1',
        profile: 'Default',
        tab_name: 'Tab 1',
        window_name: 'Window 1',
      },
    },
    git: {
      is_repo: true,
      branch: 'main',
      is_worktree: false,
      is_dirty: false,
      repo_name: 'project-a',
    },
    status: 'active',
    startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    lastActivityTime: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    awaitingInput: true,
    displayName: 'Help me implement a new feature',
    isPhantom: false,
  },
  {
    id: 'test-session-2',
    cwd: '/home/user/project-b',
    transcriptPath: '/home/user/.claude/projects/-home-user-project-b/test-session-2.jsonl',
    terminal: {
      tty: '/dev/pts/1',
      term: 'xterm-256color',
      shell: '/bin/zsh',
      ppid: '5678',
      term_program: 'Terminal.app',
      term_session_id: 'session-2',
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
      is_repo: true,
      branch: 'feature/new-api',
      is_worktree: false,
      is_dirty: true,
      repo_name: 'project-b',
    },
    status: 'inactive',
    startTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    lastActivityTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    awaitingInput: false,
    displayName: 'Fix authentication bug',
    isPhantom: false,
  },
  {
    id: 'test-session-3',
    cwd: '/home/user/project-c',
    transcriptPath: '/home/user/.claude/projects/-home-user-project-c/test-session-3.jsonl',
    terminal: {
      tty: '',
      term: '',
      shell: '',
      ppid: '',
      term_program: '',
      term_session_id: '',
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
    status: 'ended',
    startTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    lastActivityTime: new Date(Date.now() - 82800000).toISOString(), // 23 hours ago
    endTime: new Date(Date.now() - 82800000).toISOString(),
    awaitingInput: false,
    displayName: 'Write documentation',
    isPhantom: false,
  },
];

export const mockTranscriptEntries: MockTranscriptEntry[] = [
  {
    uuid: 'entry-1',
    type: 'user',
    content: 'Can you help me implement a new feature?',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    uuid: 'entry-2',
    type: 'assistant',
    content: 'Of course! I\'d be happy to help you implement a new feature. Could you tell me more about what you\'d like to build?',
    timestamp: new Date(Date.now() - 3595000).toISOString(),
  },
  {
    uuid: 'entry-3',
    type: 'user',
    content: 'I want to add a search functionality to the app.',
    timestamp: new Date(Date.now() - 3590000).toISOString(),
  },
  {
    uuid: 'entry-4',
    type: 'thinking',
    content: 'Let me think about the best approach for implementing search functionality...',
    timestamp: new Date(Date.now() - 3585000).toISOString(),
  },
  {
    uuid: 'entry-5',
    type: 'tool_use',
    content: '',
    timestamp: new Date(Date.now() - 3580000).toISOString(),
    toolName: 'Read',
    toolInput: {
      file_path: '/home/user/project-a/src/App.tsx',
    },
  },
  {
    uuid: 'entry-6',
    type: 'tool_result',
    content: 'import React from "react";\n\nfunction App() {\n  return <div>Hello World</div>;\n}\n\nexport default App;',
    timestamp: new Date(Date.now() - 3575000).toISOString(),
    isError: false,
  },
  {
    uuid: 'entry-7',
    type: 'assistant',
    content: 'I\'ve read the App.tsx file. Now let me add the search functionality.',
    timestamp: new Date(Date.now() - 3570000).toISOString(),
  },
  {
    uuid: 'entry-8',
    type: 'tool_use',
    content: '',
    timestamp: new Date(Date.now() - 3565000).toISOString(),
    toolName: 'Edit',
    toolInput: {
      file_path: '/home/user/project-a/src/App.tsx',
      old_string: 'function App() {\n  return <div>Hello World</div>;\n}',
      new_string: 'function App() {\n  const [search, setSearch] = React.useState("");\n  return (\n    <div>\n      <input\n        type="text"\n        value={search}\n        onChange={(e) => setSearch(e.target.value)}\n        placeholder="Search..."\n      />\n      <div>Hello World</div>\n    </div>\n  );\n}',
    },
  },
  {
    uuid: 'entry-9',
    type: 'tool_result',
    content: 'File edited successfully',
    timestamp: new Date(Date.now() - 3560000).toISOString(),
    isError: false,
  },
  {
    uuid: 'entry-10',
    type: 'assistant',
    content: 'I\'ve added a basic search input to your App component. The search state is managed using React\'s useState hook.',
    timestamp: new Date(Date.now() - 3555000).toISOString(),
  },
];

export const mockSessionCounts = {
  total: mockSessions.length,
  active: mockSessions.filter((s) => s.status === 'active').length,
  inactive: mockSessions.filter((s) => s.status === 'inactive').length,
  ended: mockSessions.filter((s) => s.status === 'ended').length,
  awaitingInput: mockSessions.filter((s) => s.awaitingInput).length,
};

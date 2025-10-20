import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { App } from './App.js';
import fs from 'fs';
import { homedir } from 'os';
import { join } from 'path';

describe('App', () => {
  const testLogPath = join(homedir(), '.agent-tracker', 'sessions.jsonl');

  beforeEach(() => {
    // Ensure the log file exists for normal operation tests
    const logDir = join(testLogPath, '..');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    if (!fs.existsSync(testLogPath)) {
      fs.writeFileSync(testLogPath, '');
    }
  });

  afterEach(() => {
    // Cleanup is optional - we can leave the file for other tests
  });

  it('should render app title when events file exists', () => {
    const { lastFrame } = render(<App />);

    expect(lastFrame()).toContain('Agent Tracker');
  });

  it('should render session stats bar when events file exists', () => {
    const { lastFrame } = render(<App />);

    expect(lastFrame()).toContain('Total:');
    expect(lastFrame()).toContain('Active:');
    expect(lastFrame()).toContain('Inactive:');
    expect(lastFrame()).toContain('Ended:');
  });

  it('should render empty session list when no sessions', () => {
    const { lastFrame } = render(<App />);

    expect(lastFrame()).toContain('No active sessions');
    expect(lastFrame()).toContain('Start a Claude session to see it here');
  });

  it('should render empty state when events file does not exist', () => {
    // Remove the file temporarily
    const fileExisted = fs.existsSync(testLogPath);
    if (fileExisted) {
      fs.unlinkSync(testLogPath);
    }

    const { lastFrame } = render(<App />);

    expect(lastFrame()).toContain('Welcome');
    expect(lastFrame()).toContain('Installation Steps');
    expect(lastFrame()).toContain('/plugin marketplace add');
    expect(lastFrame()).toContain('/plugin install agent-tracker');

    // Restore the file for other tests
    if (fileExisted) {
      fs.writeFileSync(testLogPath, '');
    }
  });
});

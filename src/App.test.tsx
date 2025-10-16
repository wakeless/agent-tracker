import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { App } from './App.js';

describe('App', () => {
  it('should render app title', () => {
    const { lastFrame } = render(<App />);

    expect(lastFrame()).toContain('Agent Tracker');
  });

  it('should render session stats bar', () => {
    const { lastFrame } = render(<App />);

    expect(lastFrame()).toContain('Total:');
    expect(lastFrame()).toContain('Active:');
    expect(lastFrame()).toContain('Inactive:');
    expect(lastFrame()).toContain('Ended:');
  });

  it('should render empty state when no sessions', () => {
    const { lastFrame } = render(<App />);

    expect(lastFrame()).toContain('No active sessions');
    expect(lastFrame()).toContain('Start a Claude session to see it here');
  });
});

import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { App } from './App.js';

describe('App', () => {
  it('should render welcome message', () => {
    const { lastFrame } = render(<App />);

    expect(lastFrame()).toContain('Agent Tracker');
    expect(lastFrame()).toContain('Hello');
    expect(lastFrame()).toContain('World');
  });

  it('should render custom name', () => {
    const { lastFrame } = render(<App name="Alice" />);

    expect(lastFrame()).toContain('Alice');
  });
});

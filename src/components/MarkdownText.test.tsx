import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { MarkdownText } from './MarkdownText.js';

describe('MarkdownText', () => {
  it('should render basic markdown', () => {
    const markdown = `# Hello World
This is **bold** and this is *italic*.

- Item 1
- Item 2

\`\`\`javascript
console.log('test');
\`\`\`
`;

    const { lastFrame } = render(<MarkdownText>{markdown}</MarkdownText>);
    const output = lastFrame();

    expect(output).toBeTruthy();
    expect(output).toContain('Hello World');
    expect(output).toContain('bold');
    expect(output).toContain('italic');
  });

  it('should handle plain text', () => {
    const text = 'Just plain text';
    const { lastFrame } = render(<MarkdownText>{text}</MarkdownText>);
    const output = lastFrame();

    expect(output).toContain('Just plain text');
  });

  it('should handle empty content', () => {
    const { lastFrame } = render(<MarkdownText>{''}</MarkdownText>);
    const output = lastFrame();

    expect(output).toBe('');
  });

  it('should handle code blocks', () => {
    const markdown = '`inline code` and\n```\ncode block\n```';
    const { lastFrame } = render(<MarkdownText>{markdown}</MarkdownText>);
    const output = lastFrame();

    expect(output).toBeTruthy();
    expect(output).toContain('inline code');
    expect(output).toContain('code block');
  });

  it('should handle lists', () => {
    const markdown = `- List item 1
- List item 2
- List item 3`;
    const { lastFrame } = render(<MarkdownText>{markdown}</MarkdownText>);
    const output = lastFrame();

    expect(output).toContain('List item 1');
    expect(output).toContain('List item 2');
    expect(output).toContain('List item 3');
  });
});

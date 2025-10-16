import { describe, it, expect } from 'vitest';
import { TranscriptReader } from './TranscriptReader.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('TranscriptReader', () => {
  it('should parse user messages correctly', async () => {
    const tempFile = path.join(os.tmpdir(), 'test-transcript.jsonl');
    const sampleEntry = {
      parentUuid: null,
      isSidechain: true,
      userType: 'external',
      cwd: '/test',
      sessionId: 'test-session',
      version: '2.0.19',
      gitBranch: 'main',
      type: 'user',
      message: {
        role: 'user',
        content: 'Hello, Claude!',
      },
      uuid: 'test-uuid-1',
      timestamp: '2025-10-16T07:42:14.400Z',
    };

    fs.writeFileSync(tempFile, JSON.stringify(sampleEntry) + '\n');

    const reader = new TranscriptReader();
    const entries = await reader.readTranscript(tempFile);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      uuid: 'test-uuid-1',
      type: 'user',
      content: 'Hello, Claude!',
    });
    expect(entries[0].timestamp).toBeInstanceOf(Date);

    fs.unlinkSync(tempFile);
  });

  it('should parse assistant messages correctly', async () => {
    const tempFile = path.join(os.tmpdir(), 'test-transcript-assistant.jsonl');
    const sampleEntry = {
      parentUuid: 'parent-uuid',
      isSidechain: true,
      userType: 'external',
      cwd: '/test',
      sessionId: 'test-session',
      version: '2.0.19',
      type: 'assistant',
      message: {
        model: 'claude-haiku-4-5-20251001',
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Hello! How can I help you?',
          },
        ],
      },
      uuid: 'test-uuid-2',
      timestamp: '2025-10-16T07:42:19.365Z',
    };

    fs.writeFileSync(tempFile, JSON.stringify(sampleEntry) + '\n');

    const reader = new TranscriptReader();
    const entries = await reader.readTranscript(tempFile);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      uuid: 'test-uuid-2',
      type: 'assistant',
      content: 'Hello! How can I help you?',
    });

    fs.unlinkSync(tempFile);
  });

  it('should parse tool use messages correctly', async () => {
    const tempFile = path.join(os.tmpdir(), 'test-transcript-tool.jsonl');
    const sampleEntry = {
      parentUuid: 'parent-uuid',
      isSidechain: true,
      userType: 'external',
      cwd: '/test',
      sessionId: 'test-session',
      version: '2.0.19',
      type: 'assistant',
      message: {
        model: 'claude-haiku-4-5-20251001',
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'tool-123',
            name: 'Read',
            input: { file_path: '/test/file.ts' },
          },
        ],
      },
      uuid: 'test-uuid-3',
      timestamp: '2025-10-16T07:42:20.000Z',
    };

    fs.writeFileSync(tempFile, JSON.stringify(sampleEntry) + '\n');

    const reader = new TranscriptReader();
    const entries = await reader.readTranscript(tempFile);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      uuid: 'test-uuid-3',
      type: 'tool_use',
      toolName: 'Read',
      toolId: 'tool-123',
    });

    fs.unlinkSync(tempFile);
  });

  it('should handle empty lines gracefully', async () => {
    const tempFile = path.join(os.tmpdir(), 'test-transcript-empty.jsonl');
    const content = `{"type":"user","message":{"role":"user","content":"test"},"uuid":"1","timestamp":"2025-10-16T07:42:14.400Z"}

{"type":"user","message":{"role":"user","content":"test2"},"uuid":"2","timestamp":"2025-10-16T07:42:15.400Z"}`;

    fs.writeFileSync(tempFile, content);

    const reader = new TranscriptReader();
    const entries = await reader.readTranscript(tempFile);

    expect(entries).toHaveLength(2);

    fs.unlinkSync(tempFile);
  });

  it('should throw error for non-existent file', async () => {
    const reader = new TranscriptReader();
    await expect(
      reader.readTranscript('/non/existent/file.jsonl')
    ).rejects.toThrow('Transcript file not found');
  });

  it('should get recent entries with limit', async () => {
    const tempFile = path.join(os.tmpdir(), 'test-transcript-recent.jsonl');
    const entries = [
      { type: 'user', message: { role: 'user', content: 'msg1' }, uuid: '1', timestamp: '2025-10-16T07:42:14.400Z' },
      { type: 'user', message: { role: 'user', content: 'msg2' }, uuid: '2', timestamp: '2025-10-16T07:42:15.400Z' },
      { type: 'user', message: { role: 'user', content: 'msg3' }, uuid: '3', timestamp: '2025-10-16T07:42:16.400Z' },
      { type: 'user', message: { role: 'user', content: 'msg4' }, uuid: '4', timestamp: '2025-10-16T07:42:17.400Z' },
      { type: 'user', message: { role: 'user', content: 'msg5' }, uuid: '5', timestamp: '2025-10-16T07:42:18.400Z' },
    ];

    fs.writeFileSync(tempFile, entries.map(e => JSON.stringify(e)).join('\n'));

    const reader = new TranscriptReader();
    const recent = await reader.getRecentEntries(tempFile, 3);

    expect(recent).toHaveLength(3);
    expect(recent[0].content).toBe('msg3');
    expect(recent[2].content).toBe('msg5');

    fs.unlinkSync(tempFile);
  });
});

import * as fs from 'fs';
import * as readline from 'readline';
import { TranscriptEntry, ParsedTranscriptEntry, AssistantMessage } from '../types/transcript.js';

export class TranscriptReader {
  /**
   * Read and parse a transcript file
   */
  async readTranscript(transcriptPath: string): Promise<ParsedTranscriptEntry[]> {
    try {
      if (!fs.existsSync(transcriptPath)) {
        throw new Error(`Transcript file not found: ${transcriptPath}`);
      }

      const entries: ParsedTranscriptEntry[] = [];
      const fileStream = fs.createReadStream(transcriptPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;

        try {
          const entry: TranscriptEntry = JSON.parse(line);
          const parsed = this.parseEntry(entry);
          if (parsed) {
            entries.push(parsed);
          }
        } catch (err) {
          console.error('Failed to parse transcript line:', err);
          // Continue processing other lines
        }
      }

      return entries;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read transcript: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get recent N entries from transcript
   */
  async getRecentEntries(transcriptPath: string, limit: number = 5): Promise<ParsedTranscriptEntry[]> {
    const allEntries = await this.readTranscript(transcriptPath);
    return allEntries.slice(-limit);
  }

  /**
   * Parse a transcript entry into display format
   */
  parseEntry(entry: TranscriptEntry): ParsedTranscriptEntry | null {
    const timestamp = new Date(entry.timestamp);

    if (entry.type === 'user' && entry.message) {
      // Check for tool_result blocks first
      if (Array.isArray(entry.message.content)) {
        const toolResultBlocks = entry.message.content.filter(block => block.type === 'tool_result');

        if (toolResultBlocks.length > 0) {
          const toolResult = toolResultBlocks[0];
          if (toolResult.type === 'tool_result') {
            return {
              uuid: entry.uuid,
              timestamp,
              type: 'tool_result',
              content: toolResult.content,
              toolUseId: toolResult.tool_use_id,
              isError: toolResult.is_error,
            };
          }
        }
      }

      // Handle both string content and array of content blocks
      let content: string;
      if (typeof entry.message.content === 'string') {
        content = entry.message.content;
      } else if (Array.isArray(entry.message.content)) {
        // Extract text from content blocks
        content = entry.message.content
          .filter(block => block.type === 'text')
          .map(block => block.type === 'text' ? block.text : '')
          .join('\n\n');
      } else {
        content = '';
      }

      // Skip entries with no meaningful content
      if (!content.trim()) {
        return null;
      }

      // Mark internal meta messages (like caveats) as 'meta' type
      if (entry.isMeta) {
        return {
          uuid: entry.uuid,
          timestamp,
          type: 'meta',
          content,
        };
      }

      return {
        uuid: entry.uuid,
        timestamp,
        type: 'user',
        content,
      };
    }

    if (entry.type === 'assistant' && entry.message) {
      const message = entry.message as AssistantMessage;
      const textBlocks = message.content.filter(block => block.type === 'text');
      const toolUseBlocks = message.content.filter(block => block.type === 'tool_use');
      const thinkingBlocks = message.content.filter(block => block.type === 'thinking');

      // Prioritize thinking blocks first (show the reasoning)
      if (thinkingBlocks.length > 0) {
        const thinkingBlock = thinkingBlocks[0];
        if (thinkingBlock.type === 'thinking') {
          return {
            uuid: entry.uuid,
            timestamp,
            type: 'thinking',
            content: thinkingBlock.thinking,
          };
        }
      }

      // Create an entry for text content
      const textContent = textBlocks
        .map(block => block.type === 'text' ? block.text : '')
        .join('\n\n');

      if (textContent) {
        return {
          uuid: entry.uuid,
          timestamp,
          type: 'assistant',
          content: textContent,
        };
      }

      // Create entries for tool uses
      if (toolUseBlocks.length > 0) {
        const toolBlock = toolUseBlocks[0];
        if (toolBlock.type === 'tool_use') {
          return {
            uuid: entry.uuid,
            timestamp,
            type: 'tool_use',
            content: `Used tool: ${toolBlock.name}`,
            toolName: toolBlock.name,
            toolId: toolBlock.id,
            toolInput: toolBlock.input,
          };
        }
      }
    }

    // Parse system entries (e.g., compact boundaries)
    if (entry.type === 'system') {
      return {
        uuid: entry.uuid,
        timestamp,
        type: 'system',
        content: entry.content || 'System event',
        systemSubtype: entry.subtype,
        compactMetadata: entry.compactMetadata,
      };
    }

    // Parse file history snapshots
    if (entry.type === 'file-history-snapshot') {
      const fileCount = entry.snapshot?.trackedFileBackups
        ? Object.keys(entry.snapshot.trackedFileBackups).length
        : 0;
      return {
        uuid: entry.uuid,
        timestamp,
        type: 'file-history',
        content: `File history snapshot (${fileCount} files tracked)`,
        fileCount,
      };
    }

    return null;
  }

  /**
   * Get the timestamp of the last entry in the transcript
   * Useful for tracking session activity
   */
  async getLastEntryTimestamp(transcriptPath: string): Promise<Date | null> {
    try {
      if (!fs.existsSync(transcriptPath)) {
        return null;
      }

      const content = fs.readFileSync(transcriptPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      // Read from the end to find the last valid entry
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const entry: TranscriptEntry = JSON.parse(lines[i]);
          return new Date(entry.timestamp);
        } catch (err) {
          // Skip invalid lines
          continue;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Read transcript synchronously for testing
   */
  readTranscriptSync(transcriptPath: string): ParsedTranscriptEntry[] {
    try {
      if (!fs.existsSync(transcriptPath)) {
        throw new Error(`Transcript file not found: ${transcriptPath}`);
      }

      const content = fs.readFileSync(transcriptPath, 'utf-8');
      const lines = content.split('\n');
      const entries: ParsedTranscriptEntry[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const entry: TranscriptEntry = JSON.parse(line);
          const parsed = this.parseEntry(entry);
          if (parsed) {
            entries.push(parsed);
          }
        } catch (err) {
          console.error('Failed to parse transcript line:', err);
          // Continue processing other lines
        }
      }

      return entries;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read transcript: ${error.message}`);
      }
      throw error;
    }
  }
}

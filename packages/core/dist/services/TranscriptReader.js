import * as fs from 'fs';
import * as readline from 'readline';
import { isSystemMessage } from '../types/transcript.js';
export class TranscriptReader {
    /**
     * Helper: Check if content contains bash-input tags
     */
    isBashInput(content) {
        return /<bash-input>[\s\S]*?<\/bash-input>/.test(content);
    }
    /**
     * Helper: Check if content contains bash-stdout or bash-stderr tags
     */
    isBashOutput(content) {
        return /<bash-stdout>[\s\S]*?<\/bash-stdout>/.test(content) ||
            /<bash-stderr>[\s\S]*?<\/bash-stderr>/.test(content);
    }
    /**
     * Helper: Extract bash command from bash-input tags
     */
    extractBashCommand(content) {
        const match = content.match(/<bash-input>([\s\S]*?)<\/bash-input>/);
        return match ? match[1].trim() : '';
    }
    /**
     * Helper: Extract bash stdout from bash-stdout tags
     */
    extractBashStdout(content) {
        const match = content.match(/<bash-stdout>([\s\S]*?)<\/bash-stdout>/);
        return match ? match[1].trim() : '';
    }
    /**
     * Helper: Extract bash stderr from bash-stderr tags
     */
    extractBashStderr(content) {
        const match = content.match(/<bash-stderr>([\s\S]*?)<\/bash-stderr>/);
        return match ? match[1].trim() : '';
    }
    /**
     * Read and parse a transcript file
     */
    async readTranscript(transcriptPath) {
        try {
            if (!fs.existsSync(transcriptPath)) {
                throw new Error(`Transcript file not found: ${transcriptPath}`);
            }
            // Pass 1: Read all raw entries
            const rawEntries = [];
            const fileStream = fs.createReadStream(transcriptPath);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity,
            });
            for await (const line of rl) {
                if (!line.trim())
                    continue;
                try {
                    const entry = JSON.parse(line);
                    rawEntries.push(entry);
                }
                catch (err) {
                    console.error('Failed to parse transcript line:', err);
                    // Continue processing other lines
                }
            }
            // Pass 2: Parse entries with look-ahead capability
            const parsedEntries = [];
            let skip = 0;
            for (let i = 0; i < rawEntries.length; i++) {
                // Skip if this entry was consumed by a previous merge
                if (skip > 0) {
                    skip--;
                    continue;
                }
                const current = rawEntries[i];
                const upcoming = rawEntries.slice(i + 1, i + 4); // Look ahead up to 3 entries
                const result = this.parseEntry(current, upcoming);
                if (result.parsed) {
                    parsedEntries.push(result.parsed);
                }
                // Skip the entries that were consumed in the merge
                skip = result.consumed;
            }
            return parsedEntries;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to read transcript: ${error.message}`);
            }
            throw error;
        }
    }
    /**
     * Get recent N entries from transcript
     */
    async getRecentEntries(transcriptPath, limit = 5) {
        const allEntries = await this.readTranscript(transcriptPath);
        return allEntries.slice(-limit);
    }
    /**
     * Parse a transcript entry into display format
     * @param entry - The current entry to parse
     * @param upcoming - Array of upcoming entries for look-ahead (up to 3 entries)
     * @returns Object with parsed entry and number of upcoming entries consumed
     */
    parseEntry(entry, upcoming = []) {
        const timestamp = new Date(entry.timestamp);
        const isSystem = isSystemMessage(entry);
        if (entry.type === 'user' && entry.message) {
            // Check for tool_result blocks first
            if (Array.isArray(entry.message.content)) {
                const toolResultBlocks = entry.message.content.filter(block => block.type === 'tool_result');
                if (toolResultBlocks.length > 0) {
                    const toolResult = toolResultBlocks[0];
                    if (toolResult.type === 'tool_result') {
                        return {
                            parsed: {
                                uuid: entry.uuid,
                                timestamp,
                                type: 'tool_result',
                                content: toolResult.content,
                                toolUseId: toolResult.tool_use_id,
                                isError: toolResult.is_error,
                            },
                            consumed: 0,
                        };
                    }
                }
            }
            // Handle both string content and array of content blocks
            let content;
            if (typeof entry.message.content === 'string') {
                content = entry.message.content;
            }
            else if (Array.isArray(entry.message.content)) {
                // Extract text from content blocks
                content = entry.message.content
                    .filter(block => block.type === 'text')
                    .map(block => block.type === 'text' ? block.text : '')
                    .join('\n\n');
            }
            else {
                content = '';
            }
            // Skip entries with no meaningful content
            if (!content.trim()) {
                return { parsed: null, consumed: 0 };
            }
            // Check if this is a bash-input entry and look ahead for bash-output
            if (this.isBashInput(content)) {
                // Look through upcoming entries to find the matching bash-output
                for (let i = 0; i < upcoming.length; i++) {
                    const nextEntry = upcoming[i];
                    // Only look at user messages
                    if (nextEntry.type !== 'user' || !nextEntry.message) {
                        continue;
                    }
                    // Extract content from next entry
                    let nextContent;
                    if (typeof nextEntry.message.content === 'string') {
                        nextContent = nextEntry.message.content;
                    }
                    else if (Array.isArray(nextEntry.message.content)) {
                        nextContent = nextEntry.message.content
                            .filter(block => block.type === 'text')
                            .map(block => block.type === 'text' ? block.text : '')
                            .join('\n\n');
                    }
                    else {
                        continue;
                    }
                    // Check if this is the bash output
                    if (this.isBashOutput(nextContent)) {
                        // Merge bash input and output into a single entry
                        const command = this.extractBashCommand(content);
                        const stdout = this.extractBashStdout(nextContent);
                        const stderr = this.extractBashStderr(nextContent);
                        // Build combined content
                        let combinedContent = `$ ${command}`;
                        if (stdout) {
                            combinedContent += `\n\n${stdout}`;
                        }
                        if (stderr) {
                            combinedContent += `\n\n[stderr]\n${stderr}`;
                        }
                        return {
                            parsed: {
                                uuid: entry.uuid,
                                timestamp,
                                type: 'user',
                                content: combinedContent,
                                isSystemMessage: isSystem,
                            },
                            consumed: i + 1, // We consumed the output entry (and any entries in between)
                        };
                    }
                }
                // If we didn't find a matching output, just parse the input as-is
                const command = this.extractBashCommand(content);
                return {
                    parsed: {
                        uuid: entry.uuid,
                        timestamp,
                        type: 'user',
                        content: `$ ${command}`,
                        isSystemMessage: isSystem,
                    },
                    consumed: 0,
                };
            }
            // Check if this is a bash-output entry (orphaned, without matching input)
            if (this.isBashOutput(content)) {
                const stdout = this.extractBashStdout(content);
                const stderr = this.extractBashStderr(content);
                let outputContent = '';
                if (stdout) {
                    outputContent += stdout;
                }
                if (stderr) {
                    outputContent += (outputContent ? '\n\n' : '') + `[stderr]\n${stderr}`;
                }
                return {
                    parsed: {
                        uuid: entry.uuid,
                        timestamp,
                        type: 'user',
                        content: outputContent,
                        isSystemMessage: isSystem,
                    },
                    consumed: 0,
                };
            }
            // Mark internal meta messages (like caveats) as 'meta' type
            if (entry.isMeta) {
                return {
                    parsed: {
                        uuid: entry.uuid,
                        timestamp,
                        type: 'meta',
                        content,
                        isSystemMessage: true,
                    },
                    consumed: 0,
                };
            }
            return {
                parsed: {
                    uuid: entry.uuid,
                    timestamp,
                    type: 'user',
                    content,
                    isSystemMessage: isSystem,
                },
                consumed: 0,
            };
        }
        if (entry.type === 'assistant' && entry.message) {
            const message = entry.message;
            const textBlocks = message.content.filter(block => block.type === 'text');
            const toolUseBlocks = message.content.filter(block => block.type === 'tool_use');
            const thinkingBlocks = message.content.filter(block => block.type === 'thinking');
            // Prioritize thinking blocks first (show the reasoning)
            if (thinkingBlocks.length > 0) {
                const thinkingBlock = thinkingBlocks[0];
                if (thinkingBlock.type === 'thinking') {
                    return {
                        parsed: {
                            uuid: entry.uuid,
                            timestamp,
                            type: 'thinking',
                            content: thinkingBlock.thinking,
                            isSystemMessage: true, // Thinking is always system
                        },
                        consumed: 0,
                    };
                }
            }
            // Create an entry for text content
            const textContent = textBlocks
                .map(block => block.type === 'text' ? block.text : '')
                .join('\n\n');
            if (textContent) {
                return {
                    parsed: {
                        uuid: entry.uuid,
                        timestamp,
                        type: 'assistant',
                        content: textContent,
                        isSystemMessage: isSystem,
                    },
                    consumed: 0,
                };
            }
            // Create entries for tool uses
            if (toolUseBlocks.length > 0) {
                const toolBlock = toolUseBlocks[0];
                if (toolBlock.type === 'tool_use') {
                    return {
                        parsed: {
                            uuid: entry.uuid,
                            timestamp,
                            type: 'tool_use',
                            content: `Used tool: ${toolBlock.name}`,
                            toolName: toolBlock.name,
                            toolId: toolBlock.id,
                            toolInput: toolBlock.input,
                        },
                        consumed: 0,
                    };
                }
            }
        }
        // Parse system entries (e.g., compact boundaries)
        if (entry.type === 'system') {
            return {
                parsed: {
                    uuid: entry.uuid,
                    timestamp,
                    type: 'system',
                    content: entry.content || 'System event',
                    systemSubtype: entry.subtype,
                    compactMetadata: entry.compactMetadata,
                    isSystemMessage: true,
                },
                consumed: 0,
            };
        }
        // Parse file history snapshots
        if (entry.type === 'file-history-snapshot') {
            const fileCount = entry.snapshot?.trackedFileBackups
                ? Object.keys(entry.snapshot.trackedFileBackups).length
                : 0;
            return {
                parsed: {
                    uuid: entry.uuid,
                    timestamp,
                    type: 'file-history',
                    content: `File history snapshot (${fileCount} files tracked)`,
                    fileCount,
                    isSystemMessage: true,
                },
                consumed: 0,
            };
        }
        return { parsed: null, consumed: 0 };
    }
    /**
     * Get the timestamp of the last entry in the transcript
     * Useful for tracking session activity
     */
    async getLastEntryTimestamp(transcriptPath) {
        try {
            if (!fs.existsSync(transcriptPath)) {
                return null;
            }
            const content = fs.readFileSync(transcriptPath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());
            // Read from the end to find the last valid entry
            for (let i = lines.length - 1; i >= 0; i--) {
                try {
                    const entry = JSON.parse(lines[i]);
                    return new Date(entry.timestamp);
                }
                catch (err) {
                    // Skip invalid lines
                    continue;
                }
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Read transcript synchronously for testing
     */
    readTranscriptSync(transcriptPath) {
        try {
            if (!fs.existsSync(transcriptPath)) {
                throw new Error(`Transcript file not found: ${transcriptPath}`);
            }
            const content = fs.readFileSync(transcriptPath, 'utf-8');
            const lines = content.split('\n');
            // Pass 1: Parse all raw entries
            const rawEntries = [];
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    const entry = JSON.parse(line);
                    rawEntries.push(entry);
                }
                catch (err) {
                    console.error('Failed to parse transcript line:', err);
                    // Continue processing other lines
                }
            }
            // Pass 2: Parse entries with look-ahead capability
            const parsedEntries = [];
            let skip = 0;
            for (let i = 0; i < rawEntries.length; i++) {
                // Skip if this entry was consumed by a previous merge
                if (skip > 0) {
                    skip--;
                    continue;
                }
                const current = rawEntries[i];
                const upcoming = rawEntries.slice(i + 1, i + 4); // Look ahead up to 3 entries
                const result = this.parseEntry(current, upcoming);
                if (result.parsed) {
                    parsedEntries.push(result.parsed);
                }
                // Skip the entries that were consumed in the merge
                skip = result.consumed;
            }
            return parsedEntries;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to read transcript: ${error.message}`);
            }
            throw error;
        }
    }
}
//# sourceMappingURL=TranscriptReader.js.map
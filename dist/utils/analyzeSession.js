#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { TranscriptReader } from '../services/TranscriptReader.js';
/**
 * CLI utility to analyze recent Claude sessions
 * Reads from ~/.agent-tracker/sessions.jsonl and displays transcript info
 */
const SESSIONS_FILE = path.join(process.env.HOME || '', '.agent-tracker', 'sessions.jsonl');
async function main() {
    const args = process.argv.slice(2);
    const limit = args[0] ? parseInt(args[0], 10) : 5;
    if (!fs.existsSync(SESSIONS_FILE)) {
        console.error(`Sessions file not found: ${SESSIONS_FILE}`);
        process.exit(1);
    }
    // Read recent sessions
    const content = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const sessionStarts = [];
    for (const line of lines) {
        try {
            const event = JSON.parse(line);
            if (event.event_type === 'session_start') {
                sessionStarts.push(event);
            }
        }
        catch (err) {
            // Skip invalid lines
        }
    }
    const recentSessions = sessionStarts.slice(-limit);
    console.log(`\n📋 Analyzing ${recentSessions.length} recent session(s):\n`);
    const reader = new TranscriptReader();
    for (const session of recentSessions) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Session: ${session.session_id}`);
        console.log(`Terminal: ${session.terminal.term_program} - ${session.terminal.iterm.tab_name || 'unknown'}`);
        console.log(`Working Directory: ${session.cwd}`);
        console.log(`Started: ${new Date(session.timestamp).toLocaleString()}`);
        console.log(`Transcript: ${session.transcript_path}`);
        console.log(`${'='.repeat(80)}\n`);
        if (!fs.existsSync(session.transcript_path)) {
            console.log('❌ Transcript file not found\n');
            continue;
        }
        try {
            const entries = await reader.readTranscript(session.transcript_path);
            console.log(`📝 Total entries: ${entries.length}\n`);
            // Categorize entries
            const systemMessages = entries.filter(e => e.isSystemMessage);
            const userMessages = entries.filter(e => e.type === 'user' && !e.isSystemMessage);
            const assistantMessages = entries.filter(e => e.type === 'assistant' && !e.isSystemMessage);
            const thinkingMessages = entries.filter(e => e.type === 'thinking');
            const toolUses = entries.filter(e => e.type === 'tool_use');
            console.log(`   System messages: ${systemMessages.length}`);
            console.log(`   User messages: ${userMessages.length}`);
            console.log(`   Assistant messages: ${assistantMessages.length}`);
            console.log(`   Thinking blocks: ${thinkingMessages.length}`);
            console.log(`   Tool uses: ${toolUses.length}\n`);
            // Show system messages
            if (systemMessages.length > 0) {
                console.log(`🔧 System Messages:`);
                for (const msg of systemMessages) {
                    const preview = msg.content.substring(0, 100).replace(/\n/g, ' ');
                    console.log(`   [${msg.type}] ${preview}${msg.content.length > 100 ? '...' : ''}`);
                }
                console.log();
            }
            // Show first few user messages
            if (userMessages.length > 0) {
                console.log(`💬 First User Message:`);
                const first = userMessages[0];
                const preview = first.content.substring(0, 150).replace(/\n/g, ' ');
                console.log(`   ${preview}${first.content.length > 150 ? '...' : ''}`);
                console.log();
            }
        }
        catch (err) {
            console.error(`❌ Error reading transcript: ${err}`);
        }
    }
}
main().catch(console.error);
//# sourceMappingURL=analyzeSession.js.map
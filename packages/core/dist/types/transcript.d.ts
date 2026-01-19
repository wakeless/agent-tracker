export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock | ToolResultBlock;
export interface TextBlock {
    type: 'text';
    text: string;
}
export interface ToolUseBlock {
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, unknown>;
}
export interface ThinkingBlock {
    type: 'thinking';
    thinking: string;
    signature?: string;
}
export interface ToolResultBlock {
    type: 'tool_result';
    tool_use_id: string;
    content: string;
    is_error: boolean | null;
}
export interface TranscriptEntry {
    parentUuid: string | null;
    logicalParentUuid?: string;
    isSidechain: boolean;
    userType: string;
    cwd: string;
    sessionId: string;
    version: string;
    gitBranch?: string;
    type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system' | 'file-history-snapshot';
    message?: UserMessage | AssistantMessage;
    uuid: string;
    timestamp: string;
    requestId?: string;
    subtype?: string;
    content?: string;
    isMeta?: boolean;
    level?: string;
    compactMetadata?: {
        trigger: string;
        preTokens: number;
    };
    snapshot?: any;
    isSnapshotUpdate?: boolean;
}
export interface UserMessage {
    role: 'user';
    content: string | ContentBlock[];
}
export interface AssistantMessage {
    model: string;
    id: string;
    type: 'message';
    role: 'assistant';
    content: ContentBlock[];
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: Usage;
}
export interface Usage {
    input_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
    cache_creation?: {
        ephemeral_5m_input_tokens: number;
        ephemeral_1h_input_tokens: number;
    };
    output_tokens: number;
    service_tier: string;
}
export interface ParsedTranscriptEntry {
    uuid: string;
    timestamp: Date;
    type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'thinking' | 'system' | 'file-history' | 'meta';
    content: string;
    toolName?: string;
    toolId?: string;
    toolInput?: Record<string, unknown>;
    toolUseId?: string;
    isError?: boolean | null;
    systemSubtype?: string;
    compactMetadata?: {
        trigger: string;
        preTokens: number;
    };
    fileCount?: number;
    isSystemMessage?: boolean;
}
/**
 * Identifies if a transcript entry is a system message.
 * System messages include:
 * - Sidechain messages (warmup, etc.)
 * - System type entries
 * - Meta messages
 *
 * Note: This checks the raw TranscriptEntry.
 * For parsed entries, check if ParsedTranscriptEntry.isSystemMessage is true
 * or if type is 'thinking', 'system', 'meta', or 'file-history'
 */
export declare function isSystemMessage(entry: TranscriptEntry): boolean;
//# sourceMappingURL=transcript.d.ts.map
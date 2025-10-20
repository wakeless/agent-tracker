export interface ToolDisplayProps {
    toolName: string;
    toolInput: Record<string, unknown>;
    toolId: string;
    mode: 'collapsed' | 'expanded';
}
export interface TodoWriteInput {
    todos: Array<{
        content: string;
        activeForm: string;
        status: 'pending' | 'in_progress' | 'completed';
    }>;
}
export interface BashInput {
    command: string;
    description?: string;
    timeout?: number;
    run_in_background?: boolean;
}
export interface EditInput {
    file_path: string;
    old_string: string;
    new_string: string;
    replace_all?: boolean;
}
export interface ReadInput {
    file_path: string;
    offset?: number;
    limit?: number;
}
export interface WebFetchInput {
    url: string;
    prompt: string;
}
export interface GlobInput {
    pattern: string;
    path?: string;
}
export interface GrepInput {
    pattern: string;
    path?: string;
    output_mode?: 'content' | 'files_with_matches' | 'count';
    glob?: string;
    type?: string;
}
export interface WriteInput {
    file_path: string;
    content: string;
}
export declare function isTodoWriteInput(input: unknown): input is TodoWriteInput;
export declare function isBashInput(input: unknown): input is BashInput;
export declare function isEditInput(input: unknown): input is EditInput;
export declare function isReadInput(input: unknown): input is ReadInput;
export declare function isWebFetchInput(input: unknown): input is WebFetchInput;
export declare function isGlobInput(input: unknown): input is GlobInput;
export declare function isGrepInput(input: unknown): input is GrepInput;
export declare function isWriteInput(input: unknown): input is WriteInput;
//# sourceMappingURL=ToolDisplayProps.d.ts.map
// Shared types and interfaces for tool display components

export interface ToolDisplayProps {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolId: string;
  mode: 'collapsed' | 'expanded';
}

// Specific tool input types

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

// Type guards

export function isTodoWriteInput(input: unknown): input is TodoWriteInput {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return (
    'todos' in obj &&
    Array.isArray(obj.todos) &&
    obj.todos.every(
      (t) =>
        typeof t === 'object' &&
        t !== null &&
        'content' in t &&
        'activeForm' in t &&
        'status' in t
    )
  );
}

export function isBashInput(input: unknown): input is BashInput {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return 'command' in obj && typeof obj.command === 'string';
}

export function isEditInput(input: unknown): input is EditInput {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return (
    'file_path' in obj &&
    typeof obj.file_path === 'string' &&
    'old_string' in obj &&
    'new_string' in obj
  );
}

export function isReadInput(input: unknown): input is ReadInput {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return 'file_path' in obj && typeof obj.file_path === 'string';
}

export function isWebFetchInput(input: unknown): input is WebFetchInput {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return (
    'url' in obj &&
    typeof obj.url === 'string' &&
    'prompt' in obj &&
    typeof obj.prompt === 'string'
  );
}

export function isGlobInput(input: unknown): input is GlobInput {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return 'pattern' in obj && typeof obj.pattern === 'string';
}

export function isGrepInput(input: unknown): input is GrepInput {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return 'pattern' in obj && typeof obj.pattern === 'string';
}

export function isWriteInput(input: unknown): input is WriteInput {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return (
    'file_path' in obj &&
    typeof obj.file_path === 'string' &&
    'content' in obj &&
    typeof obj.content === 'string'
  );
}

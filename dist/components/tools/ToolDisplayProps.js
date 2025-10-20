// Shared types and interfaces for tool display components
// Type guards
export function isTodoWriteInput(input) {
    if (typeof input !== 'object' || input === null)
        return false;
    const obj = input;
    return ('todos' in obj &&
        Array.isArray(obj.todos) &&
        obj.todos.every((t) => typeof t === 'object' &&
            t !== null &&
            'content' in t &&
            'activeForm' in t &&
            'status' in t));
}
export function isBashInput(input) {
    if (typeof input !== 'object' || input === null)
        return false;
    const obj = input;
    return 'command' in obj && typeof obj.command === 'string';
}
export function isEditInput(input) {
    if (typeof input !== 'object' || input === null)
        return false;
    const obj = input;
    return ('file_path' in obj &&
        typeof obj.file_path === 'string' &&
        'old_string' in obj &&
        'new_string' in obj);
}
export function isReadInput(input) {
    if (typeof input !== 'object' || input === null)
        return false;
    const obj = input;
    return 'file_path' in obj && typeof obj.file_path === 'string';
}
export function isWebFetchInput(input) {
    if (typeof input !== 'object' || input === null)
        return false;
    const obj = input;
    return ('url' in obj &&
        typeof obj.url === 'string' &&
        'prompt' in obj &&
        typeof obj.prompt === 'string');
}
export function isGlobInput(input) {
    if (typeof input !== 'object' || input === null)
        return false;
    const obj = input;
    return 'pattern' in obj && typeof obj.pattern === 'string';
}
export function isGrepInput(input) {
    if (typeof input !== 'object' || input === null)
        return false;
    const obj = input;
    return 'pattern' in obj && typeof obj.pattern === 'string';
}
export function isWriteInput(input) {
    if (typeof input !== 'object' || input === null)
        return false;
    const obj = input;
    return ('file_path' in obj &&
        typeof obj.file_path === 'string' &&
        'content' in obj &&
        typeof obj.content === 'string');
}
//# sourceMappingURL=ToolDisplayProps.js.map
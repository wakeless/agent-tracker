/**
 * JSON Utilities for Hook Scripts
 * Replaces jq functionality with TypeScript implementations
 */
/**
 * Parse JSON input from a string
 * @param input - JSON string to parse
 * @returns Parsed JSON object
 * @throws Error if JSON is invalid
 */
export function parseJsonInput(input) {
    if (!input || input.trim() === '') {
        throw new Error('Empty input');
    }
    try {
        return JSON.parse(input);
    }
    catch (error) {
        throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Create compact single-line JSON output
 * @param data - Data to convert to JSON
 * @returns Compact JSON string (no whitespace)
 */
export function createJsonOutput(data) {
    return JSON.stringify(data);
}
/**
 * Extract a field from an object with a default value
 * Supports dot notation for nested fields (e.g., 'terminal.iterm.tab_name')
 * @param data - Object to extract from
 * @param path - Field path (supports dot notation)
 * @param defaultValue - Default value if field is missing or null/undefined
 * @returns Field value or default
 */
export function extractField(data, path, defaultValue) {
    if (!data || typeof data !== 'object') {
        return defaultValue;
    }
    const parts = path.split('.');
    let current = data;
    for (const part of parts) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return defaultValue;
        }
        current = current[part];
        if (current === null || current === undefined) {
            return defaultValue;
        }
    }
    // Empty string is a valid value, don't use default
    if (current === '') {
        return current;
    }
    return current;
}
//# sourceMappingURL=json-utils.js.map
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
export declare function parseJsonInput(input: string): unknown;
/**
 * Create compact single-line JSON output
 * @param data - Data to convert to JSON
 * @returns Compact JSON string (no whitespace)
 */
export declare function createJsonOutput(data: unknown): string;
/**
 * Extract a field from an object with a default value
 * Supports dot notation for nested fields (e.g., 'terminal.iterm.tab_name')
 * @param data - Object to extract from
 * @param path - Field path (supports dot notation)
 * @param defaultValue - Default value if field is missing or null/undefined
 * @returns Field value or default
 */
export declare function extractField<T>(data: unknown, path: string, defaultValue: T): T;
//# sourceMappingURL=json-utils.d.ts.map
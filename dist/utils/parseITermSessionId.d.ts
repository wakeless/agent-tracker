/**
 * Parser for iTerm2 session IDs
 *
 * iTerm2 session IDs encode the terminal hierarchy in the format:
 * w{window}t{tab}p{pane}:{uuid}
 *
 * Examples:
 * - "w0t4p2:abc-123" = Window 0, Tab 4, Pane 2, UUID abc-123
 * - "w1t0p0:xyz-789" = Window 1, Tab 0, Pane 0, UUID xyz-789
 */
export interface ITermSessionParts {
    window: number;
    tab: number;
    pane: number;
    uuid: string;
    isValid: boolean;
}
/**
 * Parses an iTerm2 session ID into its component parts
 *
 * @param sessionId - The iTerm session ID string (format: w{window}t{tab}p{pane}:{uuid})
 * @returns Parsed session parts with isValid flag
 *
 * @example
 * ```ts
 * parseITermSessionId("w0t4p2:abc-123")
 * // Returns: { window: 0, tab: 4, pane: 2, uuid: "abc-123", isValid: true }
 *
 * parseITermSessionId("unknown")
 * // Returns: { window: 0, tab: 0, pane: 0, uuid: "", isValid: false }
 * ```
 */
export declare function parseITermSessionId(sessionId: string): ITermSessionParts;
//# sourceMappingURL=parseITermSessionId.d.ts.map
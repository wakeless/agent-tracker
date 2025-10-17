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
export function parseITermSessionId(sessionId: string): ITermSessionParts {
  // Handle edge cases
  if (!sessionId || sessionId === 'unknown' || sessionId.trim() === '') {
    return {
      window: 0,
      tab: 0,
      pane: 0,
      uuid: '',
      isValid: false,
    };
  }

  // Parse iTerm session ID format: w{window}t{tab}p{pane}:{uuid}
  const pattern = /^w(\d+)t(\d+)p(\d+):(.+)$/;
  const match = sessionId.match(pattern);

  if (!match) {
    return {
      window: 0,
      tab: 0,
      pane: 0,
      uuid: '',
      isValid: false,
    };
  }

  return {
    window: parseInt(match[1], 10),
    tab: parseInt(match[2], 10),
    pane: parseInt(match[3], 10),
    uuid: match[4],
    isValid: true,
  };
}

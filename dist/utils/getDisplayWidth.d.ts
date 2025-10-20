/**
 * Get the actual display width of text, accounting for terminal-specific
 * rendering of wide characters.
 *
 * Some terminals (like iTerm2 with certain fonts) render some "wide" emoji
 * characters (like ✳ U+2733) as single-width instead of double-width,
 * even though string-width reports them as 2 columns.
 */
export declare function getDisplayWidth(text: string): number;
//# sourceMappingURL=getDisplayWidth.d.ts.map
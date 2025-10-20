import stringWidth from 'string-width';
/**
 * Get the actual display width of text, accounting for terminal-specific
 * rendering of wide characters.
 *
 * Some terminals (like iTerm2 with certain fonts) render some "wide" emoji
 * characters (like ✳ U+2733) as single-width instead of double-width,
 * even though string-width reports them as 2 columns.
 */
export function getDisplayWidth(text) {
    const baseWidth = stringWidth(text);
    // Check if text contains the eight-spoked asterisk (✳)
    // This character is reported as width=2 by string-width but often
    // renders as width=1 in many terminals
    const eightSpokedCount = (text.match(/✳/g) || []).length;
    if (eightSpokedCount > 0) {
        // Adjust: each ✳ is counted as 2 by string-width but actually renders as 1
        // So subtract 1 for each occurrence
        return baseWidth - eightSpokedCount;
    }
    return baseWidth;
}
//# sourceMappingURL=getDisplayWidth.js.map
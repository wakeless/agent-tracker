/**
 * Stable Color Generator
 *
 * Generates consistent colors for strings using hash-based color generation.
 * Ported from statusline-ascii.sh to provide stable, visually distinct colors
 * for project names, branch names, and other identifiers.
 */
/**
 * Calculates a numeric hash from a string using polynomial rolling hash.
 * Same algorithm as the bash implementation for consistency.
 */
export function calculateHash(text) {
    let hash = 0;
    const maxInt = 2147483647; // 2^31 - 1
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        hash = (hash * 31 + charCode) % maxInt;
    }
    return hash;
}
/**
 * Generates RGB values from a hash.
 * Uses the same distribution as the bash script (32-223 for each channel).
 */
export function generateRgbFromHash(hash) {
    // Use different parts of the hash for better distribution
    const r = (hash % 192) + 32; // Red: 32-223 (wider range)
    const g = (Math.floor(hash / 256) % 192) + 32; // Green: 32-223
    const b = (Math.floor(hash / 65536) % 192) + 32; // Blue: 32-223
    return { r, g, b };
}
/**
 * Calculates the appropriate text contrast (light or dark) for a given background color.
 * Uses standard luminance calculation.
 *
 * @returns 0 for dark text (on light backgrounds), 255 for light text (on dark backgrounds)
 */
export function calculateTextContrast(rgb) {
    // Calculate luminance using standard formula
    const luminance = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    if (luminance > 128) {
        return 0; // Dark text for light backgrounds
    }
    else {
        return 255; // Light text for dark backgrounds
    }
}
/**
 * Converts an RGB value to a hex color string.
 */
export function rgbToHex(rgb) {
    const toHex = (n) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}
/**
 * Generates a stable color for a given text string.
 *
 * @param text - The string to generate a color for
 * @returns An object containing the background color (hex), foreground color (hex), and RGB values
 */
export function getStableColor(text) {
    const hash = calculateHash(text);
    const rgb = generateRgbFromHash(hash);
    const textContrast = calculateTextContrast(rgb);
    const backgroundColor = rgbToHex(rgb);
    const foregroundColor = textContrast === 0 ? '#000000' : '#FFFFFF';
    return {
        backgroundColor,
        foregroundColor,
        rgb,
    };
}
/**
 * Generates a stable foreground-only color for text.
 * This version is suitable for colored text without backgrounds.
 *
 * @param text - The string to generate a color for
 * @returns A hex color string suitable for text color
 */
export function getStableTextColor(text) {
    const hash = calculateHash(text);
    const rgb = generateRgbFromHash(hash);
    return rgbToHex(rgb);
}
//# sourceMappingURL=stableColors.js.map
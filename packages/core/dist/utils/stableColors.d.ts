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
export declare function calculateHash(text: string): number;
/**
 * RGB color values
 */
export interface RGB {
    r: number;
    g: number;
    b: number;
}
/**
 * Generates RGB values from a hash.
 * Uses the same distribution as the bash script (32-223 for each channel).
 */
export declare function generateRgbFromHash(hash: number): RGB;
/**
 * Calculates the appropriate text contrast (light or dark) for a given background color.
 * Uses standard luminance calculation.
 *
 * @returns 0 for dark text (on light backgrounds), 255 for light text (on dark backgrounds)
 */
export declare function calculateTextContrast(rgb: RGB): number;
/**
 * Converts an RGB value to a hex color string.
 */
export declare function rgbToHex(rgb: RGB): string;
/**
 * Generates a stable color for a given text string.
 *
 * @param text - The string to generate a color for
 * @returns An object containing the background color (hex), foreground color (hex), and RGB values
 */
export declare function getStableColor(text: string): {
    backgroundColor: string;
    foregroundColor: string;
    rgb: RGB;
};
/**
 * Generates a stable foreground-only color for text.
 * This version is suitable for colored text without backgrounds.
 *
 * @param text - The string to generate a color for
 * @returns A hex color string suitable for text color
 */
export declare function getStableTextColor(text: string): string;
//# sourceMappingURL=stableColors.d.ts.map
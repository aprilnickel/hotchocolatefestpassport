/**
 * Utility functions for string manipulation
 */

/**
 * Create a URL-friendly slug from a text string
 * @param text - The text to convert to a slug
 * @returns URL-friendly slug
 * @example
 * slugify("Berry Sweet 16") // "berry-sweet-16"
 * slugify("Li Chu Legacy") // "li-chu-legacy"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

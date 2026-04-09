import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Create a unique slug from a base slug and a fallback slug
 * @param baseSlug - The base slug to use
 * @param fallbackSlug - The fallback slug to use if the base slug is not available
 * @param used - The set of used slugs
 * @returns A unique slug
 * @example
 * uniqueSlug("berry-sweet-16", "drink", new Set(["berry-sweet-16"])) // "berry-sweet-16-1"
 */
export function uniqueSlug(baseSlug: string, fallbackSlug: string, used: Set<string>): string {
  let slug = baseSlug || fallbackSlug;
  let n = 0;
  while (used.has(slug)) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  used.add(slug);
  return slug;
}

/**
 * Get the value of an argument passed to the script
 * @param flag - The flag to get the value of (e.g. "--file")
 * @returns The value of the argument
 * @example
 * getArgValue("--file") // "data/hotchocolatefest-vendors-and-drinks-scraped-20260324.json"
 */
export function getArgValue(flag: string): string | undefined {
  const argList = process.argv.slice(2);
  const match = argList.find((arg) => arg === flag || arg.startsWith(`${flag}=`));
  if (!match) return undefined;
  if (match.startsWith(`${flag}=`)) {
    return match.slice(flag.length + 1);
  }
  const flagIndex = argList.indexOf(match);
  const nextValue = argList[flagIndex + 1];
  if (!nextValue || nextValue.startsWith("-")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return nextValue;
}

/**
 * Strip HTML tags for plain-text fields (drink detail renders description as text).
 * @param htmlStr - The HTML to convert to plain text
 * @returns The plain text
 * @example
 * htmlToPlainText("<p>Berry Sweet 16</p>") // "Berry Sweet 16"
 */
export function htmlToPlainText(htmlStr: string): string {
  return htmlStr
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
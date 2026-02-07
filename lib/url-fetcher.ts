/**
 * URL Fetcher — Fetches external URL content for AI scheduling context.
 *
 * Supports PDF and HTML content. Caches results for 5 minutes.
 * Truncates content to avoid prompt bloat.
 */

export interface DynamicSource {
  url: string;
  description: string;
}

interface CacheEntry {
  content: string;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CONTENT_LENGTH = 2000;
const cache = new Map<string, CacheEntry>();

function getCached(url: string): string | null {
  const entry = cache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(url);
    return null;
  }
  return entry.content;
}

function setCache(url: string, content: string) {
  cache.set(url, { content, timestamp: Date.now() });
}

async function fetchPDF(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  // Lazy-load pdf-parse to avoid DOMMatrix errors at module init time
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text;
}

async function fetchHTML(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`);
  const html = await response.text();
  // Strip HTML tags, scripts, styles
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchContent(url: string): Promise<string> {
  const cached = getCached(url);
  if (cached) return cached;

  let content: string;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith(".pdf") || lowerUrl.includes(".pdf?")) {
    content = await fetchPDF(url);
  } else {
    content = await fetchHTML(url);
  }

  // Truncate
  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.slice(0, MAX_CONTENT_LENGTH) + "\n... [content truncated]";
  }

  setCache(url, content);
  return content;
}

/**
 * Fetch all dynamic sources and format them as context for the AI.
 */
export async function fetchDynamicSourcesContext(
  sources: DynamicSource[],
): Promise<string> {
  if (sources.length === 0) return "";

  const parts: string[] = [];

  for (const source of sources) {
    try {
      const content = await fetchContent(source.url);
      parts.push(
        `=== External Source ===\nURL: ${source.url}\nUser notes: ${source.description}\nContent:\n${content}`,
      );
    } catch (error) {
      parts.push(
        `=== External Source (FAILED) ===\nURL: ${source.url}\nUser notes: ${source.description}\nError: ${error instanceof Error ? error.message : "Failed to fetch"}`,
      );
    }
  }

  return parts.join("\n\n");
}

import { Page } from "playwright";

export interface ExtractedLink {
  url: string;
  text: string;
  internal: boolean;
}

export async function extractLinksFromPage(
  page: Page,
  baseUrl: string
): Promise<ExtractedLink[]> {
  const baseHost = new URL(baseUrl).hostname;

  return page.evaluate((hostName: string) => {
    const links: ExtractedLink[] = [];
    const visitedUrls = new Set<string>();

    document.querySelectorAll("a[href]").forEach((el) => {
      const href = el.getAttribute("href");
      if (!href) return;

      try {
        const url = new URL(href, window.location.origin);
        const urlString = url.toString();

        // Skip if already visited
        if (visitedUrls.has(urlString)) return;
        visitedUrls.add(urlString);

        // Skip fragments and anchors
        if (urlString.includes("#")) return;

        // Skip common non-content file types
        const skipExtensions = [
          ".pdf",
          ".zip",
          ".exe",
          ".dmg",
          ".docx",
          ".xlsx",
          ".pptx",
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".css",
          ".js",
          ".woff",
          ".woff2",
        ];
        if (skipExtensions.some((ext) => urlString.toLowerCase().endsWith(ext)))
          return;

        const isInternal = url.hostname === hostName;
        const text = el.textContent?.trim() || "";

        links.push({
          url: urlString,
          text,
          internal: isInternal,
        });
      } catch {
        // Invalid URL, skip
      }
    });

    return links;
  }, baseHost);
}

export function filterInternalLinks(
  links: ExtractedLink[],
  baseUrl: string,
  excludePatterns: string[] = []
): string[] {
  const baseHost = new URL(baseUrl).hostname;

  return links
    .filter((link) => {
      // Only internal links
      if (!link.internal) return false;

      // Check exclude patterns
      if (excludePatterns.some((pattern) => link.url.includes(pattern))) {
        return false;
      }

      return true;
    })
    .map((link) => link.url)
    .filter((value, index, self) => self.indexOf(value) === index); // Unique
}

export function getPathDepth(url: string): number {
  try {
    const path = new URL(url).pathname;
    return path.split("/").filter((p) => p.length > 0).length;
  } catch {
    return 0;
  }
}

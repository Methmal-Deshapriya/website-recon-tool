import { Page, Browser, BrowserContext } from "playwright";
import { log, logDebug } from "../utils/logger";
import { AutoCrawlConfig } from "../utils/config";
import { extractLinksFromPage, filterInternalLinks, getPathDepth } from "./linkExtractor";
import { waitForStablePage } from "../utils/waitForStablePage";

export interface DiscoveredPage {
  name: string;
  url: string;
  depth: number;
  contentLength: number;
}

export class BFSCrawler {
  private config: AutoCrawlConfig;
  private baseUrl: string;
  private discovered: Map<string, DiscoveredPage> = new Map();
  private visited: Set<string> = new Set();

  constructor(baseUrl: string, config: AutoCrawlConfig) {
    this.baseUrl = baseUrl;
    this.config = config;
  }

  async crawl(page: Page): Promise<DiscoveredPage[]> {
    log(`\n🔍 Starting BFS crawler...`);
    log(`   Base URL: ${this.baseUrl}`);
    log(`   Max pages: ${this.config.maxPages}`);
    log(`   Max depth: ${this.config.maxDepth}`);

    const queue: { url: string; depth: number }[] = [
      { url: this.baseUrl, depth: 0 },
    ];

    while (queue.length > 0 && this.discovered.size < this.config.maxPages) {
      const { url, depth } = queue.shift()!;

      // Skip if already visited
      if (this.visited.has(url)) continue;
      this.visited.add(url);

      // Skip if URL path depth exceeds maxDepth
      const urlPathDepth = getPathDepth(url);
      if (urlPathDepth > this.config.maxDepth) {
        logDebug(`Skipping ${url} - URL path depth (${urlPathDepth}) exceeds max (${this.config.maxDepth})`);
        continue;
      }

      // Skip if max pages reached
      if (this.discovered.size >= this.config.maxPages) {
        logDebug(`Max pages reached (${this.config.maxPages})`);
        break;
      }

      try {
        logDebug(`Crawling: ${url} (depth: ${depth})`);

        await this.delay(this.config.delayMs);
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await waitForStablePage(page);

        // Get page content length
        const contentLength = await page.evaluate(
          () => document.documentElement.outerHTML.length
        );

        // Skip pages with very little content
        if (contentLength < this.config.minContentLength) {
          logDebug(
            `Skipping ${url} - content too short (${contentLength} chars)`
          );
          continue;
        }

        // Extract page name from URL
        const pageName = this.extractPageName(url);

        // Store discovered page
        this.discovered.set(url, {
          name: pageName,
          url,
          depth,
          contentLength,
        });

        logDebug(
          `✓ Discovered: ${pageName} (${contentLength} chars, depth: ${depth})`
        );

        // Extract links for next level
        const links = await extractLinksFromPage(page, this.baseUrl);
        const filtered = filterInternalLinks(
          links,
          this.baseUrl,
          this.config.excludePatterns
        );

        // Add to queue (prioritize by content if enabled)
        for (const link of filtered) {
          if (!this.visited.has(link) && !this.discovered.has(link)) {
            queue.push({ url: link, depth: depth + 1 });
          }
        }

        if (this.config.prioritizeByContent) {
          queue.sort((a, b) => b.depth - a.depth); // Depth-first-ish sorting
        }
      } catch (error) {
        logDebug(`Error crawling ${url}: ${(error as Error).message}`);
        // Continue with next URL
      }
    }

    const pages = Array.from(this.discovered.values());
    log(`\n✓ BFS complete: discovered ${pages.length} pages`);

    return pages;
  }

  private extractPageName(url: string): string {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      // Remove trailing slash
      const cleaned = path.replace(/\/$/, "");

      // Get last segment
      const segments = cleaned.split("/").filter((s) => s.length > 0);
      if (segments.length === 0) return "home";

      // Convert to name (replace hyphens with underscores, remove special chars)
      const name = segments[segments.length - 1]
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-");

      return name || "page";
    } catch {
      return "page";
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getDiscoveredPages(): DiscoveredPage[] {
    return Array.from(this.discovered.values());
  }

  clear(): void {
    this.discovered.clear();
    this.visited.clear();
  }
}

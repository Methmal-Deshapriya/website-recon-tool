import { Page } from "playwright";
import { log, logDebug } from "../utils/logger";
import { AutoCrawlConfig, Page as ConfigPage } from "../utils/config";
import { getSitemapUrls } from "./sitemapParser";
import { BFSCrawler, DiscoveredPage } from "./bfsCrawler";

export interface CrawledPages {
  source: "manual" | "sitemap" | "bfs";
  pages: ConfigPage[];
}

export async function discoverPages(
  baseUrl: string,
  manualPages: ConfigPage[] | undefined,
  autoCrawlConfig: AutoCrawlConfig | undefined,
  page: Page
): Promise<CrawledPages> {
  // If auto-crawl is disabled, use manual pages
  if (!autoCrawlConfig || !autoCrawlConfig.enabled) {
    if (!manualPages || manualPages.length === 0) {
      throw new Error(
        "No pages configured and auto-crawl is disabled. Configure 'pages' or enable 'autoCrawl.enabled'."
      );
    }
    logDebug("Using manually configured pages");
    return { source: "manual", pages: manualPages };
  }

  // Try sitemap first
  logDebug("Checking for sitemap...");
  const sitemapUrls = await getSitemapUrls(baseUrl);

  if (sitemapUrls.length > 0) {
    log(`\n📋 Using sitemap for page discovery`);
    const pages = sitemapUrls
      .slice(0, autoCrawlConfig.maxPages)
      .map((url, index) => ({
        name: `page-${index + 1}`,
        url,
      }));

    return { source: "sitemap", pages };
  }

  // Fall back to BFS
  log(`\n🔍 No sitemap found, using BFS crawler`);
  const crawler = new BFSCrawler(baseUrl, autoCrawlConfig);
  const discoveredPages = await crawler.crawl(page);

  const pages = discoveredPages.map((dp) => ({
    name: dp.name,
    url: dp.url,
  }));

  return { source: "bfs", pages };
}

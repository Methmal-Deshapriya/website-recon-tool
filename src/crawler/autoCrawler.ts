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

  // Start with manual pages if provided
  const allPages: ConfigPage[] = manualPages ? [...manualPages] : [];

  // Try sitemap first
  logDebug("Checking for sitemap...");
  const sitemapUrls = await getSitemapUrls(baseUrl);

  if (sitemapUrls.length > 0) {
    log(`\n📋 Using sitemap for page discovery`);
    const discoveredUrls = sitemapUrls.map((url) => url);

    // Add discovered pages, avoiding duplicates
    const existingUrls = new Set(allPages.map(p => p.url));
    for (const url of discoveredUrls) {
      if (!existingUrls.has(url) && allPages.length < autoCrawlConfig.maxPages) {
        allPages.push({
          name: `page-${allPages.length}`,
          url,
        });
      }
    }

    log(`\n📋 Combined manual (${manualPages?.length || 0}) + sitemap (${allPages.length - (manualPages?.length || 0)}) = ${allPages.length} pages`);
    return { source: "sitemap", pages: allPages };
  }

  // Fall back to BFS
  log(`\n🔍 No sitemap found, using BFS crawler`);
  const crawler = new BFSCrawler(baseUrl, autoCrawlConfig);
  const discoveredPages = await crawler.crawl(page);

  // Add discovered pages, avoiding duplicates
  const existingUrls = new Set(allPages.map(p => p.url));
  for (const dp of discoveredPages) {
    if (!existingUrls.has(dp.url) && allPages.length < autoCrawlConfig.maxPages) {
      allPages.push({
        name: dp.name,
        url: dp.url,
      });
    }
  }

  log(`\n📋 Combined manual (${manualPages?.length || 0}) + BFS (${allPages.length - (manualPages?.length || 0)}) = ${allPages.length} pages`);
  return { source: "bfs", pages: allPages };
}

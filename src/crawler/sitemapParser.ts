import { log, logError, logDebug } from "../utils/logger";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    logDebug(`Failed to fetch ${url}`);
    return null;
  }
}

async function getRobotsText(baseUrl: string): Promise<string | null> {
  const url = new URL("/robots.txt", baseUrl).toString();
  logDebug(`Checking for robots.txt: ${url}`);
  return fetchText(url);
}

function extractSitemapUrl(robotsTxt: string): string | null {
  const match = robotsTxt.match(/Sitemap:\s*(.+?)(\s|$)/i);
  return match ? match[1].trim() : null;
}

function parseXmlUrls(xmlContent: string): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  let match;

  while ((match = locRegex.exec(xmlContent)) !== null) {
    urls.push(match[1].trim());
  }

  return urls;
}

export async function getSitemapUrls(baseUrl: string): Promise<string[]> {
  try {
    logDebug("Attempting to get sitemap URLs...");

    // Try to get sitemap URL from robots.txt
    const robotsTxt = await getRobotsText(baseUrl);
    if (robotsTxt) {
      const sitemapUrl = extractSitemapUrl(robotsTxt);
      if (sitemapUrl) {
        logDebug(`Found sitemap URL in robots.txt: ${sitemapUrl}`);
        const sitemapContent = await fetchText(sitemapUrl);
        if (sitemapContent) {
          const urls = parseXmlUrls(sitemapContent);
          log(`✓ Sitemap found: ${urls.length} URLs discovered`);
          return urls;
        }
      }
    }

    // Try common sitemap locations
    const commonLocations = [
      "/sitemap.xml",
      "/sitemap_index.xml",
      "/sitemap1.xml",
    ];

    for (const location of commonLocations) {
      const url = new URL(location, baseUrl).toString();
      logDebug(`Checking sitemap location: ${url}`);
      const content = await fetchText(url);
      if (content) {
        const urls = parseXmlUrls(content);
        log(`✓ Sitemap found at ${location}: ${urls.length} URLs discovered`);
        return urls;
      }
    }

    logDebug("No sitemap found");
    return [];
  } catch (error) {
    logError("Error getting sitemap URLs", error);
    return [];
  }
}

export async function checkSitemapExists(baseUrl: string): Promise<boolean> {
  const urls = await getSitemapUrls(baseUrl);
  return urls.length > 0;
}

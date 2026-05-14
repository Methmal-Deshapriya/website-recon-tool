import { Page } from "playwright";

export interface Link {
  text: string;
  href: string;
  isInternal: boolean;
  isExternal: boolean;
}

export async function extractLinks(page: Page): Promise<Link[]> {
  const baseUrl = page.url();
  const baseHost = new URL(baseUrl).hostname;

  return page.evaluate((hostName: string) => {
    const links: Link[] = [];
    const linkElements = document.querySelectorAll("a");

    linkElements.forEach((el) => {
      const href = el.getAttribute("href") || "";
      const text = el.textContent?.trim() || "";

      if (!href || !text) return;

      let isInternal = false;
      let isExternal = false;

      try {
        const linkUrl = new URL(href, window.location.origin);
        const linkHost = linkUrl.hostname;
        isInternal = linkHost === hostName;
        isExternal = !isInternal;
      } catch {
        isInternal = !href.startsWith("http");
        isExternal = href.startsWith("http");
      }

      links.push({
        text,
        href,
        isInternal,
        isExternal,
      });
    });

    return links;
  }, baseHost);
}

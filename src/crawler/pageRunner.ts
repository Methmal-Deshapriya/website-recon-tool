import { Page } from "playwright";
import { log, logError, logDebug } from "../utils/logger";
import { waitForStablePage } from "../utils/waitForStablePage";
import { OutputWriter } from "../storage/outputWriter";
import { NetworkRecorder } from "../network/networkRecorder";
import { extractButtons } from "../extractors/extractButtons";
import { extractForms } from "../extractors/extractForms";
import { extractInputs } from "../extractors/extractInputs";
import { extractLinks } from "../extractors/extractLinks";
import { extractTables } from "../extractors/extractTables";
import { extractMetadata } from "../extractors/extractMetadata";

export interface PageRunnerConfig {
  siteName: string;
  pageName: string;
  url: string;
  outputBasePath: string;
}

export class PageRunner {
  private config: PageRunnerConfig;
  private writer: OutputWriter;
  private networkRecorder: NetworkRecorder;

  constructor(config: PageRunnerConfig) {
    this.config = config;
    this.writer = new OutputWriter({
      basePath: config.outputBasePath,
      siteName: config.siteName,
      pageName: config.pageName,
    });
    this.networkRecorder = new NetworkRecorder();
  }

  async run(page: Page): Promise<void> {
    try {
      await this.writer.initialize();

      log(`[${this.config.siteName}/${this.config.pageName}] Starting recon...`);

      this.networkRecorder.clear();
      this.networkRecorder.attach(page);
      await this.navigateToPage(page);
      await this.captureSnapshots(page);
      await this.extractElements(page);
      await this.saveNetworkData();

      log(`[${this.config.siteName}/${this.config.pageName}] Recon completed`);
    } catch (error) {
      logError(`Failed to run page recon for ${this.config.pageName}`, error);
      throw error;
    }
  }

  private async navigateToPage(page: Page): Promise<void> {
    log(`Navigating to: ${this.config.url}`);
    await page.goto(this.config.url, { waitUntil: "domcontentloaded" });
    await waitForStablePage(page);

    const actualUrl = page.url();
    log("Page loaded and stable");

    if (actualUrl !== this.config.url) {
      log(`⚠️  REDIRECT DETECTED:`);
      log(`   Requested: ${this.config.url}`);
      log(`   Actual:    ${actualUrl}`);
      log(`   This means the server redirected the request.`);
    }
  }

  private async captureSnapshots(page: Page): Promise<void> {
    log("Capturing snapshots...");

    // Auto-scroll to trigger lazy-loaded images
    log("Auto-scrolling to trigger lazy-loading...");
    await this.autoScrollPage(page);

    // Wait for stability after scrolling
    await waitForStablePage(page);
    log("Scroll complete, page stable");

    // Create self-contained SingleFile-like HTML snapshot
    logDebug("Creating self-contained HTML snapshot...");
    const completeHtml = await this.createSingleFileSnapshot(page);
    await this.writer.writeHTML("dom-complete.html", completeHtml);

    // Capture text content
    const textContent = await page.evaluate(() => document.body.innerText);
    await this.writer.writeText("text.txt", textContent);

    // Capture full-page screenshot
    const screenshot = await page.screenshot({ fullPage: true });
    await this.writer.writeScreenshot("screenshot.png", screenshot);
  }

  private async autoScrollPage(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        const scrollInterval = setInterval(() => {
          window.scrollBy(0, window.innerHeight);

          if (
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight
          ) {
            clearInterval(scrollInterval);
            resolve(null);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(scrollInterval);
          resolve(null);
        }, 10000);
      });

      window.scrollTo(0, 0);
    });

    await page.waitForTimeout(500);
  }

  private async createSingleFileSnapshot(page: Page): Promise<string> {
    const baseUrl = page.url();

    // Process the rendered DOM and inline all assets
    const processedHtml = await page.evaluate(
      async (baseUrlParam: string) => {
        // Inline stylesheets
        const styleLinks = document.querySelectorAll(
          'link[rel="stylesheet"], link[rel="preload"][as="style"]'
        );
        for (const link of Array.from(styleLinks)) {
          const href = link.getAttribute("href");
          if (href) {
            try {
              const absoluteUrl = new URL(href, baseUrlParam).toString();
              const response = await fetch(absoluteUrl);
              if (response.ok) {
                const css = await response.text();
                const style = document.createElement("style");
                style.textContent = css;
                link.parentNode?.replaceChild(style, link);
              }
            } catch (e) {
              link.remove();
            }
          }
        }

        // Inline images
        const images = document.querySelectorAll("img");
        for (const img of Array.from(images)) {
          try {
            const src = img.currentSrc || img.src;
            if (
              src &&
              !src.startsWith("data:") &&
              !src.startsWith("blob:") &&
              !src.startsWith("javascript:")
            ) {
              const absoluteUrl = new URL(src, baseUrlParam).toString();
              const response = await fetch(absoluteUrl);
              if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onload = () => {
                  img.src = reader.result as string;
                };
                reader.readAsDataURL(blob);
              }
            }
            img.removeAttribute("srcset");
            img.removeAttribute("sizes");
          } catch (e) {
            // Keep original src if fetch fails
          }
        }

        // Remove source srcset from picture elements
        const sources = document.querySelectorAll(
          "picture source[srcset]"
        );
        for (const source of Array.from(sources)) {
          source.removeAttribute("srcset");
        }

        // Inline favicon
        const favicon = document.querySelector(
          'link[rel="icon"], link[rel="shortcut icon"]'
        );
        if (favicon) {
          const href = favicon.getAttribute("href");
          if (href && !href.startsWith("data:")) {
            try {
              const absoluteUrl = new URL(href, baseUrlParam).toString();
              const response = await fetch(absoluteUrl);
              if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onload = () => {
                  favicon.setAttribute("href", reader.result as string);
                };
                reader.readAsDataURL(blob);
              }
            } catch (e) {
              // Keep original if fails
            }
          }
        }

        // Inline fonts from stylesheets
        const styles = document.querySelectorAll("style");
        for (const style of Array.from(styles)) {
          if (style.textContent) {
            let css = style.textContent;

            const urlMatches = css.matchAll(
              /url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g
            );
            for (const match of Array.from(urlMatches)) {
              const urlPath = match[1];
              if (
                urlPath &&
                !urlPath.startsWith("data:") &&
                !urlPath.startsWith("blob:") &&
                !urlPath.startsWith("javascript:")
              ) {
                try {
                  const absoluteUrl = new URL(
                    urlPath,
                    baseUrlParam
                  ).toString();
                  const response = await fetch(absoluteUrl);
                  if (response.ok) {
                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.onload = () => {
                      css = css.replace(
                        match[0],
                        `url(${reader.result as string})`
                      );
                    };
                    reader.readAsDataURL(blob);
                  }
                } catch (e) {
                  // Keep original URL
                }
              }
            }
            style.textContent = css;
          }
        }

        // Remove external scripts
        const externalScripts = document.querySelectorAll(
          "script[src]:not([data-keep])"
        );
        for (const script of Array.from(externalScripts)) {
          script.remove();
        }

        // Remove Next.js specific scripts that won't work offline
        const nextScripts = document.querySelectorAll(
          "script[src*='_next'], script[src*='__NEXT']"
        );
        for (const script of Array.from(nextScripts)) {
          script.remove();
        }

        return document.documentElement.outerHTML;
      },
      baseUrl
    );

    return processedHtml;
  }

  private async extractElements(page: Page): Promise<void> {
    log("Extracting elements...");

    const buttons = await extractButtons(page);
    if (buttons.length > 0) {
      await this.writer.writeJSON("buttons.json", buttons);
    }

    const forms = await extractForms(page);
    if (forms.length > 0) {
      await this.writer.writeJSON("forms.json", forms);
    }

    const inputs = await extractInputs(page);
    if (inputs.length > 0) {
      await this.writer.writeJSON("inputs.json", inputs);
    }

    const links = await extractLinks(page);
    if (links.length > 0) {
      await this.writer.writeJSON("links.json", links);
    }

    const tables = await extractTables(page);
    if (tables.length > 0) {
      await this.writer.writeJSON("tables.json", tables);
    }

    const metadata = await extractMetadata(page, this.config.url);
    await this.writer.writeJSON("metadata.json", metadata);
  }

  private async saveNetworkData(): Promise<void> {
    const requests = this.networkRecorder.getRequests();
    if (requests.length > 0) {
      await this.writer.writeJSON("network.json", requests);
    }

    const summary = this.networkRecorder.getSummary();
    const fullSummary = {
      page: this.config.pageName,
      url: this.config.url,
      timestamp: new Date().toISOString(),
      network: summary,
    };
    await this.writer.writeJSON("summary.json", fullSummary);
  }
}

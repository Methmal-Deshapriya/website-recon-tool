import { readFile } from "fs-extra";
import { resolve } from "path";
import { createBrowser, createContext } from "./browser/browserFactory";
import { PageRunner } from "./crawler/pageRunner";
import { validateConfig } from "./utils/config";
import { log, logError } from "./utils/logger";
import { discoverPages } from "./crawler/autoCrawler";

async function loadConfig(path: string) {
  const content = await readFile(path, "utf-8");
  return validateConfig(JSON.parse(content));
}

async function main() {
  try {
    const configPath = resolve(process.cwd(), "configs/sites.config.json");
    log(`Loading config from: ${configPath}`);
    const config = await loadConfig(configPath);

    // Check for demo/debug environment variables
    const demoMode = process.env.DEMO === "true";
    const slowMoMs = parseInt(process.env.SLOW_MO || "0");
    const recordVideo = process.env.RECORD_VIDEO === "true";
    const debugMode = process.env.DEBUG_BROWSER === "true";

    if (demoMode) {
      log("🎬 DEMO MODE ENABLED - Running in headed mode with visual feedback");
    }

    const browser = await createBrowser({
      headless: !demoMode && process.env.HEADED !== "true",
      viewport: { width: 1440, height: 900 },
      timeout: 60000,
      slowMo: slowMoMs,
      recordVideo,
      debugMode,
    });

    const outputPath = resolve(process.cwd(), "output");

    for (const site of config.sites) {
      log(`\n=== Processing site: ${site.name} ===`);

      let authFilePath: string | undefined;
      if (site.authFile) {
        authFilePath = resolve(process.cwd(), site.authFile);
        log(`Auth file configured: ${authFilePath}`);
      } else {
        log(`No authentication configured for this site`);
      }

      const context = await createContext(browser, {
        authFile: authFilePath,
      });

      const page = await context.newPage();

      try {
        // Discover pages (manual or auto)
        let pagesToVisit = site.pages;

        if (site.autoCrawl && site.autoCrawl.enabled) {
          const discovery = await discoverPages(
            site.baseUrl,
            site.pages,
            site.autoCrawl,
            page
          );
          pagesToVisit = discovery.pages;
          log(`\n📋 Using ${discovery.source} discovery: ${pagesToVisit.length} pages to visit`);
        } else if (!pagesToVisit) {
          throw new Error(
            `Site '${site.name}' has no pages configured and auto-crawl is not enabled`
          );
        }

        // Run recon on each page
        for (const pageConfig of pagesToVisit) {
          const runner = new PageRunner({
            siteName: site.name,
            pageName: pageConfig.name,
            url: pageConfig.url,
            outputBasePath: outputPath,
          });

          await runner.run(page);
        }
      } finally {
        await page.close();
        await context.close();
      }
    }

    await browser.close();
    log("\nRecon complete!");
  } catch (error) {
    logError("Fatal error", error);
    process.exit(1);
  }
}

main();

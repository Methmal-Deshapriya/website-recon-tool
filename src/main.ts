import { readFile } from "fs-extra";
import { resolve } from "path";
import { createBrowser, createContext } from "./browser/browserFactory";
import { PageRunner } from "./crawler/pageRunner";
import { validateConfig } from "./utils/config";
import { log, logError } from "./utils/logger";

async function loadConfig(path: string) {
  const content = await readFile(path, "utf-8");
  return validateConfig(JSON.parse(content));
}

async function main() {
  try {
    const configPath = resolve(process.cwd(), "configs/sites.config.json");
    log(`Loading config from: ${configPath}`);
    const config = await loadConfig(configPath);

    const browser = await createBrowser({
      headless: true,
      viewport: { width: 1440, height: 900 },
      timeout: 60000,
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
        for (const pageConfig of site.pages) {
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

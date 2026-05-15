import { Page } from "playwright";
import { log, logError } from "../utils/logger";
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

    // Capture DOM
    const html = await page.content();
    await this.writer.writeHTML("dom.html", html);

    // Capture text
    const textContent = await page.evaluate(() => document.body.innerText);
    await this.writer.writeText("text.txt", textContent);

    // Capture screenshot
    const screenshot = await page.screenshot({ fullPage: true });
    await this.writer.writeScreenshot("screenshot.png", screenshot);
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

import { Page } from "playwright";
import { logDebug } from "./logger";

export async function waitForStablePage(page: Page, timeout: number = 30000): Promise<void> {
  try {
    logDebug("Waiting for page networkidle...");
    await page.waitForLoadState("networkidle", { timeout });
    logDebug("Page reached networkidle state");
  } catch (error) {
    logDebug("networkidle timeout, continuing anyway");
  }
}

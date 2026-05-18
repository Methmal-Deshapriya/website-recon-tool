import { chromium, Browser, BrowserContext } from "playwright";
import { loadAuth } from "../auth/loadAuth";
import { logDebug, log } from "../utils/logger";

export interface BrowserConfig {
  headless?: boolean;
  viewport?: { width: number; height: number };
  timeout?: number;
  authFile?: string;
}

const defaultConfig: Required<BrowserConfig> = {
  headless: true,
  viewport: { width: 1440, height: 900 },
  timeout: 60000,
  authFile: "",
};

export async function createBrowser(config?: BrowserConfig): Promise<Browser> {
  const finalConfig = { ...defaultConfig, ...config };
  logDebug(`Launching Chromium (headless: ${finalConfig.headless})`);

  const browser = await chromium.launch({
    headless: finalConfig.headless,
  });

  return browser;
}

export async function createContext(
  browser: Browser,
  config?: BrowserConfig,
): Promise<BrowserContext> {
  const finalConfig = { ...defaultConfig, ...config };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storageState: any = undefined;
  if (finalConfig.authFile) {
    log(`Loading authentication from: ${finalConfig.authFile}`);
    const loadedAuth = await loadAuth(finalConfig.authFile);
    if (loadedAuth) {
      storageState = loadedAuth;
      const cookieCount = loadedAuth.cookies?.length || 0;
      const originCount = loadedAuth.origins?.length || 0;
      log(`✓ Authentication loaded: ${cookieCount} cookies, ${originCount} origins`);
    } else {
      log(`✗ No authentication loaded (file not found or invalid)`);
    }
  }

  const context = await browser.newContext({
    viewport: finalConfig.viewport,
    storageState,
  });

  context.setDefaultTimeout(finalConfig.timeout);
  logDebug(
    `Created context with viewport ${finalConfig.viewport.width}x${finalConfig.viewport.height}`,
  );

  return context;
}

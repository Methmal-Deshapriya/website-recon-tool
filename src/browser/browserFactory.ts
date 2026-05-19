import { chromium, Browser, BrowserContext } from "playwright";
import { loadAuth } from "../auth/loadAuth";
import { logDebug, log } from "../utils/logger";
import { join } from "path";

export interface BrowserConfig {
  headless?: boolean;
  viewport?: { width: number; height: number };
  timeout?: number;
  authFile?: string;
  slowMo?: number;
  recordVideo?: boolean;
  debugMode?: boolean;
}

const defaultConfig: Required<BrowserConfig> = {
  headless: true,
  viewport: { width: 1440, height: 900 },
  timeout: 60000,
  authFile: "",
  slowMo: 0,
  recordVideo: false,
  debugMode: false,
};

export async function createBrowser(config?: BrowserConfig): Promise<Browser> {
  const finalConfig = { ...defaultConfig, ...config };

  const headlessMode = finalConfig.headless ? "headless" : "headed (GUI visible)";
  logDebug(`Launching Chromium (${headlessMode})`);

  if (finalConfig.slowMo > 0) {
    logDebug(`Slow motion enabled: ${finalConfig.slowMo}ms delays`);
  }
  if (finalConfig.debugMode) {
    logDebug(`Debug mode enabled - use PWDEBUG=1 to inspect pages`);
  }

  const browser = await chromium.launch({
    headless: finalConfig.headless,
    slowMo: finalConfig.slowMo,
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

  const contextConfig: Parameters<typeof browser.newContext>[0] = {
    viewport: finalConfig.viewport,
    storageState,
  };

  // Add video recording if enabled
  if (finalConfig.recordVideo) {
    const recordingDir = join(process.cwd(), "output", "videos");
    contextConfig.recordVideo = {
      dir: recordingDir,
    };
    log(`📹 Video recording enabled - videos will be saved to: ${recordingDir}`);
  }

  const context = await browser.newContext(contextConfig);

  context.setDefaultTimeout(finalConfig.timeout);
  logDebug(
    `Created context with viewport ${finalConfig.viewport.width}x${finalConfig.viewport.height}`,
  );

  return context;
}

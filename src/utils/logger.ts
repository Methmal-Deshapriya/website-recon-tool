export function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

export function logError(message: string, error?: unknown): void {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
  if (error instanceof Error) {
    console.error(`  ${error.message}`);
  }
}

export function logInfo(message: string): void {
  log(message);
}

export function logDebug(message: string): void {
  if (process.env.DEBUG) {
    log(`[DEBUG] ${message}`);
  }
}

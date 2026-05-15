import { pathExists, readFile } from "fs-extra";
import { log, logError } from "./logger";

async function verifyAuth(authFilePath: string): Promise<void> {
  try {
    log(`\nVerifying authentication file: ${authFilePath}`);

    const exists = await pathExists(authFilePath);
    if (!exists) {
      logError(`❌ Auth file does not exist: ${authFilePath}`);
      process.exit(1);
    }

    log(`✓ File exists`);

    const content = await readFile(authFilePath, "utf-8");
    const data = JSON.parse(content);

    log(`✓ File is valid JSON`);

    const cookies = data.cookies || [];
    const origins = data.origins || [];

    log(`\nAuth data contains:`);
    log(`  • ${cookies.length} cookies`);

    if (cookies.length > 0) {
      cookies.slice(0, 3).forEach((cookie: any) => {
        const expiry = new Date(cookie.expires * 1000);
        const isExpired = expiry < new Date();
        log(`    - ${cookie.name} (expires: ${expiry.toISOString()}) ${isExpired ? "❌ EXPIRED" : "✓"}`);
      });
      if (cookies.length > 3) {
        log(`    ... and ${cookies.length - 3} more`);
      }
    }

    log(`  • ${origins.length} origins with localStorage`);
    origins.forEach((origin: any) => {
      const storageCount = origin.localStorage?.length || 0;
      log(`    - ${origin.origin} (${storageCount} items)`);
    });

    const allCookiesExpired = cookies.every((c: any) => new Date(c.expires * 1000) < new Date());
    if (allCookiesExpired && cookies.length > 0) {
      logError(`\n⚠️  WARNING: All cookies are expired! Authentication may fail.`);
    } else if (cookies.length === 0) {
      logError(`\n⚠️  WARNING: No cookies saved! Authentication may not work.`);
    } else {
      log(`\n✓ Auth data looks valid!`);
    }
  } catch (error) {
    logError(`❌ Error verifying auth file`, error);
    process.exit(1);
  }
}

const authPath = process.argv[2];
if (!authPath) {
  logError("Usage: npx ts-node src/utils/verifyAuth.ts <auth-file-path>");
  logError("Example: npx ts-node src/utils/verifyAuth.ts auth/myapp-auth.json");
  process.exit(1);
}

verifyAuth(authPath);

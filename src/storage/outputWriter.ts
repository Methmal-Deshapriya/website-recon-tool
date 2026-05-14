import { ensureDir, writeFile } from "fs-extra";
import { join } from "path";
import { log, logError } from "../utils/logger";

export interface OutputWriterConfig {
  basePath: string;
  siteName: string;
  pageName: string;
}

export class OutputWriter {
  private outputDir: string;

  constructor(config: OutputWriterConfig) {
    this.outputDir = join(config.basePath, config.siteName, config.pageName);
  }

  async initialize(): Promise<void> {
    await ensureDir(this.outputDir);
    log(`Output directory: ${this.outputDir}`);
  }

  async writeHTML(filename: string, html: string): Promise<void> {
    const filePath = join(this.outputDir, filename);
    await writeFile(filePath, html);
    log(`Saved: ${filename}`);
  }

  async writeText(filename: string, text: string): Promise<void> {
    const filePath = join(this.outputDir, filename);
    await writeFile(filePath, text);
    log(`Saved: ${filename}`);
  }

  async writeJSON(filename: string, data: unknown): Promise<void> {
    const filePath = join(this.outputDir, filename);
    await writeFile(filePath, JSON.stringify(data, null, 2));
    log(`Saved: ${filename}`);
  }

  async writeScreenshot(filename: string, buffer: Buffer): Promise<void> {
    const filePath = join(this.outputDir, filename);
    await writeFile(filePath, buffer);
    log(`Saved: ${filename}`);
  }

  getOutputPath(filename: string): string {
    return join(this.outputDir, filename);
  }
}

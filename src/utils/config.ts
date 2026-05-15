import { z } from "zod";

const PageSchema = z.object({
  name: z.string().min(1, "Page name is required"),
  url: z.string().url("Invalid URL format"),
});

const AutoCrawlSchema = z.object({
  enabled: z.boolean().default(false),
  maxPages: z.number().min(1).max(500).default(50),
  maxDepth: z.number().min(1).max(10).default(3),
  excludePatterns: z.array(z.string()).default([]),
  includePatterns: z.array(z.string()).default([]),
  delayMs: z.number().min(0).max(5000).default(500),
  respectRobotsTxt: z.boolean().default(true),
  minContentLength: z.number().min(0).default(100),
  prioritizeByContent: z.boolean().default(true),
});

const SiteSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  baseUrl: z.string().url("Invalid base URL"),
  authFile: z.string().optional(),
  pages: z.array(PageSchema).optional(),
  autoCrawl: AutoCrawlSchema.optional(),
}).refine(
  (site) => site.pages || (site.autoCrawl && site.autoCrawl.enabled),
  "Either 'pages' or 'autoCrawl.enabled: true' must be configured"
);

const ConfigSchema = z.object({
  sites: z.array(SiteSchema).min(1, "At least one site is required"),
});

export type Page = z.infer<typeof PageSchema>;
export type AutoCrawlConfig = z.infer<typeof AutoCrawlSchema>;
export type Site = z.infer<typeof SiteSchema>;
export type Config = z.infer<typeof ConfigSchema>;

export function validateConfig(data: unknown): Config {
  return ConfigSchema.parse(data);
}

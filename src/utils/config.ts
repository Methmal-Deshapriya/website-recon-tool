import { z } from "zod";

const PageSchema = z.object({
  name: z.string().min(1, "Page name is required"),
  url: z.string().url("Invalid URL format"),
});

const SiteSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  baseUrl: z.string().url("Invalid base URL"),
  authFile: z.string().optional(),
  pages: z.array(PageSchema).min(1, "At least one page is required"),
});

const ConfigSchema = z.object({
  sites: z.array(SiteSchema).min(1, "At least one site is required"),
});

export type Page = z.infer<typeof PageSchema>;
export type Site = z.infer<typeof SiteSchema>;
export type Config = z.infer<typeof ConfigSchema>;

export function validateConfig(data: unknown): Config {
  return ConfigSchema.parse(data);
}

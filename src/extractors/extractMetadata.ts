import { Page } from "playwright";

export interface Metadata {
  url: string;
  title: string;
  timestamp: string;
  htmlLength: number;
  textLength: number;
  hasForm: boolean;
  hasTable: boolean;
  headingsCount: number;
  imagesCount: number;
  linksCount: number;
}

export async function extractMetadata(page: Page, url: string): Promise<Metadata> {
  const pageData = await page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    const text = document.body.innerText;
    const title = document.title;
    const hasForm = !!document.querySelector("form");
    const hasTable = !!document.querySelector("table");
    const headingsCount = document.querySelectorAll("h1, h2, h3, h4, h5, h6").length;
    const imagesCount = document.querySelectorAll("img").length;
    const linksCount = document.querySelectorAll("a").length;

    return {
      html,
      text,
      title,
      hasForm,
      hasTable,
      headingsCount,
      imagesCount,
      linksCount,
    };
  });

  return {
    url,
    title: pageData.title,
    timestamp: new Date().toISOString(),
    htmlLength: pageData.html.length,
    textLength: pageData.text.length,
    hasForm: pageData.hasForm,
    hasTable: pageData.hasTable,
    headingsCount: pageData.headingsCount,
    imagesCount: pageData.imagesCount,
    linksCount: pageData.linksCount,
  };
}

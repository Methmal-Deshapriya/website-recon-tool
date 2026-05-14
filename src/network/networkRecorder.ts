import { Page, Request, Response } from "playwright";
import { logDebug } from "../utils/logger";

export interface CapturedRequest {
  url: string;
  method: string;
  resourceType: string;
  status?: number;
  contentType?: string;
  isAPI: boolean;
  isGraphQL: boolean;
  requestSize?: number;
  responseSize?: number;
}

export class NetworkRecorder {
  private requests: CapturedRequest[] = [];

  attach(page: Page): void {
    page.on("response", (response: Response) => {
      this.handleResponse(response);
    });

    logDebug("Network recorder attached");
  }

  private handleResponse(response: Response): void {
    const request = response.request();
    const url = request.url();
    const method = request.method();
    const resourceType = request.resourceType();
    const status = response.status();
    const contentType = response.headers()["content-type"] || "";

    const isAPI = this.detectAPI(url, contentType);
    const isGraphQL = this.detectGraphQL(url, contentType);

    if (isAPI || isGraphQL) {
      logDebug(`[${method}] ${url} (${status})`);
    }

    const captured: CapturedRequest = {
      url,
      method,
      resourceType,
      status,
      contentType,
      isAPI,
      isGraphQL,
    };

    this.requests.push(captured);
  }

  private detectAPI(url: string, contentType: string): boolean {
    const apiPatterns = ["/api/", "/graphql", ".json"];
    return (
      apiPatterns.some((pattern) => url.includes(pattern)) ||
      contentType.includes("application/json")
    );
  }

  private detectGraphQL(url: string, contentType: string): boolean {
    return (
      url.includes("/graphql") ||
      contentType.includes("application/json") ||
      url.includes("graphql")
    );
  }

  getRequests(): CapturedRequest[] {
    return this.requests;
  }

  getSummary() {
    const totalRequests = this.requests.length;
    const apiRequests = this.requests.filter((r) => r.isAPI).length;
    const graphqlRequests = this.requests.filter((r) => r.isGraphQL).length;
    const apiUrls = [...new Set(this.requests.filter((r) => r.isAPI).map((r) => r.url))];

    return {
      totalRequests,
      apiRequests,
      graphqlRequests,
      uniqueAPIEndpoints: apiUrls.length,
      endpoints: apiUrls.slice(0, 20),
    };
  }

  clear(): void {
    this.requests = [];
  }
}

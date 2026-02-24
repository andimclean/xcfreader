import { Injectable } from "@angular/core";

export interface FetchRetryOptions {
  retryAttempts: number;
  retryDelay: number;
  onRetrying?: (event: {
    attempt: number;
    maxAttempts: number;
    nextDelay: number;
    error: string;
  }) => void;
}

@Injectable({ providedIn: "root" })
export class XcfFetchService {
  /**
   * Fetch with exponential backoff retry logic.
   * @param url - URL to fetch
   * @param options - Retry configuration
   * @param attempt - Current attempt number (starts at 1)
   * @returns Promise resolving to the fetched ArrayBuffer
   */
  async fetchWithRetry(
    url: string,
    options: FetchRetryOptions,
    attempt: number = 1
  ): Promise<ArrayBuffer> {
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      return await resp.arrayBuffer();
    } catch (error) {
      if (attempt > options.retryAttempts) {
        throw error;
      }

      // Exponential backoff: retryDelay * 2^(attempt-1)
      const delay = options.retryDelay * Math.pow(2, attempt - 1);

      options.onRetrying?.({
        attempt,
        maxAttempts: options.retryAttempts,
        nextDelay: delay,
        error: error instanceof Error ? error.message : String(error),
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.fetchWithRetry(url, options, attempt + 1);
    }
  }
}

import { XcfFetchService, FetchRetryOptions } from "./xcf-fetch.service";

describe("XcfFetchService", () => {
  let service: XcfFetchService;
  let originalFetch: typeof globalThis.fetch;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    service = new XcfFetchService();
    jest.useFakeTimers();

    // jsdom doesn't provide fetch, so assign a mock directly
    originalFetch = globalThis.fetch;
    mockFetch = jest.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    globalThis.fetch = originalFetch;
  });

  function mockFetchOk(body: ArrayBuffer): void {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(body),
    } as unknown as Response);
  }

  function mockFetchError(status: number, statusText: string): void {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      statusText,
    } as unknown as Response);
  }

  function mockFetchNetworkError(message: string): void {
    mockFetch.mockRejectedValueOnce(new Error(message));
  }

  const defaultOptions: FetchRetryOptions = {
    retryAttempts: 3,
    retryDelay: 1000,
  };

  it("should return ArrayBuffer on successful fetch", async () => {
    const expected = new ArrayBuffer(8);
    mockFetchOk(expected);

    const result = await service.fetchWithRetry("https://example.com/test.xcf", defaultOptions);

    expect(result).toBe(expected);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/test.xcf");
  });

  it("should throw on HTTP error response", async () => {
    mockFetchError(404, "Not Found");

    const promise = service.fetchWithRetry("https://example.com/missing.xcf", {
      retryAttempts: 0,
      retryDelay: 1000,
    });

    await expect(promise).rejects.toThrow("HTTP 404: Not Found");
  });

  it("should retry on network error and succeed", async () => {
    const expected = new ArrayBuffer(16);
    mockFetchNetworkError("Network failure");
    mockFetchOk(expected);

    const promise = service.fetchWithRetry("https://example.com/test.xcf", defaultOptions);

    // Advance past the first retry delay (1000ms)
    await jest.advanceTimersByTimeAsync(1000);

    const result = await promise;
    expect(result).toBe(expected);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should use exponential backoff for retry delays", async () => {
    const expected = new ArrayBuffer(4);
    mockFetchNetworkError("fail 1");
    mockFetchNetworkError("fail 2");
    mockFetchNetworkError("fail 3");
    mockFetchOk(expected);

    const promise = service.fetchWithRetry("https://example.com/test.xcf", defaultOptions);

    // First retry: 1000ms * 2^0 = 1000ms
    await jest.advanceTimersByTimeAsync(1000);
    // Second retry: 1000ms * 2^1 = 2000ms
    await jest.advanceTimersByTimeAsync(2000);
    // Third retry: 1000ms * 2^2 = 4000ms
    await jest.advanceTimersByTimeAsync(4000);

    const result = await promise;
    expect(result).toBe(expected);
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it("should throw after max retries exhausted", async () => {
    mockFetchNetworkError("fail 1");
    mockFetchNetworkError("fail 2");
    mockFetchNetworkError("fail 3");
    mockFetchNetworkError("fail 4"); // attempt > retryAttempts

    // Attach .catch early to prevent Zone.js unhandled rejection
    let caughtError: unknown;
    const promise = service
      .fetchWithRetry("https://example.com/test.xcf", defaultOptions)
      .catch((e: unknown) => {
        caughtError = e;
      });

    // Advance through all retry delays
    await jest.advanceTimersByTimeAsync(1000); // retry 1
    await jest.advanceTimersByTimeAsync(2000); // retry 2
    await jest.advanceTimersByTimeAsync(4000); // retry 3
    await promise;

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toBe("fail 4");
  });

  it("should call onRetrying callback with correct parameters", async () => {
    const expected = new ArrayBuffer(4);
    mockFetchNetworkError("connection refused");
    mockFetchOk(expected);

    const onRetrying = jest.fn();

    const promise = service.fetchWithRetry("https://example.com/test.xcf", {
      ...defaultOptions,
      onRetrying,
    });

    await jest.advanceTimersByTimeAsync(1000);
    await promise;

    expect(onRetrying).toHaveBeenCalledTimes(1);
    expect(onRetrying).toHaveBeenCalledWith({
      attempt: 1,
      maxAttempts: 3,
      nextDelay: 1000,
      error: "connection refused",
    });
  });

  it("should throw immediately with zero retryAttempts", async () => {
    mockFetchNetworkError("instant failure");

    const promise = service.fetchWithRetry("https://example.com/test.xcf", {
      retryAttempts: 0,
      retryDelay: 1000,
    });

    await expect(promise).rejects.toThrow("instant failure");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

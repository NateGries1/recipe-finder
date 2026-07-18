const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function retryAsync<T>({
  fn,
  validate,
  retries = 3,
  retryTime = 1000,
  onRetry,
}: {
  fn: () => Promise<T>;
  validate?: (result: T) => boolean;
  retries?: number;
  retryTime?: number;
  onRetry?: (error: unknown, attempt: number) => void;
}): Promise<T | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await fn();

      if (validate && !validate(result)) {
        throw new Error("Validation failed");
      }

      return result;
    } catch (error) {
      sleep(retryTime);
      onRetry?.(error, attempt);
    }
  }
  return null;
}

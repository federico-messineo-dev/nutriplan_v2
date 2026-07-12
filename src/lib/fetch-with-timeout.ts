export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 10_000,
) {
  const controller = new AbortController();
  return await Promise.race([
    fetch(input, { ...init, signal: controller.signal }),
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        controller.abort();
        reject(new Error("Richiesta scaduta"));
      }, timeoutMs)
    ),
  ]);
}

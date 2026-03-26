type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
}

export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isNgrokUrl(url: string): boolean {
  return /https?:\/\/[^/]*\.ngrok(?:-free)?\.(?:app|dev|io)/i.test(url);
}

export async function apiRequest<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers } = options;
  const requestHeaders = new Headers(headers || {});
  const hasBody = body !== undefined && body !== null;

  if (isNgrokUrl(baseUrl) && !requestHeaders.has("ngrok-skip-browser-warning")) {
    requestHeaders.set("ngrok-skip-browser-warning", "true");
  }

  if (hasBody && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const nestedError = payload.error;
    const nestedErrorMessage =
      typeof nestedError === "object" &&
      nestedError !== null &&
      "message" in nestedError &&
      typeof (nestedError as { message?: unknown }).message === "string"
        ? ((nestedError as { message: string }).message as string)
        : "";

    const message =
      (typeof payload.error === "string" && payload.error) ||
      nestedErrorMessage ||
      (typeof payload.message === "string" && payload.message) ||
      "Request failed";
    throw new HttpError(message, response.status);
  }

  return payload as T;
}

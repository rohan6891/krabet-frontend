import { env } from "@/shared/config/env";

export function resolveAssetUrl(url: string | null | undefined): string | null {
  const normalized = url?.trim();
  if (!normalized) {
    return null;
  }

  // Keep fully-qualified and inline URLs untouched.
  if (
    /^(?:https?:)?\/\//i.test(normalized) ||
    normalized.startsWith("blob:") ||
    normalized.startsWith("data:")
  ) {
    return normalized;
  }

  const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${env.apiBaseUrl}${path}`;
}
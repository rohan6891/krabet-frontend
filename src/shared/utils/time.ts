export function toSecondsLeft(expiresAt?: string, expiresInSeconds?: number): number {
  if (expiresAt) {
    const expiresTimestamp = new Date(expiresAt).getTime();
    if (!Number.isNaN(expiresTimestamp)) {
      return Math.max(0, Math.floor((expiresTimestamp - Date.now()) / 1000));
    }
  }

  if (typeof expiresInSeconds === "number" && Number.isFinite(expiresInSeconds)) {
    return Math.max(0, Math.floor(expiresInSeconds));
  }

  return 0;
}

export function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

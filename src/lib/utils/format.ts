export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatDistance(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : "∞";
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

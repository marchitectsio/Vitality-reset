export function publicAsset(p: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const cleaned = p.startsWith("/") ? p.slice(1) : p;
  return base + cleaned;
}

export function matchesIfNone(hdr: string | null, current?: string): boolean {
  // Returns true if If-None-Match header matches the current entity-tag (weak/strong normalized)
  // - Supports comma-separated lists per RFC 7232
  // - Treats W/ prefix as equivalent for comparison
  // - Supports wildcard '*': matches any current representation
  if (!hdr || !current) return false;
  const raw = hdr.trim();
  if (!raw) return false;
  if (raw === '*') return true;
  const normalize = (s: string) => s.trim().replace(/^W\/(\s*)?/i, '');
  const list = raw.split(',').map(normalize);
  const cur = normalize(current);
  return list.some((v) => v === cur);
}
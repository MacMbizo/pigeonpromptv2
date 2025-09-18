// Presets utility: name validation, slugging, and simple persistence (localStorage with Node fallback)
// Storage schema:
// - Index key: 'ctx.presets.index' => JSON array of { name, slug, createdAt, updatedAt }
// - Data key: `ctx.preset.${slug}` => JSON object { meta, data }

export type PresetMeta = {
  name: string;
  slug: string;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
};

export type PresetRecord<T = any> = {
  meta: PresetMeta;
  data: T;
};

/* eslint-disable no-unused-vars */
type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};
/* eslint-enable no-unused-vars */

function getStorage(): StorageLike {
  // In browser, prefer localStorage
  if (typeof window !== 'undefined' && (window as any)?.localStorage) {
    return (window as any).localStorage as StorageLike;
  }
  // Node/test fallback: simple in-memory store attached to globalThis
  const g: any = globalThis as any;
  if (!g.__PIGEON_PRESET_MEM_STORE__) {
    const mem = new Map<string, string>();
    g.__PIGEON_PRESET_MEM_STORE__ = {
      getItem: (_key: string) => (mem.has(_key) ? mem.get(_key)! : null),
      setItem: (_key: string, _value: string) => void mem.set(_key, _value),
      removeItem: (_key: string) => void mem.delete(_key),
      __mem__: mem,
    } as StorageLike & { __mem__: Map<string, string> };
  }
  return g.__PIGEON_PRESET_MEM_STORE__ as StorageLike;
}

const INDEX_KEY = 'ctx.presets.index';
const dataKey = (slug: string) => `ctx.preset.${slug}`;

export function validatePresetName(name: string): { ok: boolean; message?: string } {
  const n = (name || '').trim();
  if (!n) return { ok: false, message: 'Name is required' };
  if (n.length > 80) return { ok: false, message: 'Name must be at most 80 characters' };
  // Disallow ASCII control characters only; allow full Unicode (including emoji)
  let hasControl = false;
  for (const ch of n) {
    const cp = ch.codePointAt(0)!;
    if ((cp >= 0 && cp <= 0x1f) || cp === 0x7f) {
      hasControl = true;
      break;
    }
  }
  if (hasControl) return { ok: false, message: 'Name contains invalid control characters' };
  return { ok: true };
}

export function slugifyName(name: string): string {
  // Normalize and apply language-aware character mappings first
  let n = (name || '').normalize('NFKD');
  // German sharp s -> ss (both cases)
  n = n.replace(/ß/g, 'ss').replace(/ẞ/g, 'ss');
  // Optional: common ligatures (kept minimal for now)
  n = n.replace(/æ/gi, (m) => (m === 'Æ' ? 'ae' : 'ae')).replace(/œ/gi, (m) => (m === 'Œ' ? 'oe' : 'oe'));

  // Drop diacritics
  const withoutDiacritics = n.replace(/\p{Diacritic}+/gu, '');
  return withoutDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics to hyphen
    .replace(/^-+|-+$/g, '') // trim hyphens
    .replace(/-{2,}/g, '-'); // collapse
}

function readIndex(): PresetMeta[] {
  const s = getStorage();
  try {
    const raw = s.getItem(INDEX_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as PresetMeta[];
  } catch {
    return [];
  }
}

function writeIndex(arr: PresetMeta[]) {
  const s = getStorage();
  s.setItem(INDEX_KEY, JSON.stringify(arr));
}

export function listPresets(): PresetMeta[] {
  const arr = readIndex();
  // Sort by updatedAt desc then createdAt desc
  return arr.slice().sort((a, b) => {
    const ua = a.updatedAt || a.createdAt;
    const ub = b.updatedAt || b.createdAt;
    return new Date(ub).getTime() - new Date(ua).getTime();
  });
}

export function savePreset<T = any>(name: string, data: T): PresetMeta {
  const n = (name || '').trim();
  const slug = slugifyName(n);
  const now = new Date().toISOString();
  const index = readIndex();
  const existingIdx = index.findIndex((m) => m.slug === slug);
  let meta: PresetMeta;
  if (existingIdx >= 0) {
    const prev = index[existingIdx];
    meta = { ...prev, name: n, updatedAt: now };
    index[existingIdx] = meta;
  } else {
    meta = { name: n, slug, createdAt: now, updatedAt: now };
    index.push(meta);
  }
  writeIndex(index);
  const s = getStorage();
  s.setItem(dataKey(slug), JSON.stringify({ meta, data } satisfies PresetRecord<T>));
  return meta;
}

export function loadPreset<T = any>(slug: string): PresetRecord<T> | null {
  const s = getStorage();
  const raw = s.getItem(dataKey(slug));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PresetRecord<T>;
  } catch {
    return null;
  }
}

export function deletePreset(slug: string): boolean {
  const s = getStorage();
  const index = readIndex();
  const next = index.filter((m) => m.slug !== slug);
  const changed = next.length !== index.length;
  if (changed) writeIndex(next);
  s.removeItem(dataKey(slug));
  return changed;
}

// Back-compat helpers used by Inventory page imports and coverage fixtures
export function loadPresetBySlug<T = any>(slug: string): PresetRecord<T> | null {
  return loadPreset<T>(slug);
}

export function deletePresetBySlug(slug: string): void {
  void deletePreset(slug);
}

export function buildExportFilename(name: string, when = new Date()): string {
  const slug = slugifyName(name || 'preset');
  const d = new Date(when);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const MM = String(d.getMinutes()).padStart(2, '0');
  const SS = String(d.getSeconds()).padStart(2, '0');
  return `pigeon-context-${slug}-${yyyy}${mm}${dd}-${HH}${MM}${SS}.json`;
}
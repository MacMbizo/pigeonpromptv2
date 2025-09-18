// Development-only in-memory store for user templates, used when the database is unavailable.
// This enables local E2E smoke to run without a backing DB.

export type DevTemplate = {
  id: string;
  user_id: string;
  name?: string;
  description?: string;
  system_prompt?: string;
  user_prompt_template?: string;
  variables?: any[];
  tags?: string[];
  created_at: string;
  updated_at: string;
  // allow any additional fields as needed by tests
  [key: string]: any;
};

// Persist the dev store on globalThis to avoid resets across hot-reloads in Next dev server
// and to keep state consistent across API route module reloads.
const getGlobalStore = (): Map<string, DevTemplate[]> => {
  const g = globalThis as any;
  if (!g.__DEV_TEMPLATES_MAP) {
    g.__DEV_TEMPLATES_MAP = new Map<string, DevTemplate[]>();
  }
  return g.__DEV_TEMPLATES_MAP as Map<string, DevTemplate[]>;
};

export function devGetTemplates(userId: string): DevTemplate[] {
  const store = getGlobalStore();
  return store.get(userId) || [];
}

export function devCreateTemplate(userId: string, body: Record<string, any>): DevTemplate {
  const store = getGlobalStore();
  const now = new Date().toISOString();
  const t: DevTemplate = {
    id: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    created_at: now,
    updated_at: now,
    ...body,
  };
  const list = store.get(userId) || [];
  list.push(t);
  store.set(userId, list);
  return t;
}

export function devUpdateTemplate(userId: string, id: string, patch: Record<string, any>): DevTemplate | null {
  const store = getGlobalStore();
  const list = store.get(userId) || [];
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const updated = { ...list[idx], ...patch, updated_at: now } as DevTemplate;
  list[idx] = updated;
  store.set(userId, list);
  return updated;
}

export function devDeleteTemplate(userId: string, id: string): boolean {
  const store = getGlobalStore();
  const list = store.get(userId) || [];
  const next = list.filter((t) => t.id !== id);
  const removed = next.length !== list.length;
  store.set(userId, next);
  return removed;
}
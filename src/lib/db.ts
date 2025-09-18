import { createClient } from '@supabase/supabase-js';

export type Prompt = {
  id: string;
  name: string;
  description: string | null;
  score: number;
  created_at: string;
  updated_at: string; // exposed for caching/ETag purposes
};

export type Tag = {
  id: string;
  name: string;
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Override: force local DB even if Supabase env vars are present
const DB_MODE = process.env.PIGEON_DB_MODE?.toLowerCase();
const USE_LOCAL_DB = DB_MODE === 'local' || process.env.PIGEON_USE_LOCAL_DB === 'true';

// Prefer LOCAL_DATABASE_URL if provided; otherwise fallback to DATABASE_URL
const LOCAL_DB_URL = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;

// --- BEGIN local helper types to avoid @types/pg requirement ---
// Use a lightweight structural type for the subset we use
type PgClientSubset = {
  connect: () => Promise<void>;
  end: () => Promise<void>;
  // Using 'any' avoids introducing unused parameter names in function type signatures
  query: any;
};
// --- END helper types ---

export function getDbRuntimeStatus() {
  return {
    mode: (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) ? 'supabase' : 'local',
    supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
    useLocalOverride: USE_LOCAL_DB,
  } as const;
}

export async function pingDb(): Promise<{
  ok: boolean;
  mode: 'supabase' | 'local';
  latency_ms?: number;
  error?: { message: string; code?: string };
}> {
  const effective = (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) ? 'supabase' : 'local';
  const t0 = Date.now();

  if (effective === 'supabase') {
    try {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return { ok: false, mode: 'supabase', error: { message: 'SUPABASE_URL/ANON_KEY not configured' } };
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
      const { error } = await supabase.from('prompts').select('id', { count: 'exact' }).limit(1);
      if (error) return { ok: false, mode: 'supabase', error: { message: error.message } };
      return { ok: true, mode: 'supabase', latency_ms: Date.now() - t0 };
    } catch (err: any) {
      return { ok: false, mode: 'supabase', error: { message: err?.message || 'Unknown error' } };
    }
  }

  try {
    if (!LOCAL_DB_URL) {
      return { ok: false, mode: 'local', error: { message: 'No database URL found. Set LOCAL_DATABASE_URL or DATABASE_URL.' } };
    }
    const { Client } = (await import('pg')) as any;
    // Force IPv4 when using localhost to avoid ::1 if Postgres isn't listening on IPv6
    let hostOverride: string | undefined;
    let portOverride: number | undefined;
    try {
      const parsed = new URL(LOCAL_DB_URL);
      if (parsed.hostname === 'localhost') hostOverride = '127.0.0.1';
      if (parsed.port) portOverride = parseInt(parsed.port, 10);
    } catch { /* ignore parse errors, fall back to connectionString only */ }

    const client: PgClientSubset = new Client({
      connectionString: LOCAL_DB_URL,
      host: hostOverride, // will override connectionString host if present
      port: portOverride,
      connectionTimeoutMillis: 1500,
    } as any);

    await client.connect();
    try {
      await client.query('select 1');
      return { ok: true, mode: 'local', latency_ms: Date.now() - t0 };
    } finally {
      await client.end();
    }
  } catch (err: any) {
    return { ok: false, mode: 'local', error: { message: err?.message || 'Unknown error', code: err?.code } };
  }
}

export type PromptSort = 'score_desc' | 'created_desc' | 'created_asc' | 'name_asc' | 'name_desc';

export async function getPublicPrompts(params: {
  q?: string;
  page: number;
  size: number;
  sort: PromptSort;
  tags?: string[]; // filter by tag names (OR semantics)
}): Promise<{ items: Prompt[]; page: number; size: number; total: number; hasMore: boolean; sort: PromptSort } & { tags?: string[] }>{
  const { q, page, size, sort, tags } = params;
  const tagsFilter = (tags || []).filter(Boolean);

  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    // Supabase path (omitted here). In development without a DB, use in-memory dev store.
    if (process.env.NODE_ENV !== 'production') {
      try {
        const devMap: Map<string, any> = (globalThis as any).__DEV_PROMPTS || new Map<string, any>();
        (globalThis as any).__DEV_PROMPTS = devMap;
        let arr = Array.from(devMap.values()).filter((p) => p && p.status === 'public');
        if (q && q.trim()) {
          const qq = q.trim().toLowerCase();
          arr = arr.filter((p) => (p.name || '').toLowerCase().includes(qq) || (p.description || '').toLowerCase().includes(qq));
        }
        // tags filtering for dev store is a no-op unless prompts contain tags metadata
        const sortKey = sort || 'score_desc';
        arr.sort((a, b) => {
          switch (sortKey) {
            case 'created_desc':
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'created_asc':
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'name_asc':
              return String(a.name).localeCompare(String(b.name));
            case 'name_desc':
              return String(b.name).localeCompare(String(a.name));
            case 'score_desc':
            default:
              return (b.score ?? 0) - (a.score ?? 0) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          }
        });
        const total = arr.length;
        const start = Math.max(0, (page - 1) * size);
        const pageItems = arr.slice(start, start + size);
        const items = pageItems.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          score: p.score ?? 0,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));
        return { items, page, size, total, hasMore: start + items.length < total, sort, tags };
      } catch (_err) {
        // Ignore dev in-memory fallback errors and proceed to return empty results
      }
    }
    return { items: [], page, size, total: 0, hasMore: false, sort };
  }

  if (!LOCAL_DB_URL) {
    if (process.env.NODE_ENV !== 'production') {
      try {
        const devMap: Map<string, any> = (globalThis as any).__DEV_PROMPTS || new Map<string, any>();
        (globalThis as any).__DEV_PROMPTS = devMap;
        let arr = Array.from(devMap.values()).filter((p) => p && p.status === 'public');
        if (q && q.trim()) {
          const qq = q.trim().toLowerCase();
          arr = arr.filter((p) => (p.name || '').toLowerCase().includes(qq) || (p.description || '').toLowerCase().includes(qq));
        }
        const sortKey = sort || 'score_desc';
        arr.sort((a, b) => {
          switch (sortKey) {
            case 'created_desc':
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'created_asc':
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'name_asc':
              return String(a.name).localeCompare(String(b.name));
            case 'name_desc':
              return String(b.name).localeCompare(String(a.name));
            case 'score_desc':
            default:
              return (b.score ?? 0) - (a.score ?? 0) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          }
        });
        const total = arr.length;
        const start = Math.max(0, (page - 1) * size);
        const pageItems = arr.slice(start, start + size);
        const items = pageItems.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          score: p.score ?? 0,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));
        return { items, page, size, total, hasMore: start + items.length < total, sort, tags };
      } catch (_err) {
        // Ignore dev in-memory fallback errors and proceed to return empty results
      }
    }
    return { items: [], page, size, total: 0, hasMore: false, sort };
  }

  const { Client } = (await import('pg')) as any;
  const client: PgClientSubset = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    const whereClauses: string[] = ["status='public'"];
    const params: any[] = [];

    let nextIndex = 1;

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`); // $1 (or current index)
      whereClauses.push(`(name ilike $${nextIndex} or description ilike $${nextIndex})`);
      nextIndex++;
    }

    if (tagsFilter.length > 0) {
      // ANY (OR) semantics: there exists a row in prompt_tags -> tags with name in tagsFilter
      params.push(tagsFilter);
      const idx = nextIndex;
      nextIndex++;
      whereClauses.push(`exists (
        select 1 from prompt_tags pt
        join tags t on t.id = pt.tag_id
        where pt.prompt_id = prompts.id and t.name = any($${idx}::text[])
      )`);
    }

    const whereSql = whereClauses.length ? `where ${whereClauses.join(' and ')}` : '';

    // Total count
    const countSql = `select count(*)::int as cnt from prompts ${whereSql}`;
    const countRes = await client.query(countSql, params);
    const total: number = (countRes as any).rows?.[0]?.cnt ?? 0;

    // Safe ORDER BY mapping
    const orderSqlMap: Record<PromptSort, string> = {
      score_desc: 'score desc, created_at desc',
      created_desc: 'created_at desc',
      created_asc: 'created_at asc',
      name_asc: 'name asc',
      name_desc: 'name desc',
    };

    const orderSql = orderSqlMap[sort] || orderSqlMap.score_desc;

    // Page
    const limit = Math.max(1, Math.min(100, size));
    const offset = Math.max(0, (page - 1) * limit);

    const dataSql = `
      select id, name, description, score, created_at, updated_at
      from prompts
      ${whereSql}
      order by ${orderSql}
      limit ${limit} offset ${offset}
    `;
    const dataRes = await client.query(dataSql, params);
    const items = ((dataRes as any).rows || []) as Prompt[];

    // tags per prompt (optional)
    const map: Record<string, string[]> = {};
    const ids = items.map(i => i.id);
    if (ids.length) {
      const rowsRes = await client.query(
        `select pt.prompt_id, t.name
         from prompt_tags pt
         join tags t on t.id = pt.tag_id
         where pt.prompt_id = any($1::uuid[])`,
        [ids]
      );
      for (const r of (rowsRes as any).rows as Array<{ prompt_id: string; name: string }>) {
        if (!map[r.prompt_id]) map[r.prompt_id] = [];
        if (!map[r.prompt_id].includes(r.name)) map[r.prompt_id].push(r.name);
      }
      for (const k of Object.keys(map)) map[k].sort((a, b) => a.localeCompare(b));
    }

    return { items, page, size, total, hasMore: offset + items.length < total, sort, tags };
  } finally {
    await client.end();
  }
}

export type PromptVersion = {
  id: string;
  prompt_id: string;
  version: number;
  content: any;
  model_targets: any;
  changelog: string | null;
  created_at: string;
};

export async function getPromptVersion(promptId: string, version: number): Promise<PromptVersion | null> {
  if (!promptId) throw new Error('promptId is required');
  if (!Number.isFinite(version)) throw new Error('version must be a number');
  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from('prompt_versions')
      .select('id,prompt_id,version,content,model_targets,changelog,created_at')
      .eq('prompt_id', promptId)
      .eq('version', version)
      .maybeSingle();
    if (error) throw error;
    return (data as any as PromptVersion) || null;
  }
  if (!LOCAL_DB_URL) {
    if (process.env.NODE_ENV !== 'production') {
      const now = new Date().toISOString();
      const devVersion: PromptVersion = {
        id: `dev-${promptId}-${version}`,
        prompt_id: promptId,
        version,
        content: { text: 'dev content' },
        model_targets: [],
        changelog: null,
        created_at: now,
      };
      return devVersion;
    }
    throw new Error('No database URL found. Set LOCAL_DATABASE_URL or DATABASE_URL.');
  }
  const { Client } = await import('pg');
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    const res = await client.query(
      `select id, prompt_id, version, content, model_targets, changelog, created_at
       from prompt_versions where prompt_id = $1 and version = $2`,
      [promptId, version]
    );
    if (res.rowCount === 0) return null;
    return res.rows[0] as PromptVersion;
  } finally {
    await client.end();
  }
}

export async function getAllTags(): Promise<Array<{ id: string; name: string }>> {
  // If using Supabase path, return empty for now (consistent with getPublicPrompts supabase branch)
  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    return [];
  }
  if (!LOCAL_DB_URL) return [];

  const { Client } = (await import('pg')) as any;
  const client: PgClientSubset = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    const res = await client.query(`select id, name from tags order by name asc`);
    return ((res as any).rows || []) as Array<{ id: string; name: string }>;
  } finally {
    await client.end();
  }
}

export async function getTagsForPromptIds(ids: string[]): Promise<Record<string, string[]>> {
  if (!Array.isArray(ids) || ids.length === 0) return {};

  // If using Supabase path, return empty map for now
  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    return {};
  }
  if (!LOCAL_DB_URL) return {};

  const { Client } = (await import('pg')) as any;
  const client: PgClientSubset = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    const res = await client.query(
      `select pt.prompt_id, t.name
       from prompt_tags pt
       join tags t on t.id = pt.tag_id
       where pt.prompt_id = any($1::uuid[])`,
      [ids]
    );
    const map: Record<string, string[]> = {};
    for (const r of ((res as any).rows || []) as Array<{ prompt_id: string; name: string }>) {
      if (!map[r.prompt_id]) map[r.prompt_id] = [];
      if (!map[r.prompt_id].includes(r.name)) map[r.prompt_id].push(r.name);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.localeCompare(b));
    return map;
  } finally {
    await client.end();
  }
}

export async function listPromptVersions(promptId: string): Promise<PromptVersion[]> {
  if (!promptId) throw new Error('promptId is required');
  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from('prompt_versions')
      .select('id,prompt_id,version,content,model_targets,changelog,created_at')
      .eq('prompt_id', promptId)
      .order('version', { ascending: false });
    if (error) throw error;
    return data as any as PromptVersion[];
  }
  if (!LOCAL_DB_URL) {
    if (process.env.NODE_ENV !== 'production') {
      // Dev fallback: no DB available; return empty version history
      return [];
    }
    throw new Error('No database URL found. Set LOCAL_DATABASE_URL or DATABASE_URL.');
  }
  const { Client } = await import('pg');
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    const res = await client.query(
      `select id,prompt_id,version,content,model_targets,changelog,created_at
       from prompt_versions where prompt_id = $1 order by version desc`,
      [promptId]
    );
    return res.rows as PromptVersion[];
  } finally {
    await client.end();
  }
}

// New: createPrompt used by POST /api/prompts
export async function createPrompt(input: {
  name: string;
  description?: string | null;
  variables?: any[];
  status?: 'draft' | 'public' | 'flagged' | 'removed';
}): Promise<PromptDetail> {
  const name = (input.name ?? '').toString().trim();
  if (!name) throw new Error('name is required');
  const description = input.description ?? null;
  const variables = Array.isArray(input.variables) ? input.variables : [];
  const status = (input.status ?? 'draft') as 'draft' | 'public' | 'flagged' | 'removed';

  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from('prompts')
      .insert({ name, description, variables, status })
      .select('id,name,description,variables,status,score,created_at,updated_at')
      .single();
    if (error) throw error;
    return data as any as PromptDetail;
  }

  if (!LOCAL_DB_URL) {
    if (process.env.NODE_ENV !== 'production') {
      const { randomUUID } = await import('crypto');
      const devMap: Map<string, PromptDetail> = (globalThis as any).__DEV_PROMPTS || new Map<string, PromptDetail>();
      (globalThis as any).__DEV_PROMPTS = devMap;
      const now = new Date().toISOString();
      const prompt: PromptDetail = {
        id: randomUUID(),
        name,
        description,
        variables,
        status,
        score: 0,
        created_at: now,
        updated_at: now,
      };
      devMap.set(prompt.id, prompt);
      return prompt;
    }
    throw new Error('No database URL found. Set LOCAL_DATABASE_URL or DATABASE_URL.');
  }
  const { Client } = await import('pg');
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    const res = await client.query(
      `insert into prompts (name, description, variables, status)
       values ($1, $2, coalesce($3::jsonb, '[]'::jsonb), coalesce($4::text, 'draft'))
       returning id,name,description,variables,status,score,created_at,updated_at`,
      [name, description, JSON.stringify(variables), status]
    );
    return res.rows[0] as PromptDetail;
  } finally {
    await client.end();
  }
}

export async function createPromptVersion(
  promptId: string,
  input: { content: string; changelog?: string | null; model_targets?: string[] }
): Promise<PromptVersion> {
  if (!promptId) throw new Error('promptId is required');
  const content = (input.content ?? '').toString();
  if (!content.trim()) throw new Error('content is required');
  const changelog = input.changelog ?? null;
  const modelTargets = Array.isArray(input.model_targets) ? input.model_targets : [];

  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: latest, error: latestErr } = await supabase
      .from('prompt_versions')
      .select('version')
      .eq('prompt_id', promptId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestErr) throw latestErr;
    const nextVersion = (latest?.version ?? 0) + 1;

    const { data, error } = await supabase
      .from('prompt_versions')
      .insert({ prompt_id: promptId, version: nextVersion, content, changelog, model_targets: modelTargets })
      .select('id,prompt_id,version,content,model_targets,changelog,created_at')
      .single();
    if (error) throw error;
    return data as any as PromptVersion;
  }

  if (!LOCAL_DB_URL) throw new Error('No database URL found. Set LOCAL_DATABASE_URL or DATABASE_URL.');
  const { Client } = await import('pg');
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    const res = await client.query(
      `with next as (
         select coalesce(max(version), 0) + 1 as v from prompt_versions where prompt_id = $1
       )
       insert into prompt_versions (prompt_id, version, content, model_targets, changelog)
       select $1, next.v, $2, $3::text[], $4 from next
       returning id, prompt_id, version, content, model_targets, changelog, created_at`,
      [promptId, content, modelTargets, changelog]
    );
    return res.rows[0] as PromptVersion;
  } finally {
    await client.end();
  }
}

export async function updatePrompt(
  id: string,
  patch: {
    name?: string;
    description?: string | null;
    variables?: any;
    status?: 'draft' | 'public' | 'flagged' | 'removed';
    ifMatchUpdatedAt?: string;
  }
): Promise<PromptDetail> {
  if (!id) throw new Error('id is required');
  const fields: Record<string, any> = {};
  if (patch.name !== undefined) fields.name = patch.name;
  if (patch.description !== undefined) fields.description = patch.description;
  if (patch.variables !== undefined) fields.variables = patch.variables;
  if (patch.status !== undefined) fields.status = patch.status;

  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    let qb = supabase.from('prompts').update(fields).eq('id', id);
    if (patch.ifMatchUpdatedAt) {
      qb = qb.eq('updated_at', patch.ifMatchUpdatedAt as any);
    }
    const { data, error } = await qb.select('id,name,description,variables,status,score,created_at,updated_at').single();
    if (error) throw error;
    return data as any as PromptDetail;
  }

  // Dev fallback: in-memory update when no DB configured
  if (!LOCAL_DB_URL) {
    if (process.env.NODE_ENV !== 'production') {
      const glob: any = globalThis as any;
      glob.__DEV_PROMPTS = glob.__DEV_PROMPTS || new Map<string, PromptDetail>();
      const map: Map<string, PromptDetail> = glob.__DEV_PROMPTS;
      const existing = map.get(id);
      if (!existing) throw Object.assign(new Error('Not found'), { status: 404 });
      if (patch.ifMatchUpdatedAt && patch.ifMatchUpdatedAt !== existing.updated_at) {
        throw Object.assign(new Error('Precondition failed'), { status: 409 });
      }
      const now = new Date().toISOString();
      const updated: PromptDetail = {
        ...existing,
        ...(fields.name !== undefined ? { name: fields.name } : {}),
        ...(fields.description !== undefined ? { description: fields.description } : {}),
        ...(fields.variables !== undefined ? { variables: fields.variables } : {}),
        ...(fields.status !== undefined ? { status: fields.status } : {}),
        updated_at: now,
      };
      map.set(id, updated);
      return updated;
    }
    throw new Error('No database URL found. Set LOCAL_DATABASE_URL or DATABASE_URL.');
  }

  const { Client } = await import('pg');
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = $${idx}`);
      params.push(v);
      idx++;
    }
    if (sets.length === 0) throw new Error('no fields to update');
    params.push(id); // id param
    const whereParts = [`id = $${idx}`];
    idx++;
    if (patch.ifMatchUpdatedAt) {
      params.push(patch.ifMatchUpdatedAt);
      whereParts.push(`updated_at = $${idx}::timestamptz`);
      idx++;
    }
    const sql = `update prompts set ${sets.join(', ')} where ${whereParts.join(' and ')} returning id,name,description,variables,status,score,created_at,updated_at`;
    const res = await client.query(sql, params);
    if (res.rowCount === 0) throw Object.assign(new Error('Precondition failed'), { status: 412 });
    return res.rows[0] as PromptDetail;
  } finally {
    await client.end();
  }
}

export async function softDeletePrompt(id: string, ifMatchUpdatedAt?: string): Promise<PromptDetail> {
  return updatePrompt(id, { status: 'removed', ifMatchUpdatedAt });
}

export type PromptDetail = Prompt & {
  variables: any;
  status: 'draft' | 'public' | 'flagged' | 'removed';
};

export async function getPromptById(id: string): Promise<PromptDetail | null> {
  if (!id) throw new Error('id is required');
  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from('prompts')
      .select('id,name,description,variables,status,score,created_at,updated_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data as any as PromptDetail) || null;
  }
  // Dev fallback: read from in-memory map when no DB configured
  if (!LOCAL_DB_URL) {
    if (process.env.NODE_ENV !== 'production') {
      const glob: any = globalThis as any;
      glob.__DEV_PROMPTS = glob.__DEV_PROMPTS || new Map<string, PromptDetail>();
      const map: Map<string, PromptDetail> = glob.__DEV_PROMPTS;
      return map.get(id) ?? null;
    }
    throw new Error('No database URL found. Set LOCAL_DATABASE_URL or DATABASE_URL.');
  }
  const { Client } = await import('pg');
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    const res = await client.query(
      `select id,name,description,variables,status,score,created_at,updated_at from prompts where id = $1`,
      [id]
    );
    return (res.rows[0] as PromptDetail) || null;
  } finally {
    await client.end();
  }
}
export type Template = {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  system_prompt: string;
  user_prompt_template: string;
  variables: any;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export async function getUserTemplates(userId: string): Promise<Template[]> {
  const uid = (userId || '').trim();
  if (!uid) throw Object.assign(new Error('userId is required'), { status: 401 });
  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    // TODO: implement Supabase path using RLS + auth
    return [];
  }
  if (!LOCAL_DB_URL) return [];
  const { Client } = await import('pg');
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    // Ensure a users row exists for this handle and resolve canonical UUID
    await client.query(`insert into users(handle) values ($1) on conflict (handle) do nothing`, [uid]);
    const u = await client.query('select id from users where handle = $1 or id::text = $1 limit 1', [uid]);
    if (u.rowCount === 0) return [];
    const dbUid = u.rows[0].id;

    const res = await client.query(
      `select id, user_id, name, description, system_prompt, user_prompt_template, variables, tags, created_at, updated_at
       from templates where user_id = $1 order by updated_at desc`,
      [dbUid]
    );
    return res.rows as Template[];
  } finally {
    await client.end();
  }
}

export async function createTemplate(userId: string, input: {
  name: string;
  description?: string | null;
  system_prompt?: string;
  user_prompt_template?: string;
  variables?: any[];
  tags?: string[];
}): Promise<Template> {
  const uid = (userId || '').trim();
  if (!uid) throw Object.assign(new Error('userId is required'), { status: 401 });
  const name = (input.name ?? '').toString().trim();
  if (!name) throw Object.assign(new Error('name is required'), { status: 400 });
  const description = input.description ?? null;
  const system_prompt = (input.system_prompt ?? '').toString();
  const user_prompt_template = (input.user_prompt_template ?? '').toString();
  const variables = Array.isArray(input.variables) ? input.variables : [];
  const tags = Array.isArray(input.tags) ? Array.from(new Set(input.tags.filter(Boolean))) : [];

  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    // TODO: implement Supabase path with RLS
    throw Object.assign(new Error('Not implemented'), { status: 501 });
  }
  if (!LOCAL_DB_URL) throw new Error('No database URL found. Set LOCAL_DATABASE_URL or DATABASE_URL.');
  const { Client } = await import('pg');
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    // Resolve canonical user UUID from provided handle/id
    await client.query(`insert into users(handle) values ($1) on conflict (handle) do nothing`, [uid]);
    const userRow = await client.query('select id from users where handle = $1 or id::text = $1 limit 1', [uid]);
    if (userRow.rowCount === 0) throw new Error('failed to resolve user');
    const dbUid = userRow.rows[0].id;

    const res = await client.query(
      `insert into templates (user_id, name, description, system_prompt, user_prompt_template, variables, tags)
       values ($1, $2, $3, $4, $5, coalesce($6::jsonb, '[]'::jsonb), coalesce($7::text[], '{}'::text[]))
       returning id, user_id, name, description, system_prompt, user_prompt_template, variables, tags, created_at, updated_at`,
      [dbUid, name, description, system_prompt, user_prompt_template, JSON.stringify(variables), tags]
    );
    return res.rows[0] as Template;
  } finally {
    await client.end();
  }
}

export async function updateTemplate(userId: string, id: string, patch: {
  name?: string;
  description?: string | null;
  system_prompt?: string;
  user_prompt_template?: string;
  variables?: any[];
  tags?: string[];
}): Promise<Template> {
  const uid = (userId || '').trim();
  if (!uid) throw Object.assign(new Error('userId is required'), { status: 401 });
  if (!id) throw new Error('id is required');
  const fields: Record<string, any> = {};
  if (patch.name !== undefined) fields.name = patch.name;
  if (patch.description !== undefined) fields.description = patch.description;
  if (patch.system_prompt !== undefined) fields.system_prompt = patch.system_prompt;
  if (patch.user_prompt_template !== undefined) fields.user_prompt_template = patch.user_prompt_template;
  if (patch.variables !== undefined) fields.variables = patch.variables;
  if (patch.tags !== undefined) fields.tags = Array.isArray(patch.tags) ? Array.from(new Set(patch.tags.filter(Boolean))) : [];

  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    // TODO: Supabase path
    throw Object.assign(new Error('Not implemented'), { status: 501 });
  }
  if (!LOCAL_DB_URL) throw new Error('No database URL found. Set LOCAL_DATABASE_URL or DATABASE_URL.');
  const { Client } = await import('pg');
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = $${idx}`);
      params.push(k === 'variables' ? JSON.stringify(v) : v);
      idx++;
    }
    if (sets.length === 0) throw new Error('no fields to update');
    // where
    params.push(id);
    const whereParts = [`id = $${idx}`];
    idx++;
    params.push(uid);
    whereParts.push(`user_id = $${idx}`);
    const sql = `update templates set ${sets.join(', ')} where ${whereParts.join(' and ')} returning id, user_id, name, description, system_prompt, user_prompt_template, variables, tags, created_at, updated_at`;
    const res = await client.query(sql, params);
    if (res.rowCount === 0) throw Object.assign(new Error('Not found'), { status: 404 });
    return res.rows[0] as Template;
  } finally {
    await client.end();
  }
}

export async function deleteTemplate(userId: string, id: string): Promise<boolean> {
  const uid = (userId || '').trim();
  if (!uid) throw Object.assign(new Error('userId is required'), { status: 401 });
  if (!id) throw new Error('id is required');
  if (!USE_LOCAL_DB && SUPABASE_URL && SUPABASE_ANON_KEY) {
    // TODO Supabase path
    throw Object.assign(new Error('Not implemented'), { status: 501 });
  }
  if (!LOCAL_DB_URL) throw new Error('No database URL found. Set LOCAL_DATABASE_URL or DATABASE_URL.');
  const { Client } = await import('pg');
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  try {
    // Resolve canonical user UUID
    const u = await client.query('select id from users where handle = $1 or id::text = $1 limit 1', [uid]);
    if (u.rowCount === 0) return false;
    const dbUid = u.rows[0].id;

    const res = await client.query(`delete from templates where id = $1 and user_id = $2`, [id, dbUid]);
    return (res.rowCount ?? 0) > 0;
  } finally {
    await client.end();
  }
}
import Link from 'next/link';
import { getPublicPrompts, type PromptSort, getDbRuntimeStatus, getAllTags, getTagsForPromptIds } from '@/lib/db';
import CreatePromptButton from './CreatePromptButton';

// Types mirror catalog API but sourced directly from DB
type CatalogPrompt = {
  id: string;
  name: string;
  description: string | null;
  score: number;
  created_at: string;
  updated_at: string;
};

const DEFAULT_PAGE = 1;
const DEFAULT_SORT: PromptSort = 'score_desc';
const PAGE_SIZE = 20; // keep in sync with API default for predictable navigation

export default async function LibraryPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? '';
  const pageStr = (Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page) ?? String(DEFAULT_PAGE);
  const sort = ((Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort) as PromptSort) || DEFAULT_SORT;

  // tags can be provided as tag=foo&tag=bar or tags=foo,bar
  const repeatedTags = Array.isArray(searchParams.tag) ? (searchParams.tag as string[]) : (searchParams.tag ? [searchParams.tag as string] : []);
  const csvTags = ((Array.isArray(searchParams.tags) ? searchParams.tags[0] : searchParams.tags) || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const activeTags = Array.from(new Set([...(repeatedTags as string[]), ...csvTags]));

  const pageNum = Number.isFinite(Number(pageStr)) && Number(pageStr) > 0 ? Math.floor(Number(pageStr)) : DEFAULT_PAGE;

  // Attempt to fetch; degrade gracefully on DB errors so the page does not 500
  let items: CatalogPrompt[] = [];
  let total = 0;
  let dbError: string | null = null;
  let allTags: { id: string; name: string }[] = [];
  let promptTags: Record<string, string[]> = {};
  try {
    const res = await getPublicPrompts({ q: q || undefined, page: pageNum, size: PAGE_SIZE, sort, tags: activeTags.length ? activeTags : undefined });
    items = res.items as CatalogPrompt[];
    total = res.total;

    // fetch tag catalog & per-prompt tags in parallel (server components allow await)
    [allTags, promptTags] = await Promise.all([
      getAllTags(),
      items.length ? getTagsForPromptIds(items.map(p => p.id)) : Promise.resolve({} as Record<string, string[]>)
    ]);
  } catch (err: any) {
    dbError = err?.message || 'Failed to load prompts.';
  }

  const hasMore = pageNum * PAGE_SIZE < total;
  const prevPage = Math.max(1, pageNum - 1);
  const nextPage = pageNum + 1;

  const buildHref = (overrides: Partial<{ q: string; page: number; sort: PromptSort; tag: string[]; tags: string[] }>) => {
    const params = new URLSearchParams();
    const qVal = overrides.q ?? q;
    const pageVal = overrides.page ?? (overrides.q !== undefined && overrides.q !== q ? 1 : pageNum);
    const sortVal = overrides.sort ?? sort;
    const tagVals = overrides.tags ?? activeTags;
    if (qVal) params.set('q', qVal);
    if (pageVal) params.set('page', String(pageVal));
    if (sortVal) params.set('sort', sortVal);
    if (tagVals && tagVals.length) {
      // use repeated tag params for clarity
      for (const t of tagVals) params.append('tag', t);
    }
    return `/library?${params.toString()}`;
  };

  const dbStatus = getDbRuntimeStatus();

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Prompt Library</h1>
          <p className="text-sm opacity-70">Browse public prompts. Click a row to open in Prompt Studio.</p>
        </div>
        <div className="flex items-center gap-2">
          <CreatePromptButton />
          <Link
            href="/templates"
            prefetch={false}
            className="rounded-md border border-neutral-300/60 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700/60 dark:hover:bg-neutral-900"
          >
            Templates
          </Link>
          <Link
            href="/inventory"
            prefetch={false}
            data-testid="nav-inventory"
            aria-label="Inventory"
            className="rounded-md border border-neutral-300/60 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700/60 dark:hover:bg-neutral-900"
          >
            Inventory
          </Link>
          <Link
            href="/"
            prefetch={false}
            className="rounded-md border border-neutral-300/60 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700/60 dark:hover:bg-neutral-900"
          >
            Home
          </Link>
        </div>
      </header>

      {dbError && (
        <div className="mb-4 rounded-md border border-amber-300/60 bg-amber-50 p-3 text-amber-900 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-100">
          <div className="mb-1 text-sm font-medium">Database not reachable</div>
          <div className="text-xs opacity-90">
            {dbError}
            <div className="mt-2">
              <div>Effective mode: <span className="font-mono">{dbStatus.mode}</span></div>
              {dbStatus.mode === 'local' ? (
                <div>
                  <div className="mt-1">Tip: Ensure your local Postgres is running and LOCAL_DATABASE_URL or DATABASE_URL is set. You can also set PIGEON_DB_MODE=supabase with SUPABASE_URL and SUPABASE_ANON_KEY to use Supabase.</div>
                </div>
              ) : (
                <div>
                  <div className="mt-1">Tip: Verify SUPABASE_URL and SUPABASE_ANON_KEY are valid and accessible from the server. Supabase configured: <span className="font-mono">{String((dbStatus as any).supabaseConfigured)}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form action="/library" method="get" className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="q" className="mb-1 block text-sm font-medium opacity-80">Search</label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Search by name or description..."
            className="w-full rounded-md border border-neutral-300/60 bg-white px-3 py-2 text-sm outline-none ring-blue-500/0 focus:border-blue-500 focus:ring-1 dark:border-neutral-700/60 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label htmlFor="sort" className="mb-1 block text-sm font-medium opacity-80">Sort by</label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="w-full rounded-md border border-neutral-300/60 bg-white px-3 py-2 text-sm outline-none ring-blue-500/0 focus:border-blue-500 focus:ring-1 dark:border-neutral-700/60 dark:bg-neutral-900"
          >
            <option value="score_desc">Score (desc)</option>
            <option value="created_desc">Created (newest)</option>
            <option value="created_asc">Created (oldest)</option>
            <option value="name_asc">Name (A→Z)</option>
            <option value="name_desc">Name (Z→A)</option>
          </select>
        </div>
        {/* Reset page to 1 on new search/sort */}
        <input type="hidden" name="page" value="1" />

        {/* Tag filters */}
        <div className="sm:col-span-3">
          <label className="mb-1 block text-sm font-medium opacity-80">Filter by tags</label>
          <div className="flex flex-wrap gap-2">
            {allTags.map(t => {
              const selected = activeTags.includes(t.name);
              const nextTags = selected ? activeTags.filter(x => x !== t.name) : [...activeTags, t.name];
              return (
                <Link
                  key={t.id}
                  href={buildHref({ page: 1, tags: nextTags })}
                  prefetch={false}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${selected ? 'bg-blue-600 text-white border-blue-600' : 'border-neutral-300/60 hover:bg-neutral-50 dark:border-neutral-700/60 dark:hover:bg-neutral-900'}`}
                  aria-label={selected ? `Remove tag ${t.name}` : `Add tag ${t.name}`}
                >
                  {t.name}
                </Link>
              );
            })}
          </div>
          {activeTags.length > 0 && (
            <div className="mt-2 text-xs opacity-70">Active: {activeTags.join(', ')}</div>
          )}
        </div>

        <div className="sm:col-span-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Apply search and sorting"
          >
            Apply
          </button>
        </div>
      </form>

      <section className="rounded-xl border border-neutral-200/40 bg-neutral-50/40 p-2 shadow-sm dark:border-neutral-700/40 dark:bg-neutral-900/20">
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm opacity-70">No prompts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200/50 bg-neutral-100/50 text-left text-xs uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3" aria-label="tags">Tags</th>
                  <th className="px-4 py-3" aria-label="actions" />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="group border-b border-neutral-200/50 hover:bg-white dark:border-neutral-800 dark:hover:bg-neutral-900">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">
                        <Link href={`/studio/${p.id}`} prefetch={false} className="text-blue-600 hover:underline">
                          {p.name}
                        </Link>
                      </div>
                      {p.description && (
                        <div className="mt-1 line-clamp-2 text-xs opacity-70">{p.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top tabular-nums">{p.score.toFixed(2)}</td>
                    <td className="px-4 py-3 align-top">
                      {new Date(p.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1">
                        {(promptTags[p.id] || []).map((t) => (
                          <span key={t} className="inline-flex items-center rounded-full border border-neutral-300/60 px-2 py-0.5 text-[10px] dark:border-neutral-700/60">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/studio/${p.id}`}
                        prefetch={false}
                        className="invisible rounded-md border border-neutral-300/60 px-2 py-1 text-xs group-hover:visible dark:border-neutral-700/60"
                        aria-label={`Open ${p.name} in Studio`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <nav className="mt-4 flex items-center justify-between">
        <div className="text-xs opacity-70">Total: {total}</div>
        <div className="flex items-center gap-2">
          <Link
            href={buildHref({ page: prevPage })}
            prefetch={false}
            aria-disabled={pageNum <= 1}
            className={`rounded-md border px-3 py-1 text-sm ${pageNum <= 1 ? 'pointer-events-none cursor-not-allowed opacity-50' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'} border-neutral-300/60 dark:border-neutral-700/60`}
          >
            Previous
          </Link>
          <span className="text-xs opacity-70">Page {pageNum}</span>
          <Link
            href={buildHref({ page: nextPage })}
            prefetch={false}
            aria-disabled={!hasMore}
            className={`rounded-md border px-3 py-1 text-sm ${!hasMore ? 'pointer-events-none cursor-not-allowed opacity-50' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'} border-neutral-300/60 dark:border-neutral-700/60`}
          >
            Next
          </Link>
        </div>
      </nav>
    </main>
  );
}
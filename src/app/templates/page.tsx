import Link from 'next/link';
import { listSystemTemplates } from '@/lib/templates/system';

export default async function TemplatesPage() {
  const items = listSystemTemplates();

  return (
    <main className="mx-auto w-full max-w-6xl p-6" data-testid="templates-page">
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-sm opacity-70">Starter templates to accelerate your workflow. Fork to customize.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/library"
            prefetch={false}
            className="rounded-md border border-neutral-300/60 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700/60 dark:hover:bg-neutral-900"
          >
            Library
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

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(t => (
          <div key={t.id} className="rounded-lg border border-neutral-200/60 bg-white p-4 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/40" data-testid="template-card">
            <div className="mb-1 text-sm font-semibold">{t.name}</div>
            <div className="mb-2 text-xs opacity-70">{t.description}</div>
            <div className="flex flex-wrap gap-1">
              {t.tags.map(tag => (
                <span key={tag} className="inline-flex items-center rounded-full border border-neutral-300/60 px-2 py-0.5 text-[10px] dark:border-neutral-700/60">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
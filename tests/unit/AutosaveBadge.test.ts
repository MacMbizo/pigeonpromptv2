/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AutosaveBadge from '@/components/AutosaveBadge';
import axe from 'axe-core';

let axeInjected = false;
async function runAxe(node: HTMLElement) {
  const doc = node.ownerDocument!;
  const win = doc.defaultView as any;
  if (!axeInjected) {
    const script = doc.createElement('script');
    // axe exposes a .source string for injection
    script.textContent = (axe as any).source as string;
    doc.head.appendChild(script);
    axeInjected = true;
  }
  return await (win as any).axe.run(doc, { rules: { 'color-contrast': { enabled: false } } });
}

describe('AutosaveBadge (presentational)', () => {
  it('renders only an SR live region when idle', () => {
    render(React.createElement(AutosaveBadge, { status: 'idle', ts: null }));
    expect(screen.queryByTestId('autosave-badge')).not.toBeInTheDocument();
    const live = screen.getByTestId('autosave-live-region');
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent('');
  });

  it('renders Autosaving badge and polite live update while saving', () => {
    render(React.createElement(AutosaveBadge, { status: 'saving', ts: null }));
    const badge = screen.getByTestId('autosave-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Autosaving…');

    const live = screen.getByTestId('autosave-live-region');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent('Autosaving');
  });

  it('renders Saved badge with timestamp title and SR announcement', () => {
    const ts = 1700000000000; // fixed timestamp
    const expectedTitle = new Date(ts).toLocaleString();

    render(React.createElement(AutosaveBadge, { status: 'saved', ts }));
    const badge = screen.getByTestId('autosave-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Saved');
    expect(badge).toHaveAttribute('title', expectedTitle);

    const live = screen.getByTestId('autosave-live-region');
    expect(live).toHaveTextContent(/Saved/);
  });

  it('renders Saved badge without title when ts is null', () => {
    render(React.createElement(AutosaveBadge, { status: 'saved', ts: null }));
    const badge = screen.getByTestId('autosave-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Saved');
    expect(badge).not.toHaveAttribute('title');
  });

  it('formats title using toLocaleString consistently for a fixed TS', () => {
    const ts = Date.UTC(2024, 0, 2, 3, 4, 5); // 2024-01-02T03:04:05Z
    const expected = new Date(ts).toLocaleString();
    render(React.createElement(AutosaveBadge, { status: 'saved', ts }));
    const badge = screen.getByTestId('autosave-badge');
    expect(badge).toHaveAttribute('title', expected);
  });

  it('omits title entirely when ts is undefined', () => {
    render(React.createElement(AutosaveBadge, { status: 'saved' } as any));
    const badge = screen.getByTestId('autosave-badge');
    expect(badge).not.toHaveAttribute('title');
  });

  it('has no critical a11y violations for each state (axe-core smoke)', async () => {
    const { container, rerender } = render(React.createElement(AutosaveBadge, { status: 'idle', ts: null }));
    let results = await runAxe(container);
    expect(results.violations.filter((v: any) => v.impact === 'critical')).toHaveLength(0);

    rerender(React.createElement(AutosaveBadge, { status: 'saving', ts: null }));
    results = await runAxe(container);
    expect(results.violations.filter((v: any) => v.impact === 'critical')).toHaveLength(0);

    rerender(React.createElement(AutosaveBadge, { status: 'saved', ts: Date.now() }));
    results = await runAxe(container);
    expect(results.violations.filter((v: any) => v.impact === 'critical')).toHaveLength(0);
  });
});
import React from 'react';
import Link from 'next/link';
import './globals.css';
import NavBar from './NavBar';

export const metadata = {
  title: 'Pigeon – Prompt & Context Engineering Workspace',
  description: 'A workspace for prompt and context engineering at enterprise scale.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur border-b border-neutral-200 dark:border-neutral-800" data-testid="app-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <Link href="/" className="text-base font-semibold" data-testid="nav-link-home">
              Pigeon
            </Link>
            {/* Client navigation with active highlighting + mobile toggle */}
            <NavBar />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
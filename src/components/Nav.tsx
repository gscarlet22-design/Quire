'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Nav() {
  const path = usePathname();
  const tabs = [
    { href: '/', label: 'Search' },
    { href: '/shelf', label: 'Shelf' },
  ];
  return (
    <nav className="flex justify-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`px-5 py-3 text-sm font-medium transition-colors ${
            path === t.href
              ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

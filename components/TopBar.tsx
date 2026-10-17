'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOwner } from '@/lib/owner';

const TABS = [
  { href: '/', label: 'Home' },
  { href: '/add', label: 'Add' },
  { href: '/me', label: '내 파일' },
];

export default function TopBar() {
  const pathname = usePathname();
  const owner = useOwner();

  return (
    <header className="sticky top-0 z-10 h-14 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold">
          Drop Or Click
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {TABS.map((tab) => {
            const active =
              tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-full px-4 py-1.5 font-medium transition ${
                  active
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
          {owner && (
            <span className="ml-3 rounded-full bg-gray-100 px-3 py-1 text-gray-600">
              {owner.name}
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
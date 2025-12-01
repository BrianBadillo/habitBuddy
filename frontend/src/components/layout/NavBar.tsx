// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/habits', label: 'Habits' },
  { href: '/pet', label: 'My Pet' },
  { href: '/friends', label: 'Friends' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between px-4 py-3 border-b bg-white/80 backdrop-blur">
      <div className="font-bold text-lg">HabitBuddy</div>

      <div className="flex items-center gap-4">
        <div className="flex gap-3 text-sm">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2 py-1 rounded-md ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Auth link */}
        <Link
          href="/auth"
          className={`text-sm px-3 py-1.5 rounded-md border ${
            pathname === '/auth'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          Log in / Sign up
        </Link>
      </div>
    </nav>
  );
}

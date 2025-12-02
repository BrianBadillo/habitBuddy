// src/components/layout/Navbar.tsx   { href: '/pet', label: 'My Pet' },
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/habits', label: 'Habits' },
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
      </div>
    </nav>
  );
}

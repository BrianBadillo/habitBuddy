// src/components/layout/Navbar.tsx   { href: '/pet', label: 'My Pet' },
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';
import type { User } from '@/types/api';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/habits', label: 'Habits' },
  { href: '/friends', label: 'Friends' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Don't fetch user info on auth page
    if (pathname.startsWith('/auth')) {
      setUser(null);
      return;
    }

    let alive = true;
    (async () => {
      try {
        const me = await api.getMe();
        if (alive) setUser(me.user);
      } catch {
        if (alive) setUser(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pathname]);

  async function handleLogout() {
    try {
      await api.authLogout(); // [`api.authLogout`](frontend/src/lib/apiClient.ts)
    } finally {
      router.push('/auth');
    }
  }

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
        
        <div>
          {user ? (
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1 rounded-md bg-slate-800 text-white"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/auth"
              className="text-sm px-3 py-1 rounded-md bg-indigo-600 text-white"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
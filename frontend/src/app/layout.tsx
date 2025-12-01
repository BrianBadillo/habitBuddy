// src/app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import { Navbar } from '@/components/layout/NavBar';

export const metadata = {
  title: 'HabitBuddy',
  description: 'Habit tracker with a virtual pet',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

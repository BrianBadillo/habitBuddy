// src/app/dashboard/page.tsx

import { api } from '@/lib/apiClient';
import { PetSummaryCard } from '@/components/pet/PetSummaryCard';
import { HabitList } from '@/components/habits/HabitList';

export default async function DashboardPage() {
  const [me, summary, quote, habits] = await Promise.all([
    api.getMe(),
    api.getMeSummary(),
    api.getDailyQuote(),
    api.getHabits(true), // true = only active habits
  ]);

  return (
    <div className="space-y-6">
      {/* Top row: pet + quick stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <PetSummaryCard pet={me.pet ?? undefined} />

        <div className="rounded-xl border p-4 bg-white flex flex-col justify-between">
          <div>
            <h2 className="font-semibold mb-2">Overview</h2>
            <ul className="text-sm space-y-1">
              <li>Total habits: {summary.totalHabits}</li>
              <li>Active habits: {summary.activeHabits}</li>
              <li>Total completions: {summary.totalCompletions}</li>
              <li>Best streak: {summary.bestStreak} days</li>
            </ul>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Logged in as{' '}
            <span className="font-medium">{me.user.username}</span>
          </p>
        </div>
      </div>

      {/* Quote */}
      <div className="rounded-xl border p-4 bg-gradient-to-r from-indigo-50 to-sky-50">
        <p className="text-sm italic">&ldquo;{quote.text}&rdquo;</p>
        <p className="text-xs mt-1 text-right text-slate-600">
          — {quote.author}
        </p>
      </div>

      {/* Habits preview */}
      <section className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Your Habits</h2>
        </div>
        <HabitList habits={habits} />
      </section>
    </div>
  );
}

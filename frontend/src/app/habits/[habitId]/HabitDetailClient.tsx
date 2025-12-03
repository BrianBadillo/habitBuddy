// src/app/habits/[habitId]/HabitDetailClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { Habit, HabitCompletion, Streak } from '@/types/api';

import { useRouter } from 'next/navigation';

interface Props {
  habit: Habit;
  history: HabitCompletion[];
  streak: Streak | null;
}

export function HabitDetailClient({ habit, history, streak }: Props) {
  const [habitState] = useState<Habit>(habit);
  const [historyState, setHistoryState] = useState<HabitCompletion[]>(history);
  const [streakState, setStreakState] = useState<Streak | null>(streak);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCheckIn() {
    setError(null);
    setMsg(null);
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);

      // record on backend
      const result = await api.checkInHabit(habitState.id, today);

      // optimistic local update
      setHistoryState((prev) => [
        ...prev,
        {
          completionId: Date.now(), // temp id; real backend id can replace later
          completedDate: today,
          completedCount: 1,
        },
      ]);

      if (result?.streak) {
        setStreakState(result.streak);
      }

      setMsg('Check-in recorded!');
      router.push('/dashboard'); // redirect after successful check-in
    } catch (err: any) {
      setError(err.message ?? 'Failed to check in.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUndo(completion: HabitCompletion) {
    setError(null);
    setMsg(null);
    try {
      setLoading(true);
      await api.undoHabitCompletion(habitState.id, completion.completionId);

      setHistoryState((prev) =>
        prev.filter((c) => c.completionId !== completion.completionId)
      );
      setMsg('Completion undone.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to undo completion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{habitState.name}</h1>
        <Link
          href="/habits"
          className="text-xs text-indigo-600 hover:underline"
        >
          ← Back to habits
        </Link>
      </div>

      {habitState.description && (
        <p className="text-sm text-slate-700">{habitState.description}</p>
      )}

      <div className="rounded-xl border bg-white p-4 flex flex-col gap-2 text-sm">
        <div>
          <span className="font-semibold">Frequency:</span>{' '}
          {habitState.frequency.toUpperCase()} · Difficulty:{' '}
          {habitState.difficulty}
        </div>
        <div>
          <span className="font-semibold">Status:</span>{' '}
          {habitState.isActive ? 'Active' : 'Inactive'}
        </div>
        {streakState && (
          <div className="flex gap-6 mt-1 text-xs text-slate-600">
            <div>
              <span className="font-semibold">Current streak:</span>{' '}
              {streakState.currentStreak} days
            </div>
            <div>
              <span className="font-semibold">Best streak:</span>{' '}
              {streakState.longestStreak} days
            </div>
            {streakState.lastCompletedDate && (
              <div>
                <span className="font-semibold">Last completed:</span>{' '}
                {streakState.lastCompletedDate}
              </div>
            )}
          </div>
        )}

        <button
          className="mt-3 inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-sm px-3 py-1.5 disabled:opacity-60"
          disabled={loading}
          onClick={handleCheckIn}
        >
          {loading ? 'Working...' : 'Check in for today'}
        </button>
      </div>


      {msg && <p className="text-xs text-emerald-600">{msg}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

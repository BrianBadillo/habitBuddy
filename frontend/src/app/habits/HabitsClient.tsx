// src/app/habits/HabitsClient.tsx
'use client';

import { useState } from 'react';
import { Habit } from '@/types/api';
import { api } from '@/lib/apiClient';
import { HabitList } from '@/components/habits/HabitList';

interface Props {
  initialHabits: Habit[];
}

const DIFFICULTY_OPTIONS = ['Trivial', 'Easy', 'Medium', 'Hard'] as const;

export function HabitsClient({ initialHabits }: Props) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    'daily',
  );
  const [difficulty, setDifficulty] =
    useState<(typeof DIFFICULTY_OPTIONS)[number]>('Easy');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreateHabit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    try {
      setSubmitting(true);

      const created = await api.createHabit({
        name: name.trim(),
        description: description.trim() || undefined,
        frequency,
        difficulty, // "Trivial" | "Easy" | "Medium" | "Hard"
      });

      setHabits((prev) => [...prev, created]);
      setName('');
      setDescription('');
      setFrequency('daily');
      setDifficulty('Easy');
      setSuccess('Habit created!');
    } catch (err: any) {
      setError(err.message ?? 'Failed to create habit.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckIn(habitId: string) {
    setError(null);
    setSuccess(null);

    // 🔒 don’t allow check-in on completed habits
    const target = habits.find((h) => h.id === habitId);
    if (!target) return;
    if (!target.isActive) {
      setError('This habit is already completed.');
      return;
    }

    try {
      const today = new Date().toISOString().slice(0, 10);

      // API usually returns { habit, streak, pet }
      const resp = await api.checkInHabit(habitId, today);
      const updatedHabit: Habit = (resp as any).habit ?? resp;

      // update local state so sections move between active/completed
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? updatedHabit : h)),
      );

      setSuccess('Check-in recorded!');
    } catch (err: any) {
      setError(err.message ?? 'Failed to check in.');
    }
  }

  async function handleDelete(habitId: string) {
    if (!confirm('Delete this habit?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.deleteHabit(habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      setSuccess('Habit deleted.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete habit.');
    }
  }

  // 🔹 split habits into active vs completed
  const activeHabits = habits.filter((h) => h.isActive);
  const completedHabits = habits.filter((h) => !h.isActive);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Habits</h1>

      {/* Create form */}
      <form
        onSubmit={handleCreateHabit}
        className="rounded-xl border bg-white text-slate-900 p-4 space-y-3"
      >
        <h2 className="font-semibold text-sm">Create a new habit</h2>

        <div className="flex flex-col gap-2 text-sm">
          <label className="flex flex-col gap-1">
            <span>Name</span>
            <input
              className="border rounded-md px-2 py-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Study, Workout, Drink Water..."
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Description (optional)</span>
            <input
              className="border rounded-md px-2 py-1 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of the habit"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span>Frequency</span>
              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={frequency}
                onChange={(e) =>
                  setFrequency(
                    e.target.value as 'daily' | 'weekly' | 'monthly',
                  )
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Difficulty</span>
              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(
                    e.target.value as (typeof DIFFICULTY_OPTIONS)[number],
                  )
                }
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-sm px-3 py-1.5 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Creating...' : 'Create habit'}
        </button>

        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        {success && <p className="text-xs text-emerald-600 mt-1">{success}</p>}
      </form>

      {/* Lists */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm">Your habits</h2>

        {/* Active section */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-slate-500 uppercase">
            Active
          </h3>
          <HabitList
            habits={activeHabits}
            onCheckIn={handleCheckIn}
            onDelete={handleDelete}
            // ✅ keep your existing View support in HabitList, don’t remove it there
          />
        </div>

        {/* Completed section */}
        {completedHabits.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-slate-500 uppercase">
              Completed
            </h3>
            <HabitList
              habits={completedHabits}
              onCheckIn={handleCheckIn} // safe; handleCheckIn blocks completed
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}

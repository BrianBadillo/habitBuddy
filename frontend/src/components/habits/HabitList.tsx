'use client';

import { Habit } from '@/types/api';
import { useRouter } from 'next/navigation';

interface Props {
  habits: Habit[];
  onCheckIn?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
}

export function HabitList({ habits, onCheckIn, onDelete }: Props) {
  const router = useRouter();

  if (!habits.length) {
    return (
      <p className="text-sm text-slate-600">
        No habits yet.
      </p>
    );
  }

  function handleConfirmCheckIn(habitId: string) {
    const ok = window.confirm('Mark this habit as completed for today?');
    if (!ok) return;
    if (onCheckIn) onCheckIn(habitId);
  }

  function handleConfirmDelete(habitId: string) {
    const ok = window.confirm('Delete this habit? This cannot be undone.');
    if (!ok) return;
    if (onDelete) onDelete(habitId);
  }

  return (
    <ul className="space-y-2">
      {habits.map((h) => (
        <li
          key={h.id}
          className="rounded-lg border bg-white text-slate-900 px-3 py-2 flex items-center justify-between"
        >
          <div>
            <div className="font-medium">{h.name}</div>
            {h.description && (
              <div className="text-xs text-slate-600">{h.description}</div>
            )}
            <div className="text-[11px] text-slate-500 mt-1">
              {h.frequency.toUpperCase()} · Difficulty: {h.difficulty}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* hide if habit is not active */}
            {onCheckIn && h.isActive && (
              <button
                className="text-xs px-2 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                onClick={() => handleConfirmCheckIn(h.id)}
              >
                Check in
              </button>
            )}

            <button
              className="text-xs px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
              onClick={() => router.push(`/habits/${h.id}`)}
            >
              View
            </button>

            {onDelete && (
              <button
                className="text-xs px-2 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors"
                onClick={() => handleConfirmDelete(h.id)}
              >
                Delete
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

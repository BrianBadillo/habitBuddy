import Link from 'next/link';
import { Habit } from '@/types/api';

interface Props {
  habits: Habit[];
  onCheckIn?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
}

export function HabitList({ habits, onCheckIn, onDelete }: Props) {
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
          className="rounded-lg border bg-white px-3 py-2 flex items-center justify-between"
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
            {onCheckIn && (
              <button
                className="text-xs px-2 py-1 rounded-md bg-emerald-600 text-white"
                onClick={() => handleConfirmCheckIn(h.id)}
              >
                Check in
              </button>
            )}

            <Link
              href={`/habits/${h.id}`}
              className="text-xs px-2 py-1 rounded-md bg-indigo-600 text-white"
            >
              View
            </Link>

            {onDelete && (
              <button
                className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-700"
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

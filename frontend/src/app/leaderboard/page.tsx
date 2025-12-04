// src/app/leaderboard/page.tsx

import { api } from '@/lib/apiClient';
import {
  LeaderboardXpEntry,
  LeaderboardStreakEntry,
} from '@/types/api';

export default async function LeaderboardPage() {
  let xpLeaderboard: LeaderboardXpEntry[] = [];
  let streakLeaderboard: LeaderboardStreakEntry[] = [];

  try {
    // XP: friends scope
    xpLeaderboard = await api.getXpLeaderboard('friends');
  } catch (e) {
    // leave empty if backend not ready / call fails
    xpLeaderboard = [];
  }

  try {
    // Streaks: global scope
    streakLeaderboard = await api.getStreakLeaderboard('global');
  } catch (e) {
    streakLeaderboard = [];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Leaderboard</h1>

      <section className="space-y-2">
        <h2 className="font-semibold text-lg">XP (Friends)</h2>
        {xpLeaderboard.length === 0 ? (
          <p className="text-sm text-slate-600">
            No XP leaderboard data yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {xpLeaderboard.map((entry) => (
              <li
                key={entry.rank}
                className="rounded-lg border bg-white text-slate-900 px-3 py-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-semibold">
                    #{entry.rank}
                  </span>
                  <div>
                    <div className="font-medium">
                      {entry.user.displayName || entry.user.username}
                    </div>
                    <div className="text-xs text-slate-500">
                      @{entry.user.username}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-right text-slate-600">
                  <div>{entry.pet.name}</div>
                  <div>
                    Level {entry.pet.level} · XP {entry.pet.xp}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-lg">Streaks (Global)</h2>
        {streakLeaderboard.length === 0 ? (
          <p className="text-sm text-slate-600">
            No streak leaderboard data yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {streakLeaderboard.map((entry) => (
              <li
                key={entry.rank}
                className="rounded-lg border bg-white text-slate-900 px-3 py-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-semibold">
                    #{entry.rank}
                  </span>
                  <div>
                    <div className="font-medium">
                      {entry.user.displayName || entry.user.username}
                    </div>
                    <div className="text-xs text-slate-500">
                      @{entry.user.username}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-right text-slate-600">
                  Best streak: {entry.bestStreak} days
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

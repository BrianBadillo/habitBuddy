// src/app/habits/[habitId]/page.tsx

import { api } from '@/lib/apiClient';
import { notFound } from 'next/navigation';
import { HabitDetailClient } from './HabitDetailClient';
import { HabitCompletion, HabitWithStreak, Streak } from '@/types/api';

type HabitParams = {
  habitId: string;
};

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<HabitParams>;
}) {
  // ⬅️ The important part: await params
  const { habitId } = await params;

  if (!habitId) {
    notFound();
  }

  let habitWithStreak: HabitWithStreak;
  let history: HabitCompletion[] = [];
  let streak: Streak | null = null;

  try {
    habitWithStreak = await api.getHabit(habitId);
  } catch {
    notFound();
  }

  try {
    history = await api.getHabitHistory(habitId);
  } catch {
    history = [];
  }

  streak = habitWithStreak.streak ?? null;

  return (
    <HabitDetailClient
      habit={habitWithStreak.habit}
      streak={streak}
      history={history}
    />
  );
}

// src/app/habits/page.tsx

import { api } from '@/lib/apiClient';
import { HabitsClient } from './HabitsClient';

export default async function HabitsPage() {
  const habits = await api.getHabits(); // no ACCESS_TOKEN param now

  return <HabitsClient initialHabits={habits} />;
}

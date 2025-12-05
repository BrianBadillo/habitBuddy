// src/app/habits/page.tsx

import { api } from '@/lib/apiClient';
import { HabitsClient } from './HabitsClient';

export default async function HabitsPage() {
  const habits = await api.getHabits(); 

  return <HabitsClient initialHabits={habits} />;
}

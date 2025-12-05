// src/lib/apiClient.ts

import {
  MeResponse,
  MeSummary,
  Habit,
  HabitWithStreak,
  HabitCompletion,
  QuoteResponse,
  Pet,
  Streak,
  FriendEntry,
  FriendSummary,
  LeaderboardXpEntry,
  LeaderboardStreakEntry,
  Frequency,
  User,
  PetType,
  AdminMetrics,
  AdminUserSummary,
  AdminStage,
  Role,
} from '@/types/api';

type Difficulty = 'Trivial' | 'Easy' | 'Medium' | 'Hard';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3001';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  console.log('apiFetch ->', url);

  // Automatically forward cookies when running on the server
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  // If we're on the server (not in browser), forward the session cookie
  if (typeof window === 'undefined') {
    try {
      // Dynamically import cookies only on the server
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('session')?.value;
      if (sessionToken) {
        headers['Cookie'] = `session=${sessionToken}`;
      }
    } catch (e) {
      // cookies() might not be available in some contexts, that's okay
      console.warn('Could not access cookies:', e);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
    credentials: 'include'
  });

  if (!res.ok) {
    const text = await res.text();
    
    // Handle 401 Unauthorized - redirect to auth page
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        // Client-side: only redirect if not already on auth page
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth';
        }
      } else {
        // Server-side: only redirect if not already on auth page
        const { headers } = await import('next/headers');
        const headersList = await headers();
        const pathname = headersList.get('x-pathname') || '';
        
        if (!pathname.startsWith('/auth')) {
          const { redirect } = await import('next/navigation');
          redirect('/auth');
        }
      }
    }
    
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }

  return res.json();
}

export const api = {
  // -------- Auth --------

  authSignup(data: {
    email: string;
    password: string;
    username: string;
    displayName?: string;
  }) {
    return apiFetch<{ user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  authLogin(data: { email: string; password: string }) {
    return apiFetch<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  authLogout() {
    return apiFetch<{ ok: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
  },

  // -------- Profile / User --------

  getMe() {
    return apiFetch<MeResponse>('/api/me');
  },

  updateMe(data: Partial<{ username: string; displayName: string }>) {
    return apiFetch('/api/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getMeSummary() {
    return apiFetch<MeSummary>('/api/me/summary');
  },

  // -------- Habits --------

  getHabits(active?: boolean) {
    const qs = active !== undefined ? `?active=${active}` : '';
    return apiFetch<Habit[]>(`/api/habits${qs}`);
  },

  getHabit(habitId: string) {
    return apiFetch<HabitWithStreak>(`/api/habits/${habitId}`);
  },

  getHabitHistory(habitId: string, from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<HabitCompletion[]>(
      `/api/habits/${habitId}/history${qs}`
    );
  },

  getHabitStreak(habitId: string) {
    return apiFetch<Streak>(`/api/habits/${habitId}/streak`);
  },

  createHabit(data: {
    name: string;
    description?: string;
    frequency: Frequency;    // 'daily' | 'weekly' | 'monthly'
    difficulty?: Difficulty; // 'Trivial' | 'Easy' | 'Medium' | 'Hard'
    isActive?: boolean;
  }) {
    return apiFetch<Habit>('/api/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateHabit(
    habitId: string,
    data: Partial<{
      name: string;
      description: string;
      frequency: Frequency;
      isActive: boolean;
      difficulty: Difficulty;
    }>
  ) {
    return apiFetch<Habit>(`/api/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteHabit(habitId: string) {
    return apiFetch<void>(`/api/habits/${habitId}`, {
      method: 'DELETE',
    });
  },

  checkInHabit(habitId: string, completedDate: string) {
    return apiFetch<{ habit: Habit; streak: Streak; pet: Pet }>(
      `/api/habits/${habitId}/check-in`,
      {
        method: 'POST',
        body: JSON.stringify({ completedDate }),
      }
    );
  },

  undoHabitCompletion(habitId: string, completionId: number) {
    return apiFetch<{ habit: Habit; streak: Streak; pet: Pet }>(
      `/api/habits/${habitId}/check-in/${completionId}`,
      {
        method: 'DELETE',
      }
    );
  },

  // -------- Pet --------

  getPetTypes() {
    return apiFetch<PetType[]>('/api/pet/types');
  },

  getPet() {
    return apiFetch<Pet>('/api/pet');
  },

  createPet(data: { petTypeId: number; name: string; replaceExisting?: boolean }) {
    return apiFetch<Pet>('/api/pet', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePet(
    data: Partial<{
      name: string;
    }>
  ) {
    return apiFetch<Pet>('/api/pet', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  pingPet(interactionType: string) {
    return apiFetch<Pet>('/api/pet/ping', {
      method: 'POST',
      body: JSON.stringify({ interactionType }),
    });
  },

  // -------- Friends / Social --------

  getFriends() {
    return apiFetch<FriendEntry[]>('/api/friends');
  },

  getFriendSummary(friendId: string) {
    return apiFetch<FriendSummary>(`/api/friends/${friendId}/summary`);
  },

  // -------- Leaderboards --------

  getXpLeaderboard(scope: 'friends' | 'global' = 'friends') {
    return apiFetch<LeaderboardXpEntry[]>(
      `/api/leaderboard/xp?scope=${scope}`
    );
  },

  getStreakLeaderboard(scope: 'friends' | 'global' = 'global') {
    return apiFetch<LeaderboardStreakEntry[]>(
      `/api/leaderboard/streaks?scope=${scope}`
    );
  },

  // -------- Quote --------

  getDailyQuote() {
    return apiFetch<QuoteResponse>('/api/quote');
  },

  // -------- Admin --------

  adminCheck() {
    return apiFetch<{ ok: boolean }>('/api/admin');
  },

  adminGetMetrics() {
    return apiFetch<AdminMetrics>('/api/admin/metrics/overview');
  },

  adminGetPetTypes() {
    return apiFetch<PetType[]>('/api/admin/pet-types');
  },

  adminGetPetTypeDetail(petTypeId: number) {
    return apiFetch<{ petType: PetType; stages: AdminStage[] }>(
      `/api/admin/pet-types/${petTypeId}`
    );
  },

  adminCreatePetType(data: {
    name: string;
    description: string;
    baseSpriteUrl: string;
  }) {
    return apiFetch<PetType>('/api/admin/pet-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  adminUpdatePetType(
    petTypeId: number,
    data: Partial<{ name: string; description: string; baseSpriteUrl: string }>
  ) {
    return apiFetch<PetType>(`/api/admin/pet-types/${petTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  adminDeletePetType(petTypeId: number) {
    return apiFetch<void>(`/api/admin/pet-types/${petTypeId}`, {
      method: 'DELETE',
    });
  },

  adminCreateStage(
    petTypeId: number,
    data: {
      stageNumber: number;
      name: string;
      spriteUrl: string;
      description?: string;
    }
  ) {
    return apiFetch<AdminStage>(`/api/admin/pet-types/${petTypeId}/stages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  adminListUsers() {
    return apiFetch<AdminUserSummary[]>('/api/admin/users');
  },

  adminUpdateUserRole(userId: string, role: Role) {
    return apiFetch<AdminUserSummary>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};

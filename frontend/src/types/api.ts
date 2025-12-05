// src/types/api.ts

export type Role = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  displayName?: string | null;
  role: Role;
  createdAt: string;
}

export type Mood = 'happy' | 'sad' | 'stagnant';

export interface PetType {
  id: number;
  name: string;
  description?: string | null;
  baseSpriteUrl?: string | null;
}

export interface EvolutionStage {
  id: number;
  petTypeId: number;
  stageNumber: number;
  name: string;
  minLevel: number;
  spriteUrl?: string | null;
  description?: string | null;
}

export interface Pet {
  id: string;
  userId?: string;
  petType: PetType;
  name: string;
  xp: number;
  level: number;
  mood: Mood;
  currentStage?: EvolutionStage | null;
  lastInteractionDate?: string | null;
  createdAt?: string;
}

export interface MeResponse {
  user: User;
  pet?: Pet | null;
}

export interface MeSummary {
  totalHabits: number;
  activeHabits: number;
  totalCompletions: number;
  bestStreak: number;
  currentLevel: number;
}

export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  userId?: string;
  name: string;
  description?: string | null;
  frequency: Frequency;
  isActive: boolean;
  difficulty?: string;
  createdAt: string;
}

export interface Streak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string | null;
}

export interface HabitWithStreak {
  habit: Habit;
  streak?: Streak;
}

export interface HabitCompletion {
  completionId: number;
  completedDate: string; // yyyy-mm-dd
  completedCount: number;
}

export interface FriendProfile {
  id: string;
  username: string;
  displayName?: string | null;
}

export interface FriendEntry {
  id: number;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  friend: FriendProfile;
}

export interface FriendSummary {
  friend: FriendProfile;
  pet?: Pet | null;
  totalHabits: number;
  bestStreak: number;
}

export interface LeaderboardXpEntry {
  rank: number;
  user: FriendProfile;
  pet: {
    name: string;
    level: number;
    xp: number;
  };
}

export interface LeaderboardStreakEntry {
  rank: number;
  user: FriendProfile;
  longest_streak: number;
}

export interface QuoteResponse {
  text: string;
  author: string;
}

export interface FriendProfile {
  id: string;
  username: string;
  displayName?: string | null;
}

export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export interface FriendEntry {
  id: number;
  requesterId: string;
  addresseeId: string;
  status: FriendStatus;
  createdAt: string;
  friend: FriendProfile;
}

export interface FriendSummary {
  friend: FriendProfile;
  pet?: Pet | null;
  totalHabits: number;
  bestStreak: number;
}

export interface LeaderboardXpEntry {
  rank: number;
  user: FriendProfile;
  pet: {
    name: string;
    level: number;
    xp: number;
  };
}

export interface LeaderboardStreakEntry {
  rank: number;
  user: FriendProfile;
  bestStreak: number;
}

// Admin
export interface AdminMetrics {
  totalUsers: number;
  totalHabits: number;
  totalCompletions: number;
  activeUsers: number;
}

export interface AdminUserSummary {
  id: string;
  username: string;
  displayName?: string | null;
  role: Role;
  createdAt: string;
}

export interface AdminStage {
  id: number;
  petTypeId: number;
  stageNumber: number;
  name: string;
  spriteUrl?: string | null;
  description?: string | null;
}
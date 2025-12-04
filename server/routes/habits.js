import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { requireAuth } from '../middleware/auth.js'
import { TABLES } from '../db/tables.js'
import { FREQUENCY, DIFFICULTY, PET_MOOD_UP, PET_LEVELS, XP_MAP } from '../constants.js'

// Create a router for habit-related routes
const router = Router()

// GET /api/habits - Get all habits for the authenticated user
/*
Example response:
[
  {
    "id": "7f664e4a-64b6-42bb-bf51-91f44e6c1111",
    "name": "Study",
    "description": "1 hour of CS",
    "frequency": "daily",
    "isActive": true,
    "difficulty": "Medium",
    "createdAt": "2025-11-20T14:00:00.000Z"
  },
  {
    "id": "f3423d1b-fdcc-4c35-930b-8f1d9d5d2222",
    "name": "Workout",
    "description": "Gym 3x/week",
    "frequency": "weekly",
    "isActive": true,
    "difficulty": "Hard",
    "createdAt": "2025-11-21T16:30:00.000Z"
  }
]*/
router.get('/', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { active } = req.query;

    let query = supabase
        .from(TABLES.HABITS)
        .select('id, name, description, frequency, is_active, difficulty, created_at')
        .eq('user_id', userId);

    // Filter by active status if query parameter is provided
    if (active !== undefined) {
        const isActive = active === 'true';
        query = query.eq('is_active', isActive);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Map database fields to API response format
    const habits = data.map(habit => ({
        id: habit.id,
        name: habit.name,
        description: habit.description,
        frequency: habit.frequency,
        isActive: habit.is_active,
        difficulty: habit.difficulty,
        createdAt: habit.created_at
    }));

    res.json(habits);
});

// GET /api/habits/:habitId - Get a specific habit by ID
/*
Example response:
{
  "habit": {
    "id": "7f664e4a-64b6-42bb-bf51-91f44e6c1111",
    "name": "Study",
    "description": "1 hour of CS",
    "frequency": "daily",
    "isActive": true,
    "difficulty": "Medium",
    "createdAt": "2025-11-20T14:00:00.000Z"
  },
  "streak": {
    "habitId": "7f664e4a-64b6-42bb-bf51-91f44e6c1111",
    "currentStreak": 5,
    "longestStreak": 12,
    "lastCompletedDate": "2025-11-26"
  }
}*/
router.get('/:habitId', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { habitId } = req.params;

    // Fetch the habit
    const { data: habitData, error: habitError } = await supabase
        .from(TABLES.HABITS)
        .select('id, name, description, frequency, is_active, difficulty, created_at')
        .eq('id', habitId)
        .eq('user_id', userId)
        .single();
    if (habitError || !habitData) {
        return res.status(404).json({ error: 'Habit not found' });
    }

    // Fetch the streak for the habit
    const { data: streakData, error: streakError } = await supabase
        .from(TABLES.STREAKS)
        .select('habit_id, current_streak, longest_streak, last_completed_date')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .single(); // Zeroed out streak is created when habit is created
    if (streakError) {
        return res.status(500).json({ error: streakError.message });
    }

    // Format the response
    const habit = {
        id: habitData.id,
        name: habitData.name,
        description: habitData.description,
        frequency: habitData.frequency,
        isActive: habitData.is_active,
        difficulty: habitData.difficulty,
        createdAt: habitData.created_at
    };

    const streak = streakData ? {
        habitId: streakData.habit_id,
        currentStreak: streakData.current_streak,
        longestStreak: streakData.longest_streak,
        lastCompletedDate: streakData.last_completed_date
    } : null;

    res.json({ habit, streak });
});
    
// POST /api/habits - Create a new habit
/* Example request:
{
  "name": "Drink Water",
  "description": "8 cups a day",
  "frequency": "daily",
  "difficulty": "Easy",
}

Example response:
{
  "id": "a2b0f7b0-5c49-4d9c-8741-1d2c744e3333",
  "name": "Drink Water",
  "description": "8 cups a day",
  "frequency": "daily",
  "isActive": true,
  "difficulty": "Easy",
  "createdAt": "2025-11-27T04:05:00.000Z"
}*/
router.post('/', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { name, description, frequency, difficulty } = req.body;

    // Validate input
    if (!name || !frequency || !difficulty) {
        return res.status(400).json({ error: 'Name, frequency, and difficulty are required' });
    }
    if (!Object.values(FREQUENCY).includes(frequency)) {
        return res.status(400).json({ error: 'Invalid frequency value' });
    }
    if (!Object.values(DIFFICULTY).includes(difficulty)) {
        return res.status(400).json({ error: 'Invalid difficulty value' });
    }

    // Create the habit
    const { data, error } = await supabase
        .from(TABLES.HABITS)
        .insert({
            user_id: userId,
            name,
            description: description || '',
            is_active: true,
            difficulty,
            frequency
        })
        .select('id, name, description, frequency, is_active, difficulty, created_at')
        .single();
    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Create initial streak entry with zeroed values
    await supabase
        .from(TABLES.STREAKS)
        .insert({
            user_id: userId,
            habit_id: data.id,
            current_streak: 0,
            longest_streak: 0,
            last_completed_date: null
        });
    
    // Format the response
    const habit = {
        id: data.id,
        name: data.name,
        description: data.description,
        frequency: data.frequency,
        isActive: data.is_active,
        difficulty: data.difficulty,
        createdAt: data.created_at
    };

    res.status(201).json(habit);
});

// PUT /api/habits/:habitId - Update an existing habit
/* Example request:
{
  "name": "Drink Water",
  "description": "8 cups per day",
  "frequency": "daily",
  "isActive": true,
  "difficulty": "Trivial"
}

Example response:
{
  "id": "a2b0f7b0-5c49-4d9c-8741-1d2c744e3333",
  "name": "Drink Water",
  "description": "8 cups per day",
  "frequency": "daily",
  "isActive": true,
  "difficulty": "Trivial",
  "createdAt": "2025-11-27T04:05:00.000Z"
}*/
router.put('/:habitId', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { habitId } = req.params;
    const { name, description, frequency, isActive, difficulty } = req.body;

    // Build the update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (frequency !== undefined) {
        if (!Object.values(FREQUENCY).includes(frequency)) {
            return res.status(400).json({ error: 'Invalid frequency value' });
        }
        updateData.frequency = frequency;
    }
    if (isActive !== undefined) updateData.is_active = isActive;
    if (difficulty !== undefined) {
        if (!Object.values(DIFFICULTY).includes(difficulty)) {
            return res.status(400).json({ error: 'Invalid difficulty value' });
        }
        updateData.difficulty = difficulty;
    }

    // Update the habit
    const { data: habitData, error: habitError } = await supabase
        .from(TABLES.HABITS)
        .update(updateData)
        .eq('id', habitId)
        .eq('user_id', userId)
        .select('id, name, description, frequency, is_active, difficulty, created_at')
        .single();
    if (habitError || !habitData) {
        return res.status(400).json({ error: 'Habit not found or update failed' });
    }

    // Format the response
    const habit = {
        id: habitData.id,
        name: habitData.name,
        description: habitData.description,
        frequency: habitData.frequency,
        isActive: habitData.is_active,
        difficulty: habitData.difficulty,
        createdAt: habitData.created_at
    };

    res.json(habit);
});

// DELETE /api/habits/:habitId - Delete a habit
/* Example response:
{
  "ok": true
}*/
router.delete('/:habitId', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { habitId } = req.params;

    // Delete the habit (cascading deletes completions and streaks)
    const { error } = await supabase
        .from(TABLES.HABITS)
        .delete()
        .eq('id', habitId)
        .eq('user_id', userId);
    if (error) {
        return res.status(400).json({ error: 'Failed to delete habit' });
    }

    res.json({ ok: true });
});

// POST /api/habits/:habitId/check-in - Mark a habit as completed and update streak + pet status.
/* Example request:
{
  "completedDate": "2025-11-27"
}

Example response:
{
  "habit": {
    "id": "7f664e4a-64b6-42bb-bf51-91f44e6c1111",
    "name": "Study",
    "frequency": "daily",
    "isActive": true,
    "difficulty": "Hard"
  },
  "streak": {
    "habitId": "7f664e4a-64b6-42bb-bf51-91f44e6c1111",
    "currentStreak": 6,
    "longestStreak": 12,
    "lastCompletedDate": "2025-11-27"
  },
  "pet": {
    "id": "e5b5a3b4-9e72-4ab3-9c8e-7dd1e4a9d111",
    "name": "Mocha",
    "level": 3,
    "xp": 280,
    "mood": "happy"
  }
}*/
router.post('/:habitId/check-in', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { habitId } = req.params;
    const { completedDate } = req.body; // expected in 'YYYY-MM-DD' format

    // Validate completedDate
    if (!completedDate || isNaN(Date.parse(completedDate))) {
        return res.status(400).json({ error: 'Invalid or missing completedDate' });
    }

    // Fetch habit
    const { data: habitData, error: habitError } = await supabase
        .from(TABLES.HABITS)
        .select('id, name, frequency, is_active, difficulty, created_at')
        .eq('id', habitId)
        .eq('user_id', userId)
        .single();
    if (habitError || !habitData) {
        return res.status(404).json({ error: 'Habit not found' });
    }

    // Check if habit is already inactive (completed)
    if (!habitData.is_active) {
        return res.status(400).json({ error: 'Habit already completed' });
    }

    // Overwrite completion on the same day (ensure only one record per day)
    const { data: existingCompletion, error: findCompletionError } = await supabase
        .from(TABLES.HABIT_COMPLETIONS)
        .select('id')
        .eq('user_id', userId)
        .eq('habit_id', habitId)
        .eq('completed_date', completedDate)
        .maybeSingle();

    if (findCompletionError) {
        return res.status(500).json({ error: 'Failed to check existing completion' });
    }
    if (existingCompletion) { // If a completion already exists for that date then remove it
        const { error: deleteError } = await supabase
            .from(TABLES.HABIT_COMPLETIONS)
            .delete()
            .eq('id', existingCompletion.id);
        if (deleteError) {
            return res.status(500).json({ error: 'Failed to overwrite existing completion' });
        }
    }

    // Create new completion entry
    const { data: newCompletion, error: insertError } = await supabase
        .from(TABLES.HABIT_COMPLETIONS)
        .insert({
            user_id: userId,
            habit_id: habitId,
            completed_date: completedDate
        })
        .select('id')
        .single();
    
    if (insertError || !newCompletion) {
        return res.status(500).json({ error: 'Failed to record completion' });
    }

    // Set habit to inactive after check-in
    const { error: habitUpdateError } = await supabase
        .from(TABLES.HABITS)
        .update({ is_active: false })
        .eq('id', habitId)
        .eq('user_id', userId);
    
    if (habitUpdateError) {
        return res.status(500).json({ error: 'Failed to update habit status' });
    }

    // Update streak
    const { data: streakData, error: streakError } = await supabase
        .from(TABLES.STREAKS)
        .select('habit_id, current_streak, longest_streak, last_completed_date')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .single();
    if (streakError || !streakData) {
        return res.status(500).json({ error: 'Failed to fetch streak data' });
    }

    let newCurrentStreak = streakData.current_streak;
    let newLongestStreak = streakData.longest_streak;
    
    const lastDate = streakData.last_completed_date ? new Date(streakData.last_completed_date) : null;
    const completedDt = new Date(completedDate);

    // Helpers for date difference
    function startOfWeekUTC(date) {
        const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        const day = d.getUTCDay(); // 0 (Sun) to 6 (Sat)
        const diff = (day === 0 ? -6 : 1 - day); // move to Monday
        d.setUTCDate(d.getUTCDate() + diff);
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }
    function monthsDiffUTC(a, b) {
        // a - b in whole months
        return (a.getUTCFullYear() - b.getUTCFullYear()) * 12 + (a.getUTCMonth() - b.getUTCMonth());
    }

    if (!lastDate) {
        // First ever completion
        newCurrentStreak = 1;
    } else {
        if (habitData.frequency === FREQUENCY.DAILY) {
            const oneDay = 24 * 60 * 60 * 1000;
            const diffDays = Math.floor((completedDt - lastDate) / oneDay);
            if (diffDays === 1) {
                newCurrentStreak += 1; // next day
            } else if (diffDays > 1) {
                newCurrentStreak = 1; // missed one or more days
            }
        } else if (habitData.frequency === FREQUENCY.WEEKLY) {
            const lastWeek = startOfWeekUTC(lastDate);
            const thisWeek = startOfWeekUTC(completedDt);
            const weekDiff = Math.round((thisWeek - lastWeek) / (7 * 24 * 60 * 60 * 1000));
            if (weekDiff === 1) {
                newCurrentStreak += 1; // consecutive week
            } else if (weekDiff > 1) {
                newCurrentStreak = 1; // missed one or more full weeks
            }
        } else if (habitData.frequency === FREQUENCY.MONTHLY) {
            const mDiff = monthsDiffUTC(completedDt, lastDate);
            if (mDiff === 1) {
                newCurrentStreak += 1; // consecutive month
            } else if (mDiff > 1) {
                newCurrentStreak = 1; // missed one or more full months
            }
        } else {
            console.log('--- Unknown frequency type for habit:', habitData.frequency);
        }
    }

    if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
    }

    // Update streak in DB
    const { data: updatedStreak, error: updateStreakError } = await supabase
        .from(TABLES.STREAKS)
        .update({
            current_streak: newCurrentStreak,
            longest_streak: newLongestStreak,
            last_completed_date: completedDate
        })
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .select('habit_id, current_streak, longest_streak, last_completed_date')
        .single();
    if (updateStreakError || !updatedStreak) {
        return res.status(500).json({ error: 'Failed to update streak data' });
    }

    // Calculate XP based on difficulty
    const xpGained = XP_MAP[habitData.difficulty] || 10;

    // Fetch user's pet
    const { data: petData, error: petError } = await supabase
        .from(TABLES.PETS)
        .select('id, name, level, xp, mood, current_stage_id, pet_type_id')
        .eq('user_id', userId)
        .single();
    if (petError || !petData) {
        return res.status(500).json({ error: 'Failed to fetch pet data' });
    }

    // Update pet XP and mood
    let newXp = petData.xp + xpGained;
    let newLevel = petData.level;
    // Check for level up
    while (newLevel < Object.keys(PET_LEVELS).length && newXp >= PET_LEVELS[newLevel + 1]) {
        newLevel += 1; // level up
        // Increment the pet's current stage (same pet_type, and stage_number = newLevel):
        // Get the new stage ID (if next stage up doesn't exist, stay at current stage)
        const { data: nextStageData, error: nextStageError } = await supabase
            .from(TABLES.EVOLUTION_STAGES)
            .select('id')
            .eq('pet_type_id', petData.pet_type_id)
            .eq('stage_number', newLevel)
            .single();
        if (!nextStageError && nextStageData) {
            // Update pet's current stage ID
            const { error: updateStageError } = await supabase
                .from(TABLES.PETS)
                .update({ current_stage_id: nextStageData.id })
                .eq('id', petData.id);
            if (updateStageError) {
                return res.status(500).json({ error: 'Failed to update pet stage on level up' });
            }
        }
    }
    // Update mood positively
    const newMood = PET_MOOD_UP[petData.mood] || petData.mood;

    // Update pet in DB
    const { data: updatedPet, error: updatePetError } = await supabase
        .from(TABLES.PETS)
        .update({
            level: newLevel,
            xp: newXp,
            mood: newMood
        })
        .eq('id', petData.id)
        .select('id, name, level, xp, mood')
        .single();
    if (updatePetError || !updatedPet) {
        return res.status(500).json({ error: 'Failed to update pet data' });
    }

    // Format response
    const habit = {
        id: habitData.id,
        name: habitData.name,
        frequency: habitData.frequency,
        isActive: false,
        difficulty: habitData.difficulty
    };

    const streak = {
        habitId: updatedStreak.habit_id,
        currentStreak: updatedStreak.current_streak,
        longestStreak: updatedStreak.longest_streak,
        lastCompletedDate: updatedStreak.last_completed_date
    };

    const pet = {
        id: updatedPet.id,
        name: updatedPet.name,
        level: updatedPet.level,
        xp: updatedPet.xp,
        mood: updatedPet.mood
    };
    
    res.json({ habit, streak, pet });
});

// GET /api/habits/:habitId/history - Get completion history for a habit over a date range.
/* Example request:
GET /api/habits/7f664e4a-64b6-42bb-bf51-91f44e6c1111/history?from=2025-11-20&to=2025-11-27 HTTP/1.1

Example response:
[
  { "completionId": 15, "completedDate": "2025-11-22" },
  { "completionId": 16, "completedDate": "2025-11-23" },
  { "completionId": 17, "completedDate": "2025-11-24" },
  { "completionId": 18, "completedDate": "2025-11-25" },
  { "completionId": 19, "completedDate": "2025-11-26" },
  { "completionId": 20, "completedDate": "2025-11-27" }
]*/
router.get('/:habitId/history', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { habitId } = req.params;
    const { from, to } = req.query;

    // Validate date range
    if (!from || !to || isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
        return res.status(400).json({ error: 'Invalid or missing from/to date parameters' });
    }

    // Fetch completion history
    const { data, error } = await supabase
        .from(TABLES.HABIT_COMPLETIONS)
        .select('id, completed_date')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .gte('completed_date', from)
        .lte('completed_date', to)
        .order('completed_date', { ascending: true });
    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Format response
    const history = data.map(entry => ({
        completionId: entry.id,
        completedDate: entry.completed_date
    }));

    res.json(history);
});

// GET /api/habits/:habitId/streak - Get the current streak for a specific habit
/* Example response:
{
  "habitId": "7f664e4a-64b6-42bb-bf51-91f44e6c1111",
  "currentStreak": 6,
  "longestStreak": 12,
  "lastCompletedDate": "2025-11-27"
}*/
router.get('/:habitId/streak', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { habitId } = req.params;

    // Fetch the streak for the habit
    const { data: streakData, error: streakError } = await supabase
        .from(TABLES.STREAKS)
        .select('habit_id, current_streak, longest_streak, last_completed_date')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .single();
    if (streakError || !streakData) {
        return res.status(404).json({ error: 'Streak not found' });
    }

    // Format the response
    const streak = {
        habitId: streakData.habit_id,
        currentStreak: streakData.current_streak,
        longestStreak: streakData.longest_streak,
        lastCompletedDate: streakData.last_completed_date
    };

    res.json(streak);
});

// GET /api/me/streaks - Get all streaks for the authenticated user
/* Example response:
[
  {
    "habitId": "7f664e4a-64b6-42bb-bf51-91f44e6c1111",
    "currentStreak": 6,
    "longestStreak": 12,
    "lastCompletedDate": "2025-11-27"
  },
  {
    "habitId": "f3423d1b-fdcc-4c35-930b-8f1d9d5d2222",
    "currentStreak": 2,
    "longestStreak": 5,
    "lastCompletedDate": "2025-11-25"
  }
]*/
router.get('/me/streaks', requireAuth, async (req, res) => {
    const userId = req.user.id;

    // Fetch all streaks for the user
    const { data, error } = await supabase
        .from(TABLES.STREAKS)
        .select('habit_id, current_streak, longest_streak, last_completed_date')
        .eq('user_id', userId)
        .order('habit_id', { ascending: true });
    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Format the response
    const streaks = data.map(streak => ({
        habitId: streak.habit_id,
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        lastCompletedDate: streak.last_completed_date
    }));

    res.json(streaks);
});

export default router;
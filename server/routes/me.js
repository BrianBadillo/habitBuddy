import e, { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { requireAuth } from '../middleware/auth.js'
import { TABLES } from '../db/tables.js'

// Create a router for profile/user-related routes
const router = Router()

// Utility functions to map database fields to API response fields
function mapProfile(dbProfile) {
    return {
        id: dbProfile.id,
        username: dbProfile.username,
        displayName: dbProfile.display_name,
        role: dbProfile.role,
        createdAt: dbProfile.created_at
    }
}
function mapPet(dbPet) {
    return {
        id: dbPet.id,
        name: dbPet.name,
        level: dbPet.level,
        xp: dbPet.xp,
        mood: dbPet.mood,
        petType: {
            id: dbPet.petType.id,
            name: dbPet.petType.name,
            baseSpriteUrl: dbPet.petType.base_sprite_url
        },
        currentStage: {
            id: dbPet.currentStage.id,
            stageNumber: dbPet.currentStage.stage_number,
            name: dbPet.currentStage.name,
            spriteUrl: dbPet.currentStage.sprite_url
        }
    }
}

// GET /api/me - Get the authenticated user's profile
/* Example response:
{
  "user": {
    "id": "6a0c9ac4-5f4c-4f1f-9af0-3a3ddfbeb123",
    "username": "brian",
    "displayName": "Brian Badillo",
    "role": "user",
    "createdAt": "2025-11-27T03:10:00.000Z"
  },
  "pet": {
    "id": "e5b5a3b4-9e72-4ab3-9c8e-7dd1e4a9d111",
    "name": "Mocha",
    "level": 3,
    "xp": 260,
    "mood": "happy",
    "petType": { "id": 1, "name": "Cat", "baseSpriteUrl": "/sprites/cat-base.png" },
    "currentStage": { "id": 2, "stageNumber": 2, "name": "Teen Cat", "spriteUrl": "/sprites/cat-teen.png" }
  }
}*/
router.get('/me', requireAuth, async (req, res) => {
    const userId = req.user.id;

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .select('id, username, display_name, role, created_at')
        .eq('id', userId)
        .single();
        
    if (profileError || !profileData) {
        return res.status(404).json({ error: 'Profile not found' });
    }

    const { data: petData, error: petError } = await supabase
        .from(TABLES.PETS)
        .select(`id, name, level, xp, mood,
            petType:pet_type_id (id, name, base_sprite_url),
            currentStage:current_stage_id (id, stage_number, name, sprite_url)`)
        .eq('user_id', userId)
        .maybeSingle(); // maybeSingle in case user has no pet yet

    if (petError) {
        return res.status(500).json({ error: error.message || 'Error fetching pet data' });
    }

    res.json({
        user: mapProfile(profileData),
        pet: petData ? mapPet(petData) : null
    });
});

// PUT /api/me - Update the user’s profile info (username, displayName).
/* Example request:
{
  "username": "brianb",
  "displayName": "Brian B."
}

Example response:
{
  "id": "6a0c9ac4-5f4c-4f1f-9af0-3a3ddfbeb123",
  "username": "brianb",
  "displayName": "Brian B.",
  "role": "user",
  "createdAt": "2025-11-27T03:10:00.000Z"
}*/
router.put('/me', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { username, displayName } = req.body;

    // Basic validation
    if (!username && !displayName) {
        return res.status(400).json({ error: 'Nothing to update' })
    }

    // Update user profile
    const update = {};
    if (username) update.username = username;
    if (displayName) update.display_name = displayName;

    const { data: updatedProfile, error: updateError } = await supabase
        .from(TABLES.PROFILES)
        .update(update)
        .eq('id', userId)
        .select('id, username, display_name, role, created_at')
        .single();

    if (updateError || !updatedProfile) {
        return res.status(400).json({ error: 'Error updating profile' });
    }

    res.json(mapProfile(updatedProfile));
});

// GET /api/me/summary - Get overall stats like total habits, completions, and best streak.
/* Example response:
{
  "totalHabits": 5,
  "activeHabits": 4,
  "totalCompletions": 87,
  "bestStreak": 14,
  "currentLevel": 3
}*/
router.get('/me/summary', requireAuth, async (req, res) => {
    const userId = req.user.id;

    // Fetch total habits
    const { count: totalHabits } = await supabase
        .from(TABLES.HABITS)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
    
    // Fetch active habits
    const { count: activeHabits } = await supabase
        .from(TABLES.HABITS)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);
    
    // Fetch total completions (sum of completed_count)
    const { data: completionsData, error: completionsError } = await supabase
        .from(TABLES.HABIT_COMPLETIONS)
        .select('completed_count')
        .eq('user_id', userId);
    if (completionsError) {
        return res.status(500).json({ error: 'Error fetching completions data' });
    }
    const totalCompletions = completionsData // Sum up completed_count fields
        ? completionsData.reduce((sum, record) => sum + (record.completed_count || 0), 0)
        : 0;
    
    // Fetch best streak
    const { data: bestStreakData } = await supabase
        .from(TABLES.STREAKS)
        .select('longest_streak')
        .eq('user_id', userId)
        .order('longest_streak', { ascending: false })
        .limit(1)
        .single();
    
    // Fetch current level
    const { data: petData } = await supabase
        .from(TABLES.PETS)
        .select('level')
        .eq('user_id', userId)
        .single();

    res.json({
        totalHabits: totalHabits || 0,
        activeHabits: activeHabits || 0,
        totalCompletions: totalCompletions || 0,
        bestStreak: bestStreakData ? bestStreakData.longest_streak : 0,
        currentLevel: petData ? petData.level : null
    });
});

export default router;
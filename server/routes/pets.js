import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { requireAuth } from '../middleware/auth.js'
import { TABLES } from '../db/tables.js'
import { PET_MOOD, PET_MOOD_UP, PET_LEVELS } from '../constants.js'

// Create a router for pet-related routes
const router = Router()

// GET /api/pet - Get the full pet state for the logged-in user
/* Example response:
{
  "id": "e5b5a3b4-9e72-4ab3-9c8e-7dd1e4a9d111",
  "name": "Mocha",
  "xp": 280,
  "level": 3,
  "mood": "happy",
  "petType": { "id": 1, "name": "Cat", "baseSpriteUrl": "/sprites/cat-base.png" },
  "currentStage": { "id": 2, "stageNumber": 2, "name": "Teen Cat", "spriteUrl": "/sprites/cat-teen.png" },
  "lastInteractionDate": "2025-11-27"
}*/
router.get('/', requireAuth, async (req, res) => {
    const userId = req.user.id;

    // Fetch pet with related data
    const { data: petData, error: petError } = await supabase
        .from(TABLES.PETS)
        .select(`
            id,
            name,
            xp,
            level,
            mood,
            last_interaction_date,
            pet_type:pet_types ( id, name, base_sprite_url ),
            current_stage:evolution_stages ( id, stage_number, name, sprite_url )
        `)
        .eq('user_id', userId)
        .single();

    // Handle potential errors
    if (petError || !petData) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    // Respond with pet data
    res.json({
        id: petData.id,
        name: petData.name,
        xp: petData.xp,
        level: petData.level,
        mood: petData.mood,
        petType: petData.pet_type,
        currentStage: petData.current_stage,
        lastInteractionDate: petData.last_interaction_date
    });
});

// PATCH /api/pet - Update pet properties such as name
/* Example request:
{
  "name": "Professor Mocha"
}

Example response:
{
  "id": "e5b5a3b4-9e72-4ab3-9c8e-7dd1e4a9d111",
  "name": "Professor Mocha",
  "xp": 280,
  "level": 3,
  "mood": "happy",
  "petType": { "id": 1, "name": "Cat", "baseSpriteUrl": "/sprites/cat-base.png" },
  "currentStage": { "id": 2, "stageNumber": 2, "name": "Teen Cat", "spriteUrl": "/sprites/cat-teen.png" },
  "lastInteractionDate": "2025-11-27"
}*/
router.patch('/', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { name } = req.body;

    // Validate input
    if (!name) {
        return res.status(400).json({ error: 'Pet name is required' });
    }

    // Update pet name
    const { data: petData, error: petError } = await supabase
        .from(TABLES.PETS)
        .update({ name })
        .eq('user_id', userId)
        .select(`
            id,
            name,
            xp,
            level,
            mood,
            last_interaction_date,
            pet_type:pet_types ( id, name, base_sprite_url ),
            current_stage:evolution_stages ( id, stage_number, name, sprite_url )
        `)
        .single();

    // Handle potential errors
    if (petError || !petData) {
        return res.status(404).json({ error: 'Pet not found or update failed' });
    }
    
    // Respond with updated pet data
    res.json({
        id: petData.id,
        name: petData.name,
        xp: petData.xp,
        level: petData.level,
        mood: petData.mood,
        petType: petData.pet_type,
        currentStage: petData.current_stage,
        lastInteractionDate: petData.last_interaction_date
    });
});

// POST /api/pet/ping - Record a non-habit interaction to refresh mood/last interaction
/* Example request:
{
  "interactionType": "pet"
}

Example response:
{
  "id": "e5b5a3b4-9e72-4ab3-9c8e-7dd1e4a9d111",
  "name": "Professor Mocha",
  "xp": 280,
  "level": 3,
  "mood": "happy",
  "petType": { "id": 1, "name": "Cat", "baseSpriteUrl": "/sprites/cat-base.png" },
  "currentStage": { "id": 2, "stageNumber": 2, "name": "Teen Cat", "spriteUrl": "/sprites/cat-teen.png" },
  "lastInteractionDate": "2025-11-27"
}*/

router.post('/ping', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { interactionType } = req.body;

    // Fetch current pet
    const { data: petData, error: petError } = await supabase
        .from(TABLES.PETS)
        .select('id, name, xp, level, mood, last_interaction_date')
        .eq('user_id', userId)
        .single();
    
    if (petError || !petData) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    // Update mood positively and set last interaction date to today
    const newMood = PET_MOOD_UP[petData.mood] || petData.mood;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data: updatedPetData, error: updateError } = await supabase
        .from(TABLES.PETS)
        .update({
            mood: newMood,
            last_interaction_date: today
        })
        .eq('user_id', userId)
        .select(`
            id,
            name,
            xp,
            level,
            mood,
            last_interaction_date,
            pet_type:pet_types ( id, name, base_sprite_url ),
            current_stage:evolution_stages ( id, stage_number, name, sprite_url )
        `)
        .single();

    if (updateError || !updatedPetData) {
        return res.status(500).json({ error: 'Failed to update pet interaction' });
    }

    // Respond with updated pet data
    res.json({
        id: updatedPetData.id,
        name: updatedPetData.name,
        xp: updatedPetData.xp,
        level: updatedPetData.level,
        mood: updatedPetData.mood,
        petType: updatedPetData.pet_type,
        currentStage: updatedPetData.current_stage,
        lastInteractionDate: updatedPetData.last_interaction_date
    });
});
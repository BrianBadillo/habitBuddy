import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { requireAuth } from '../middleware/auth.js'
import { TABLES } from '../db/tables.js'
import { PET_MOOD, PET_MOOD_UP } from '../constants.js'

// Create a router for pet-related routes
const router = Router()

function mapPet(dbPet) {
    if (!dbPet) return null;

    return {
        id: dbPet.id,
        name: dbPet.name,
        level: dbPet.level,
        xp: dbPet.xp,
        mood: dbPet.mood,
        petType: {
            id: dbPet.pet_type.id,
            name: dbPet.pet_type.name,
            baseSpriteUrl: dbPet.pet_type.base_sprite_url
        },
        currentStage: {
            id: dbPet.current_stage.id,
            stageNumber: dbPet.current_stage.stage_number,
            name: dbPet.current_stage.name,
            spriteUrl: dbPet.current_stage.sprite_url
        }
    }
}

// GET /api/pet/types - List all available pet types
/* Example response:
[
  { "id": 1, "name": "Cat", "baseSpriteUrl": "/sprites/cat-base.png" },
  { "id": 2, "name": "Dog", "baseSpriteUrl": "/sprites/dog-base.png" }
]*/
router.get('/types', async (_req, res) => {
    const { data: petTypes, error } = await supabase
        .from(TABLES.PET_TYPES)
        .select('id, name, base_sprite_url');

    if (error) {
        return res.status(500).json({ error: 'Failed to fetch pet types' });
    }

    res.json(petTypes.map(pt => ({
        id: pt.id,
        name: pt.name,
        baseSpriteUrl: pt.base_sprite_url
    })));
});

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
            pet_type:pet_type_id ( id, name, description, base_sprite_url ),
            current_stage:current_stage_id ( id, stage_number, name, sprite_url, description )
        `)
        .eq('user_id', userId)
        .single();

    // Handle potential errors
    if (petError || !petData) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    // Respond with pet data
    res.json(mapPet(petData));
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
            pet_type:pet_type_id ( id, name, description, base_sprite_url ),
            current_stage:current_stage_id ( id, stage_number, name, sprite_url, description )
        `)
        .single();

    // Handle potential errors
    if (petError || !petData) {
        return res.status(404).json({ error: 'Pet not found or update failed' });
    }
    
    // Respond with updated pet data
    res.json(mapPet(petData));
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
            pet_type:pet_type_id ( id, name, description, base_sprite_url ),
            current_stage:current_stage_id ( id, stage_number, name, sprite_url, description )
        `)
        .single();

    if (updateError || !updatedPetData) {
        return res.status(500).json({ error: 'Failed to update pet interaction' });
    }

    // Respond with updated pet data
    res.json(mapPet(petData));
});

// POST /api/pet - Switch the pet to a different type
/* Example request:
{
  "petTypeId": 2
  "name": "Buddy"
}
Example response:
{
  "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "name": "Buddy",
  "xp": 0,
  "level": 1,
  "mood": "neutral",
  "petType": { "id": 2, "name": "Dog", "baseSpriteUrl": "/sprites/dog-base.png" },
  "currentStage": { "id": 1, "stageNumber": 1, "name": "Baby Dog", "spriteUrl": "/sprites/dog-baby.png" },
  "lastInteractionDate": null
}*/
router.post('/', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { petTypeId, name } = req.body;

    // Validate input
    if (!petTypeId || !name) {
        return res.status(400).json({ error: 'petTypeId and name are required' });
    }

    // Fetch the initial stage for the new pet type
    const { data: initialStage, error: stageError } = await supabase
        .from(TABLES.PET_STAGES)
        .select('id')
        .eq('pet_type_id', petTypeId)
        .eq('stage_number', 1)
        .single();
    if (stageError || !initialStage) {
        return res.status(400).json({ error: 'Invalid pet type or no initial stage found' });
    }

    // Create new pet for the user
    const { data: newPetData, error: petError } = await supabase
        .from(TABLES.PETS)
        .insert({
            user_id: userId,
            pet_type_id: petTypeId,
            current_stage_id: initialStage.id,
            name,
            xp: 0,
            level: 1,
            mood: PET_MOOD.NEUTRAL
        })
        .select(`
            id,
            name,
            xp,
            level,
            mood,
            last_interaction_date,
            pet_type:pet_type_id ( id, name, base_sprite_url ),
            current_stage:current_stage_id ( id, stage_number, name, sprite_url )
        `)
        .single();
    if (petError || !newPetData) {
        return res.status(500).json({ error: 'Failed to create new pet' });
    }

    // Respond with new pet data
    res.json(mapPet(petData));
});

export default router;
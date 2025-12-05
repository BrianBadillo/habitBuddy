import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { requireAuth } from '../middleware/auth.js'
import { TABLES } from '../db/tables.js'
import { PET_MOOD, PET_MOOD_UP } from '../constants.js'

// Create a router for pet-related routes
const router = Router()

function mapPet(petData) {
    if (!petData) return null;

    return {
        id: petData.id,
        name: petData.name,
        xp: petData.xp,
        level: petData.level,
        mood: petData.mood,
        petType: petData.pet_type
            ? {
                  id: petData.pet_type.id,
                  name: petData.pet_type.name,
                  description: petData.pet_type.description,
                  baseSpriteUrl: petData.pet_type.base_sprite_url
              }
            : null,
        currentStage: petData.current_stage
            ? {
                  id: petData.current_stage.id,
                  stageNumber: petData.current_stage.stage_number,
                  name: petData.current_stage.name,
                  spriteUrl: petData.current_stage.sprite_url,
                  description: petData.current_stage.description
              }
            : null,
        lastInteractionDate: petData.last_interaction_date
    };
}

async function ensureDefaultPetTypes() {
    const defaults = [
        {
            name: 'Fox',
            description: 'Clever, curious and loyal.',
            baseSpriteUrl: '/pets/fox-stage-1.png',
            stages: [
                { stageNumber: 1, name: 'Fox Kit', spriteUrl: '/pets/fox-stage-1.png', description: 'A curious little kit.' },
                { stageNumber: 2, name: 'Fox Cub', spriteUrl: '/pets/fox-stage-2.png', description: 'Growing and playful.' },
                { stageNumber: 3, name: 'Fox Friend', spriteUrl: '/pets/fox-stage-3.png', description: 'Your steadfast companion.' }
            ]
        }
    ];

    for (const def of defaults) {
        // Check if pet type already exists
        const { data: existingType, error: typeError } = await supabase
            .from(TABLES.PET_TYPES)
            .select('id')
            .eq('name', def.name)
            .maybeSingle();
        if (typeError) {
            console.error('Error checking pet type', def.name, typeError);
            continue;
        }

        let petTypeId = existingType?.id;
        if (!petTypeId) {
            const { data: insertedType, error: insertTypeError } = await supabase
                .from(TABLES.PET_TYPES)
                .insert({
                    name: def.name,
                    description: def.description,
                    base_sprite_url: def.baseSpriteUrl
                })
                .select('id')
                .single();
            if (insertTypeError || !insertedType) {
                console.error('Error seeding pet type', def.name, insertTypeError);
                continue;
            }
            petTypeId = insertedType.id;
        }

        // Ensure stages
        for (const stage of def.stages) {
            const { data: existingStage, error: stageCheckError } = await supabase
                .from(TABLES.EVOLUTION_STAGES)
                .select('id')
                .eq('pet_type_id', petTypeId)
                .eq('stage_number', stage.stageNumber)
                .maybeSingle();
            if (stageCheckError) {
                console.error('Error checking stage', def.name, stage.stageNumber, stageCheckError);
                continue;
            }
            if (existingStage) continue;

            const { error: insertStageError } = await supabase
                .from(TABLES.EVOLUTION_STAGES)
                .insert({
                    pet_type_id: petTypeId,
                    stage_number: stage.stageNumber,
                    name: stage.name,
                    sprite_url: stage.spriteUrl,
                    description: stage.description
                });
            if (insertStageError) {
                console.error('Error seeding stage', def.name, stage.stageNumber, insertStageError);
            }
        }
    }
}

// GET /api/pet/types - List all available pet types (for adoption flow)
router.get('/types', requireAuth, async (_req, res) => {
    await ensureDefaultPetTypes();

    const { data, error } = await supabase
        .from(TABLES.PET_TYPES)
        .select('id, name, description, base_sprite_url');

    if (error) {
        return res.status(500).json({ error: 'Failed to load pet types' });
    }

    const petTypes = (data ?? []).map((type) => ({
        id: type.id,
        name: type.name,
        description: type.description,
        baseSpriteUrl: type.base_sprite_url
    }));

    res.json(petTypes);
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
    res.json(mapPet(updatedPetData));
});

// POST /api/pet - Adopt a new pet for the current user (or replace existing)
router.post('/', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { petTypeId, name, replaceExisting = false } = req.body || {};

    if (!petTypeId || !name) {
        return res.status(400).json({ error: 'petTypeId and name are required' });
    }

    // Prevent multiple pets per user
    const { data: existingPet, error: existingError } = await supabase
        .from(TABLES.PETS)
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
    if (existingError) {
        return res.status(500).json({ error: 'Failed to check existing pet' });
    }
    if (existingPet && !replaceExisting) {
        return res.status(400).json({ error: 'You already have a pet' });
    }

    // Validate pet type
    const { data: petTypeData, error: petTypeError } = await supabase
        .from(TABLES.PET_TYPES)
        .select('id, name, description, base_sprite_url')
        .eq('id', petTypeId)
        .single();
    if (petTypeError || !petTypeData) {
        return res.status(404).json({ error: 'Pet type not found' });
    }

    // Get first evolution stage for this pet type
    const { data: stageData, error: stageError } = await supabase
        .from(TABLES.EVOLUTION_STAGES)
        .select('id, stage_number, name, sprite_url, description')
        .eq('pet_type_id', petTypeId)
        .eq('stage_number', 1)
        .maybeSingle();
    if (stageError) {
        return res.status(500).json({ error: 'Failed to load pet stages' });
    }
    if (!stageData) {
        return res.status(400).json({ error: 'Pet type is missing a starting stage' });
    }

    const today = new Date().toISOString().split('T')[0];

    let petResult;
    if (existingPet && replaceExisting) {
        // Reset and change the existing pet
        const { data: updatedPet, error: updateError } = await supabase
            .from(TABLES.PETS)
            .update({
                pet_type_id: petTypeId,
                name,
                xp: 0,
                level: 1,
                mood: PET_MOOD.HAPPY,
                current_stage_id: stageData.id,
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
        if (updateError || !updatedPet) {
            return res.status(500).json({ error: 'Failed to replace pet' });
        }
        petResult = updatedPet;
    } else {
        // Create the pet
        const { data: petData, error: petError } = await supabase
            .from(TABLES.PETS)
            .insert({
                user_id: userId,
                pet_type_id: petTypeId,
                name,
                xp: 0,
                level: 1,
                mood: PET_MOOD.HAPPY,
                current_stage_id: stageData.id,
                last_interaction_date: today
            })
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

        if (petError || !petData) {
            return res.status(500).json({ error: 'Failed to adopt pet' });
        }
        petResult = petData;
    }

    res.status(201).json(mapPet(petResult));
});

export default router;

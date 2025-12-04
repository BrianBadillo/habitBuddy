import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { requireAdmin } from '../middleware/auth.js'
import { TABLES } from '../db/tables.js'

// Create a router for admin-related routes
const router = Router()

// GET /api/admin - Check admin access
/* Example response:
{
    "ok": true,
}
otherwise 403 Forbidden if not admin
*/
router.get('/', requireAdmin, async (_req, res) => {
    res.json({ ok: true });
});

// GET /api/admin/pet-types - List all defined pet types.
/* Example response:
[
  { "id": 1, "name": "Cat", "description": "Curious and lazy", "base_sprite_url": "/sprites/cat-base.png" },
  { "id": 2, "name": "Dragon", "description": "Fiery and proud", "base_sprite_url": "/sprites/dragon-base.png" }
]*/
router.get('/pet-types', requireAdmin, async (_req, res) => {
    try {
        // Fetch all pet types
        const { data: petTypes, error: petTypesError } = await supabase
            .from(TABLES.PET_TYPES)
            .select('id, name, description, base_sprite_url');
        if (petTypesError) {
            return res.status(500).json({ error: 'Failed to fetch pet types' });
        }

        res.json(petTypes);
    } catch (err) {
        console.error('Admin pet-types error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/pet-types - Create a new pet type.
/* Example request:
{
  "name": "Dog",
  "description": "Loyal and energetic",
  "baseSpriteUrl": "https://i.imgur.com/UGueBBX.png"
}
Example response:
{
  "id": 3,
  "name": "Dog",
  "description": "Loyal and energetic",
  "baseSpriteUrl": "https://i.imgur.com/UGueBBX.png",
  "createdAt": "2025-11-27T05:00:00.000Z"
}*/
router.post('/pet-types', requireAdmin, async (req, res) => {
    const { name, description, baseSpriteUrl } = req.body;

    // Validate input
    if (!name || !description || !baseSpriteUrl) {
        return res.status(400).json({ error: 'Name, description, and baseSpriteUrl are required' });
    }

    try {
        // Insert new pet type
        const { data: petTypeData, error: petTypeError } = await supabase
            .from(TABLES.PET_TYPES)
            .insert({
                name,
                description,
                base_sprite_url: baseSpriteUrl
            })
            .select('id, name, description, base_sprite_url, created_at')
            .single();
        if (petTypeError || !petTypeData) {
            return res.status(500).json({ error: 'Failed to create pet type' });
        }

        res.status(201).json({
            id: petTypeData.id,
            name: petTypeData.name,
            description: petTypeData.description,
            baseSpriteUrl: petTypeData.base_sprite_url,
            createdAt: petTypeData.created_at
        });
    } catch (err) {
        console.error('Admin create pet-type error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/pet-types/:petTypeId - Get details of a specific pet type (and it's stages).
/* Example response:
{
  "petType": {
    "id": 1,
    "name": "Cat",
    "description": "Curious and lazy",
    "baseSpriteUrl": "/sprites/cat-base.png"
  },
  "stages": [
    {
      "id": 1,
      "stageNumber": 1,
      "name": "Kitten",
      "spriteUrl": "/sprites/cat-baby.png"
    },
    {
      "id": 2,
      "stageNumber": 2,
      "name": "Teen Cat",
      "spriteUrl": "/sprites/cat-teen.png"
    }
  ]
}*/
router.get('/pet-types/:petTypeId', requireAdmin, async (req, res) => {
    const petTypeId = req.params.petTypeId;

    try {
        // Fetch pet type details
        const { data: petTypeData, error: petTypeError } = await supabase
            .from(TABLES.PET_TYPES)
            .select('id, name, description, base_sprite_url')
            .eq('id', petTypeId)
            .single();
        if (petTypeError || !petTypeData) {
            return res.status(404).json({ error: 'Pet type not found' });
        }

        // Fetch associated stages
        const { data: stagesData, error: stagesError } = await supabase
            .from(TABLES.EVOLUTION_STAGES)
            .select('id, stage_number, name, sprite_url')
            .eq('pet_type_id', petTypeId)
            .order('stage_number', { ascending: true });
        if (stagesError) {
            return res.status(500).json({ error: 'Failed to fetch evolution stages' });
        }

        res.json({
            petType: {
                id: petTypeData.id,
                name: petTypeData.name,
                description: petTypeData.description,
                baseSpriteUrl: petTypeData.base_sprite_url
            },
            stages: stagesData.map(stage => ({
                id: stage.id,
                stageNumber: stage.stage_number,
                name: stage.name,
                spriteUrl: stage.sprite_url
            }))
        });
    } catch (err) {
        console.error('Admin get pet-type error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/pet-types/:petTypeId - Update a specific pet type.
/* Example request:
{
  "name": "Cat",
  "description": "Curious but chill",
  "baseSpriteUrl": "/sprites/cat-base-v2.png"
}
Example response:
{
  "id": 1,
  "name": "Cat",
  "description": "Curious but chill",
  "baseSpriteUrl": "/sprites/cat-base-v2.png"
}*/
router.put('/pet-types/:petTypeId', requireAdmin, async (req, res) => {
    const petTypeId = req.params.petTypeId;
    const { name, description, baseSpriteUrl } = req.body;

    // Validate input
    if (!name && !description && !baseSpriteUrl) {
        return res.status(400).json({ error: 'At least one of name, description, or baseSpriteUrl must be provided' });
    }

    try {
        // Prepare update object
        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (baseSpriteUrl) updateData.base_sprite_url = baseSpriteUrl;

        // Update pet type
        const { data: petTypeData, error: petTypeError } = await supabase
            .from(TABLES.PET_TYPES)
            .update(updateData)
            .eq('id', petTypeId)
            .select('id, name, description, base_sprite_url')
            .single();
        if (petTypeError || !petTypeData) {
            return res.status(500).json({ error: 'Failed to update pet type' });
        }

        res.json({
            id: petTypeData.id,
            name: petTypeData.name,
            description: petTypeData.description,
            baseSpriteUrl: petTypeData.base_sprite_url
        });
    } catch (err) {
        console.error('Admin update pet-type error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/admin/pet-types/:petTypeId - Delete a specific pet type.
router.delete('/pet-types/:petTypeId', requireAdmin, async (req, res) => {
    const petTypeId = req.params.petTypeId;

    try {
        // Delete pet type
        const { error: petTypeError } = await supabase
            .from(TABLES.PET_TYPES)
            .delete()
            .eq('id', petTypeId);
        if (petTypeError) {
            return res.status(500).json({ error: 'Failed to delete pet type' });
        }

        res.status(204).send(); // No content
    } catch (err) {
        console.error('Admin delete pet-type error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/pet-types/:petTypeId/stages - List all evolution stages for a specific pet type.
/* Example response:
[
  {
    "id": 1,
    "petTypeId": 1,
    "stageNumber": 1,
    "name": "Kitten",
    "spriteUrl": "/sprites/cat-baby.png"
  },
  {
    "id": 2,
    "petTypeId": 1,
    "stageNumber": 2,
    "name": "Teen Cat",
    "spriteUrl": "/sprites/cat-teen.png"
  }
]*/
router.get('/pet-types/:petTypeId/stages', requireAdmin, async (req, res) => {
    const petTypeId = req.params.petTypeId;

    try {
        // Fetch evolution stages
        const { data: stagesData, error: stagesError } = await supabase
            .from(TABLES.EVOLUTION_STAGES)
            .select('id, stage_number, name, sprite_url')
            .eq('pet_type_id', petTypeId)
            .order('stage_number', { ascending: true });
        if (stagesError) {
            return res.status(500).json({ error: 'Failed to fetch evolution stages' });
        }

        res.json(stagesData.map(stage => ({
            id: stage.id,
            stageNumber: stage.stage_number,
            name: stage.name,
            spriteUrl: stage.sprite_url
        })));
    } catch (err) {
        console.error('Admin get evolution stages error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/pet-types/:petTypeId/stages - Create a new evolution stage.
/* Example request:
{
  "stageNumber": 3,
  "name": "Adult Cat",
  "spriteUrl": "/sprites/cat-adult.png",
  "description": "Wise and sleepy"
}
Example response:
{
  "id": 3,
  "petTypeId": 1,
  "stageNumber": 3,
  "name": "Adult Cat",
  "spriteUrl": "/sprites/cat-adult.png",
  "description": "Wise and sleepy"
}*/
router.post('/pet-types/:petTypeId/stages', requireAdmin, async (req, res) => {
    const petTypeId = req.params.petTypeId;
    const { stageNumber, name, spriteUrl, description } = req.body;

    // Validate input
    if (!stageNumber || !name || !spriteUrl) {
        return res.status(400).json({ error: 'stageNumber, name, and spriteUrl are required' });
    }

    try {
        // Insert new evolution stage
        const { data: stageData, error: stageError } = await supabase
            .from(TABLES.EVOLUTION_STAGES)
            .insert({
                pet_type_id: petTypeId,
                stage_number: stageNumber,
                name: name,
                sprite_url: spriteUrl,
                description: description || null
            })
            .select('id, pet_type_id, stage_number, name, sprite_url, description')
            .single();
        if (stageError || !stageData) {
            return res.status(500).json({ error: 'Failed to create evolution stage' });
        }

        res.status(201).json({
            id: stageData.id,
            petTypeId: stageData.pet_type_id,
            stageNumber: stageData.stage_number,
            name: stageData.name,
            spriteUrl: stageData.sprite_url,
            description: stageData.description
        });
    } catch (err) {
        console.error('Admin create evolution stage error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/evolution-stages/:stageId - Get details of a specific evolution stage.
/* Example response:
{
  "id": 3,
  "petTypeId": 1,
  "stageNumber": 3,
  "name": "Adult Cat",
  "spriteUrl": "/sprites/cat-adult.png",
  "description": "Wise and sleepy"
}*/
router.get('/evolution-stages/:stageId', requireAdmin, async (req, res) => {
    const stageId = req.params.stageId;

    try {
        // Fetch evolution stage details
        const { data: stageData, error: stageError } = await supabase
            .from(TABLES.EVOLUTION_STAGES)
            .select('id, pet_type_id, stage_number, name, sprite_url, description')
            .eq('id', stageId)
            .single();
        if (stageError || !stageData) {
            return res.status(404).json({ error: 'Evolution stage not found' });
        }

        res.json({
            id: stageData.id,
            petTypeId: stageData.pet_type_id,
            stageNumber: stageData.stage_number,
            name: stageData.name,
            spriteUrl: stageData.sprite_url,
            description: stageData.description
        });
    } catch (err) {
        console.error('Admin get evolution stage error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/evolution-stages/:stageId - Update a specific evolution stage.
/* Example request:
{
  "stageNumber": 3,
  "name": "Adult Cat",
  "spriteUrl": "/sprites/cat-adult-v2.png",
  "description": "Evolved at level 5 now"
}
Example response:
{
  "id": 3,
  "petTypeId": 1,
  "stageNumber": 3,
  "name": "Adult Cat",
  "spriteUrl": "/sprites/cat-adult-v2.png",
  "description": "Evolved at level 5 now"
}*/
router.put('/evolution-stages/:stageId', requireAdmin, async (req, res) => {
    const stageId = req.params.stageId;
    const { stageNumber, name, spriteUrl, description } = req.body;

    // Validate input
    if (!stageNumber && !name && !spriteUrl && !description) {
        return res.status(400).json({ error: 'At least one of stageNumber, name, spriteUrl, or description must be provided' });
    }

    try {
        // Prepare update object
        const updateData = {};
        if (stageNumber) updateData.stage_number = stageNumber;
        if (name) updateData.name = name;
        if (spriteUrl) updateData.sprite_url = spriteUrl;
        if (description !== undefined) updateData.description = description;

        // Update evolution stage
        const { data: stageData, error: stageError } = await supabase
            .from(TABLES.EVOLUTION_STAGES)
            .update(updateData)
            .eq('id', stageId)
            .select('id, pet_type_id, stage_number, name, sprite_url, description')
            .single();
        if (stageError || !stageData) {
            return res.status(500).json({ error: 'Failed to update evolution stage' });
        }

        res.json({
            id: stageData.id,
            petTypeId: stageData.pet_type_id,
            stageNumber: stageData.stage_number,
            name: stageData.name,
            spriteUrl: stageData.sprite_url,
            description: stageData.description
        });
    } catch (err) {
        console.error('Admin update evolution stage error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/admin/evolution-stages/:stageId - Delete a specific evolution stage.
router.delete('/evolution-stages/:stageId', requireAdmin, async (req, res) => {
    const stageId = req.params.stageId;

    try {
        // Delete evolution stage
        const { error: stageError } = await supabase
            .from(TABLES.EVOLUTION_STAGES)
            .delete()
            .eq('id', stageId);
        if (stageError) {
            return res.status(500).json({ error: 'Failed to delete evolution stage' });
        }

        res.status(204).send(); // No content
    } catch (err) {
        console.error('Admin delete evolution stage error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/users - List all users.
/* Example response:
[
  {
    "id": "6a0c9ac4-5f4c-4f1f-9af0-3a3ddfbeb123",
    "username": "brian",
    "displayName": "Brian Badillo",
    "role": "user",
    "createdAt": "2025-11-27T03:10:00.000Z"
  },
  {
    "id": "77777777-4444-4444-4444-aaaaaaaaaaaa",
    "username": "liam",
    "displayName": "Liam Messinger",
    "role": "admin",
    "createdAt": "2025-11-20T10:00:00.000Z"
  }
]*/
router.get('/users', requireAdmin, async (_req, res) => {
    try {
        // Fetch all users
        const { data: usersData, error: usersError } = await supabase
            .from(TABLES.PROFILES)
            .select('id, username, display_name, role, created_at')
            .order('created_at', { ascending: false });
        if (usersError) {
            return res.status(500).json({ error: 'Failed to fetch users' });
        }

        res.json(usersData.map(user => ({
            id: user.id,
            username: user.username,
            displayName: user.display_name,
            role: user.role,
            createdAt: user.created_at
        })));
    } catch (err) {
        console.error('Admin get users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/users/:userId - Get details of a specific user.
/* Example response:
{
  "user": {
    "id": "6a0c9ac4-5f4c-4f1f-9af0-3a3ddfbeb123",
    "username": "brian",
    "displayName": "Brian Badillo",
    "role": "user"
  },
  "habits": [
    { "id": "7f664e4a-64b6-42bb-bf51-91f44e6c1111", "name": "Study", "frequency": "daily" }
  ],
  "pet": {
    "id": "e5b5a3b4-9e72-4ab3-9c8e-7dd1e4a9d111",
    "name": "Professor Mocha",
    "level": 3,
    "xp": 280,
    "mood": "happy"
  }
}*/
router.get('/users/:userId', requireAdmin, async (req, res) => {
    const userId = req.params.userId;

    try {
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
            .from(TABLES.PROFILES)
            .select('id, username, display_name, role')
            .eq('id', userId)
            .single();
        if (userError || !userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch user's habits
        const { data: habitsData, error: habitsError } = await supabase
            .from(TABLES.HABITS)
            .select('id, name, frequency')
            .eq('user_id', userId);
        if (habitsError) {
            return res.status(500).json({ error: 'Failed to fetch user habits' });
        }

        // Fetch user's pet
        const { data: petData, error: petError } = await supabase
            .from(TABLES.PETS)
            .select('id, name, level, xp, mood')
            .eq('user_id', userId)
            .single();
        if (petError) {
            return res.status(500).json({ error: 'Failed to fetch user pet' });
        }

        res.json({
            user: {
                id: userData.id,
                username: userData.username,
                displayName: userData.display_name,
                role: userData.role
            },
            habits: habitsData.map(habit => ({
                id: habit.id,
                name: habit.name,
                frequency: habit.frequency
            })),
            pet: petData ? {
                id: petData.id,
                name: petData.name,
                level: petData.level,
                xp: petData.xp,
                mood: petData.mood
            } : null
        });
    } catch (err) {
        console.error('Admin get user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/admin/users/:userId/role - Update a user's role.
/* Example request:
{
  "role": "admin"
}
Example response:
{
  "id": "6a0c9ac4-5f4c-4f1f-9af0-3a3ddfbeb123",
  "username": "brian",
  "displayName": "Brian Badillo",
  "role": "admin"
}*/
router.patch('/users/:userId/role', requireAdmin, async (req, res) => {
    const userId = req.params.userId;
    const { role } = req.body;

    // Validate input
    if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    try {
        // Update user's role
        const { data: userData, error: userError } = await supabase
            .from(TABLES.PROFILES)
            .update({ role })
            .eq('id', userId)
            .select('id, username, display_name, role')
            .single();
        if (userError || !userData) {
            return res.status(500).json({ error: 'Failed to update user role' });
        }

        res.json({
            id: userData.id,
            username: userData.username,
            displayName: userData.display_name,
            role: userData.role
        });
    } catch (err) {
        console.error('Admin update user role error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/metrics/overview - Get app-wide metrics like total users and habits.
/* Example response:
{
  "totalUsers": 42,
  "totalHabits": 180,
  "totalCompletions": 1260,
  "activeUsers": 29
}*/
router.get('/metrics/overview', requireAdmin, async (req, res) => {
    try {
        // Fetch total users
        const { count: totalUsers, error: usersError } = await supabase
            .from(TABLES.PROFILES)
            .select('*', { count: 'exact', head: true });
        if (usersError) {
            return res.status(500).json({ error: 'Failed to fetch total users' });
        }

        // Fetch total habits
        const { count: totalHabits, error: habitsError } = await supabase
            .from(TABLES.HABITS)
            .select('*', { count: 'exact', head: true });
        if (habitsError) {
            return res.status(500).json({ error: 'Failed to fetch total habits' });
        }

        // Fetch total completions
        const { count: totalCompletions, error: completionsError } = await supabase
            .from(TABLES.HABIT_COMPLETIONS)
            .select('*', { count: 'exact', head: true });
        if (completionsError) {
            return res.status(500).json({ error: 'Failed to fetch total completions' });
        }

        // Active users = distinct users with at least one completion in last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10); // YYYY-MM-DD

        // Fetch user_ids and dedupe client-side
        const { data: recentUserIds, error: activeUsersError } = await supabase
            .from(TABLES.HABIT_COMPLETIONS)
            .select('user_id')
            .gte('completed_date', thirtyDaysAgo);
        if (activeUsersError) {
            return res.status(500).json({ error: 'Failed to fetch active users' });
        }
        const activeUsers = new Set((recentUserIds || []).map(r => r.user_id)).size;

        res.json({
            totalUsers: totalUsers || 0,
            totalHabits: totalHabits || 0,
            totalCompletions: totalCompletions || 0,
            activeUsers: activeUsers || 0
        });
    } catch (err) {
        console.error('Admin get metrics overview error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
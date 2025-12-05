import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { requireAuth } from '../middleware/auth.js'
import { TABLES } from '../db/tables.js'

// Create a router for friend-related routes
const router = Router()

// GET /api/friends - List the user’s friendships (pending and accepted).
/* Example response:
[
  {
    "id": 10,
    "requesterId": "6a0c9ac4-5f4c-4f1f-9af0-3a3ddfbeb123",
    "addresseeId": "77777777-4444-4444-4444-aaaaaaaaaaaa",
    "status": "accepted",
    "createdAt": "2025-11-25T18:00:00.000Z",
    "friend": {
      "id": "77777777-4444-4444-4444-aaaaaaaaaaaa",
      "username": "liam",
      "displayName": "Liam Messinger"
    }
  }
]*/
router.get('/', requireAuth, async (req, res) => {
    const userId = req.user.id;

    // Fetch friendships where the user is either the requester or addressee
    const { data: friendships, error } = await supabase
        .from(TABLES.FRIENDS)
        .select('id, requester_id, addressee_id, status, created_at')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`); // either requester or addressee
    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // For each friendship, fetch the friend's profile
    const results = [];
    for (const friendship of friendships) {
        const friendId = (friendship.requester_id === userId) ? friendship.addressee_id : friendship.requester_id;

        const { data: friendProfile, error: profileError } = await supabase
            .from(TABLES.PROFILES)
            .select('id, username, display_name')
            .eq('id', friendId)
            .single();
        if (profileError) {
            return res.status(500).json({ error: profileError.message });
        }

        results.push({
            id: friendship.id,
            requesterId: friendship.requester_id,
            addresseeId: friendship.addressee_id,
            status: friendship.status,
            createdAt: friendship.created_at,
            friend: {
                id: friendProfile.id,
                username: friendProfile.username,
                displayName: friendProfile.display_name
            }
        });
    }

    res.json(results);
});

// POST /api/friends/:friendId - Send a friend request to another user.
/* Example response:
{
  "id": 11,
  "requesterId": "6a0c9ac4-5f4c-4f1f-9af0-3a3ddfbeb123",
  "addresseeId": "77777777-4444-4444-4444-aaaaaaaaaaaa",
  "status": "pending",
  "createdAt": "2025-11-27T04:30:00.000Z"
}
or if already friends:
response status 400
*/
router.post('/:friendId', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.params;

    // Check if a friendship already exists
    const { data: existingFriendship, error: existingError } = await supabase
        .from(TABLES.FRIENDS)
        .select('*')
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`)
        .maybeSingle();
    if (existingError) {
        return res.status(500).json({ error: existingError.message });
    }
    if (existingFriendship) {
        return res.status(400).json({ error: 'Friendship already exists or pending' });
    }

    // Create a new friend request
    const { data: newFriendship, error } = await supabase
        .from(TABLES.FRIENDS)
        .insert({
            requester_id: userId,
            addressee_id: friendId,
            status: 'pending'
        })
        .select('*')
        .single();
    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
        id: newFriendship.id,
        requesterId: newFriendship.requester_id,
        addresseeId: newFriendship.addressee_id,
        status: newFriendship.status,
        createdAt: newFriendship.created_at
    });
});

// PATCH /api/friends/:friendId - Accept/reject a friend request or remove a friend.
/* Example request:
{
  "status": "accepted|rejected|removed"
}

Example response for accept:
{
  "id": 11,
  "requesterId": "6a0c9ac4-5f4c-4f1f-9af0-3a3ddfbeb123",
  "addresseeId": "77777777-4444-4444-4444-aaaaaaaaaaaa",
  "status": "accepted",
  "createdAt": "2025-11-27T04:30:00.000Z"
}
or for rejected/removed:
response status 204
*/
router.patch('/:friendId', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.params;
    const { status } = req.body;

    // If status is 'accepted'
    if (status === 'accepted') {
        // Get the existing friend request
        const { data: friendship, error: fetchError } = await supabase
            .from(TABLES.FRIENDS)
            .select('*')
            .eq('requester_id', friendId)
            .eq('addressee_id', userId)
            .eq('status', 'pending')
            .single();
        if (fetchError) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        // Update the status to accepted
        const { data: updatedFriendship, error: updateError } = await supabase
            .from(TABLES.FRIENDS)
            .update({ status: 'accepted' })
            .eq('id', friendship.id)
            .select('*')
            .single();
        if (updateError) {
            return res.status(500).json({ error: updateError.message });
        }

        return res.json({
            id: updatedFriendship.id,
            requesterId: updatedFriendship.requester_id,
            addresseeId: updatedFriendship.addressee_id,
            status: updatedFriendship.status,
            createdAt: updatedFriendship.created_at
        });
    } 
    // If status is 'rejected' or 'removed'
    else if (status === 'rejected' || status === 'removed') {
        // Delete the friendship
        const { error: deleteError } = await supabase
            .from(TABLES.FRIENDS)
            .delete()
            .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`);
        if (deleteError) {
            return res.status(500).json({ error: deleteError.message });
        }

        return res.status(204).send();
    } 
    else {
        return res.status(400).json({ error: 'Invalid status value' });
    }
});

// GET /api/friends/:friendId/pet - View a friend’s pet info (if friendship is accepted).
/* Example response:
{
  "friend": {
    "id": "77777777-4444-4444-4444-aaaaaaaaaaaa",
    "username": "liam",
    "displayName": "Liam Messinger"
  },
  "pet": {
    "id": "99999999-2222-2222-2222-bbbbbbbbbbbb",
    "name": "Neko",
    "level": 4,
    "xp": 420,
    "mood": "happy"
  }
}*/
router.get('/:friendId/pet', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.params;

    // Check if friendship is accepted
    const { data: friendship, error: fetchError } = await supabase
        .from(TABLES.FRIENDS)
        .select('*')
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`)
        .maybeSingle();
    if (fetchError) {
        return res.status(500).json({ error: fetchError.message });
    }
    if (!friendship || friendship.status != 'accepted') {
        return res.status(403).json({ error: 'Not friends with this user' });
    }

    // Fetch friend's profile
    const { data: friendProfile, error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .select('id, username, display_name')
        .eq('id', friendId)
        .single();
    if (profileError) {
        return res.status(500).json({ error: profileError.message });
    }

    // Fetch friend's pet
    const { data: petData, error: petError } = await supabase
        .from(TABLES.PETS)
        .select('id, name, level, xp, mood')
        .eq('user_id', friendId)
        .single();
    if (petError) {
        return res.status(500).json({ error: petError.message });
    }

    // Return friend's profile and pet info
    res.json({
        friend: {
            id: friendProfile.id,
            username: friendProfile.username,
            displayName: friendProfile.display_name
        },
        pet: {
            id: petData.id,
            name: petData.name,
            level: petData.level,
            xp: petData.xp,
            mood: petData.mood
        }
    });
});

// GET /api/friends/:friendId/summary - Get a friend’s high-level stats (pet level, streaks, etc.) (if friendship is accepted).
/* Example response:
{
  "friend": {
    "id": "77777777-4444-4444-4444-aaaaaaaaaaaa",
    "username": "liam",
    "displayName": "Liam Messinger"
  },
  "pet": {
    "id": "99999999-2222-2222-2222-bbbbbbbbbbbb",
    "name": "Neko",
    "level": 4,
    "xp": 420,
    "mood": "happy"
  },
  "totalHabits": 6,
  "bestStreak": 21
}*/
router.get('/:friendId/summary', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.params;

    // Check if friendship is accepted
    const { data: friendship, error: fetchError } = await supabase
        .from(TABLES.FRIENDS)
        .select('*')
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`)
        .maybeSingle();
    if (fetchError) {
        return res.status(500).json({ error: fetchError.message });
    }
    if (!friendship || friendship.status != 'accepted') {
        return res.status(403).json({ error: 'Not friends with this user' });
    }

    // Fetch friend's profile
    const { data: friendProfile, error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .select('id, username, display_name')
        .eq('id', friendId)
        .single();
    if (profileError) {
        return res.status(500).json({ error: profileError.message });
    }
    
    // Fetch friend's pet
    const { data: petData, error: petError } = await supabase
        .from(TABLES.PETS)
        .select('id, name, level, xp, mood')
        .eq('user_id', friendId)
        .single();
    if (petError) {
        return res.status(500).json({ error: petError.message });
    }

    // Fetch total habits
    const { count: totalHabits } = await supabase
        .from(TABLES.HABITS)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', friendId);

    // Fetch best streak
    const { data: bestStreakData } = await supabase
        .from(TABLES.STREAKS)
        .select('longest_streak')
        .eq('user_id', friendId)
        .order('longest_streak', { ascending: false })
        .limit(1)
        .maybeSingle();

    res.json({
        friend: {
            id: friendProfile.id,
            username: friendProfile.username,
            displayName: friendProfile.display_name
        },
        pet: {
            id: petData.id,
            name: petData.name,
            level: petData.level,
            xp: petData.xp,
            mood: petData.mood
        },
        totalHabits: totalHabits || 0,
        bestStreak: bestStreakData ? bestStreakData.longest_streak : 0
    });
});

export default router;
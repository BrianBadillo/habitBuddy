import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { requireAuth } from '../middleware/auth.js'
import { TABLES } from '../db/tables.js'

// Create a router for leaderboard-related routes
const router = Router()

// GET /api/leaderboard/xp - Get a leaderboard of friends by total XP (including the user themselves)
/* Example response:
[
  {
    "rank": 1,
    "user": { "id": "77777777-4444-4444-4444-aaaaaaaaaaaa", "username": "liam" },
    "pet": { "name": "Neko", "level": 4, "xp": 420 }
  },
  {
    "rank": 2,
    "user": { "id": "6a0c9ac4-5f4c-4f1f-9af0-3a3ddfbeb123", "username": "brian" },
    "pet": { "name": "Professor Mocha", "level": 3, "xp": 280 }
  }
]*/
router.get('/xp', requireAuth, async (req, res) => {
    const userId = req.user.id;

    try {
        // Fetch accepted friendships involving the user
        const { data: friendships, error: friendsError } = await supabase
            .from(TABLES.FRIENDS)
            .select('requester_id, addressee_id, status')
            .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
            .eq('status', 'accepted');
        if (friendsError) {
            return res.status(500).json({ error: friendsError.message });
        }

        // Collect participant IDs (friends + user)
        const participantIds = new Set();
        participantIds.add(userId);
        friendships.forEach(f => {
            participantIds.add(f.requester_id);
            participantIds.add(f.addressee_id);
        });
        const ids = Array.from(participantIds);

        // Fetch profiles for usernames
        const { data: profiles, error: profilesError } = await supabase
            .from(TABLES.PROFILES)
            .select('id, username')
            .in('id', ids);
        if (profilesError) {
            return res.status(500).json({ error: profilesError.message });
        }

        // Fetch pets for XP and levels
        const { data: pets, error: petsError } = await supabase
            .from(TABLES.PETS)
            .select('id, user_id, name, level, xp')
            .in('user_id', ids);
        if (petsError) {
            return res.status(500).json({ error: petsError.message });
        }

        // Build maps
        const profileMap = new Map(profiles.map(p => [p.id, p]));
        const petMap = new Map(pets.map(p => [p.user_id, p]));

        // Build leaderboard entries and sort by XP
        const entries = ids
        .map(id => {
            const user = profileMap.get(id);
            const pet = petMap.get(id);
            if (!user || !pet) return null; // Skip if missing data
            return {
            user: { id: user.id, username: user.username },
            pet: { name: pet.name, level: pet.level, xp: pet.xp }
            };
        })
        .filter(Boolean) // Remove nulls
        .sort((a, b) => b.pet.xp - a.pet.xp)
        .map((entry, idx) => ({
            rank: idx + 1,
            user: entry.user,
            pet: entry.pet
        }));

        res.json(entries); 
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/leaderboard/streaks - Get a leaderboard of friends by longest current streaks
/* Example response:
[
  {
    "rank": 1,
    "user": { "id": "aaaa1111-bbbb-2222-cccc-3333dddd4444", "username": "amelia" },
    "longest_streak": 30
  },
  {
    "rank": 2,
    "user": { "id": "77777777-4444-4444-4444-aaaaaaaaaaaa", "username": "liam" },
    "longest_streak": 21
  }
]*/
router.get('/streaks', requireAuth, async (req, res) => {
    const userId = req.user.id;

    try {
        // Fetch accepted friendships involving the user
        const { data: friendships, error: friendsError } = await supabase
            .from(TABLES.FRIENDS)
            .select('requester_id, addressee_id, status')
            .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
            .eq('status', 'accepted');
        if (friendsError) {
            return res.status(500).json({ error: friendsError.message });
        }

        // Collect participant IDs (friends + user)
        const participantIds = new Set();
        participantIds.add(userId);
        friendships.forEach(f => {
            participantIds.add(f.requester_id);
            participantIds.add(f.addressee_id);
        });
        const ids = Array.from(participantIds);

        // Fetch profiles for usernames
        const { data: profiles, error: profilesError } = await supabase
            .from(TABLES.PROFILES)
            .select('id, username')
            .in('id', ids);
        if (profilesError) {
            return res.status(500).json({ error: profilesError.message });
        }

        // Fetch streaks for best streaks
        const { data: streaks, error: streaksError } = await supabase
            .from(TABLES.STREAKS)
            .select('user_id, longest_streak')
            .in('user_id', ids);
        if (streaksError) {
            return res.status(500).json({ error: streaksError.message });
        }

        // Build maps
        const profileMap = new Map(profiles.map(p => [p.id, p]));
        const streakMap = new Map(streaks.map(s => [s.user_id, s]));

        // Build leaderboard entries and sort by best streak
        const entries = ids
        .map(id => {
            const user = profileMap.get(id);
            const streak = streakMap.get(id);
            if (!user || !streak) return null; // Skip if missing data
            return {
                user: { id: user.id, username: user.username },
                longest_streak: streak.longest_streak
            };
        })
        .filter(Boolean) // Remove nulls
        .sort((a, b) => b.longest_streak - a.longest_streak)
        .map((entry, idx) => ({
            rank: idx + 1,
            user: entry.user,
            longest_streak: entry.longest_streak
        }));

        res.json(entries); 
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
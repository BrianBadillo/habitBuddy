import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { TABLES } from '../db/tables.js'

// Create a router for auth-related routes
const router = Router()

// POST /api/auth/signup - Sign up a new user
/* Example request body:
{
  "email": "alice@example.com",
  "password": "CorrectHorseBatteryStaple",
  "username": "alice",
  "displayName": "Alice Liddell"
}

Example response:
{
  "user": {
    "id": "f7b9d6e8-421a-49df-a611-9608b4701e77",
    "email": "alice@example.com",
    "username": "alice",
    "displayName": "Alice Liddell",
    "createdAt": "2025-12-01T20:15:00.000Z"
  }
}
*/
router.post('/signup', async (req, res) => {
    // Extract email, password, and profile fields from the request body
    const { email, password, username, displayName } = req.body;

    // Validate input
    if (!email || !password || !username || !displayName) {
        return res.status(400).json({ error: 'Email, password, username, and displayName are required' });
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true // auto-confirm email for simplicity
    });

    // Handle potential errors
    if (authError || !authData?.user) {
        return res.status(400).json({ error: authError?.message || 'Failed to create user' });
    }

    const userId = authData.user.id; // Newly created user's ID

    // Insert profile row
    const { data: profileData, error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .insert({
            id: userId,
            username,
            display_name: displayName,
            role: 'user' // default role
            // created_at will default to now()
        })
        .select('id, username, display_name, role, created_at')
        .single();
    
    // Handle potential errors
    if (error || !data) {
        // Rollback: delete the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(userId);
        return res.status(400).json({ error: error?.message || 'Failed to create user profile' });
    }

    // Respond with full profile info
    res.status(201).json({
        user: {
            id: profileData.id,
            email: authData.user.email,
            username: profileData.username,
            displayName: profileData.display_name,
            createdAt: profileData.created_at
        }
    });
});

// POST /api/auth/login - Log in an existing user
/* Example request body:
{
  "email": "alice@example.com",
  "password": "CorrectHorseBatteryStaple"
}

Example response:
{
  "user": {
    "id": "f7b9d6e8-421a-49df-a611-9608b4701e77",
    "email": "alice@example.com",
    "username": "alice",
    "displayName": "Alice Liddell",
    "role": "user",
    "createdAt": "2025-12-01T20:15:00.000Z"
  }
}
*/
router.post('/login', async (req, res) => {
    // Extract email and password from the request body
    const { email, password } = req.body;
    // Validate input
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Use Supabase to sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return res.status(400).json({ error: error.message });
    }

    // Set HttpOnly session cookie and return minimal user info
    const accessToken = data.session?.access_token
    if (accessToken) {
        res.cookie('session', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        })
    }
    
    // Fetch user profile info for logged-in user
    const userId = data.user?.id;
    const { data: profileData, error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .select('id, username, display_name, role, created_at')
        .eq('id', userId)
        .single();
    if (profileError || !profileData) {
        return res.status(400).json({ error: 'Failed to fetch user profile' });
    }

    res.json({
        user: {
            id: profileData.id,
            email: data.user?.email,
            username: profileData.username,
            displayName: profileData.display_name,
            role: profileData.role,
            createdAt: profileData.created_at
        }
    });
});

// POST /api/auth/logout - Log out the current user
/* Example response:
{
  "ok": true
}
*/
router.post('/logout', async (req, res) => {
    // Clear session cookie; token invalidation handled client-side
    res.clearCookie('session', { path: '/' })
    res.status(200).json({ ok: true })
});

export default router
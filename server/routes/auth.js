import { Router } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { TABLES } from '../db/tables.js'

// Create a router for auth-related routes
const router = Router()

// POST /api/auth/signup - Sign up a new user
router.post('/signup', async (req, res) => {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Use Supabase to create a new user
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true // auto-confirm email for simplicity
    });

    // Handle potential errors
    if (error) {
        return res.status(400).json({ error: error.message });
    }

    // Respond with minimal created user data
    res.status(201).json({ user: { id: data.user.id, email: data.user.email } });
});

// POST /api/auth/login - Log in an existing user
router.post('/login', async (req, res) => {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Use Supabase to sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    // Handle potential errors
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
    res.status(200).json({ user: { id: data.user?.id, email: data.user?.email } });
});

// POST /api/auth/logout - Log out the current user
router.post('/logout', async (req, res) => {
    // Clear session cookie; token invalidation handled client-side
    res.clearCookie('session', { path: '/' })
    res.status(200).json({ ok: true })
});

export default router
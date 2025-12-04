import { supabase } from '../db/supabaseClient.js'
import { TABLES } from '../db/tables.js'

// Middleware to verify access token from HttpOnly cookie
export async function requireAuth(req, res, next) {
    try {
        // Retrieve access token from cookies
        const accessToken = req.cookies?.session

        // If no token provided, respond with 401
        if (!accessToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify the token with Supabase and fetch user
        const { data, error } = await supabase.auth.getUser(accessToken);
        if (error || !data?.user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user info to request object for downstream handlers
        req.user = data.user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function requireAdmin(req, res, next) {
    try {
        // First ensure the user is authenticated
        await requireAuth(req, res, async () => {
            // Then check admin role
            const { data: profileData, error: profileError } = await supabase
                .from(TABLES.PROFILES)
                .select('role')
                .eq('id', req.user.id)
                .single();
            if (profileError || !profileData || profileData.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden: Admins only' });
            }
            next();
        });
    } catch (err) {
        console.error('Admin middleware error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
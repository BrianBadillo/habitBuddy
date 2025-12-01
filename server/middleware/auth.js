import { supabase } from '../db/supabaseClient.js'

// Middleware to verify access token from HttpOnly cookie
export async function requireAuth(req, res, next) {
    try {
        // Prefer Authorization: Bearer <token>; fallback to cookie 'session'
        const authHeader = req.headers.authorization || '';
        const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
        const cookieToken = req.cookies?.session
        const accessToken = bearer || cookieToken

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
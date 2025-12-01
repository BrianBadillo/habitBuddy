import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/quote - Fetch and return a normalized motivational quote from ZenQuotes
/* Example response:
{
  "text": "The secret of getting ahead is getting started.",
  "author": "Mark Twain"
}
*/
router.get('/', requireAuth, async (req, res) => {
  try {
    // Fetch quote from ZenQuotes API
    const response = await fetch('https://zenquotes.io/api/today');
    
    if (!response.ok) {
      throw new Error('Failed to fetch quote from ZenQuotes');
    }
    
    const data = await response.json();
    
    // ZenQuotes returns an array with one quote object
    // Format: [{ "q": "quote text", "a": "author name", ... }]
    if (!data || !data.length) {
      throw new Error('Invalid response from ZenQuotes');
    }
    
    const zenQuote = data[0];
    
    // Normalize the response format
    res.json({
      text: zenQuote.q,
      author: zenQuote.a
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    
    // Return a fallback quote if the external API fails
    res.json({
      text: "The secret of getting ahead is getting started.",
      author: "Mark Twain"
    });
  }
});

export default router;
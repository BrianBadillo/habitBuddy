import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import { requireAuth } from './middleware/auth.js'
import { supabase } from './db/supabaseClient.js'
import { TABLES } from './db/tables.js'
import { PET_MOOD_DOWN } from './constants.js'

import authRouter from './routes/auth.js'
import meRouter from './routes/me.js'
import habitRouter from './routes/habits.js'
import petRouter from './routes/pets.js'
import quoteRouter from './routes/quote.js'

// create the app
const app = express()
// it's nice to set the port number so it's always the same
app.set('port', process.env.PORT || 3001);
// set up some middleware to handle processing body requests
app.use(express.json())
// set up cookie parser middleware to handle HttpOnly cookies
app.use(cookieParser())
// set up some midlleware to handle cors
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

// mount auth routes
app.use('/api/auth', authRouter)
// mount profile/user routes
app.use('/api', meRouter);
// mount habit routes
app.use('/api/habits', habitRouter);
// mount pet routes
app.use('/api/pets', petRouter);
// mount quote routes
app.use('/api/quote', quoteRouter);

// base route
app.get('/', (_req, res) => {
  res.send("Welcome to the Habit Buddy API!")
})

// health check route
app.get('/up', (_req, res) => {
  res.json({status: 'up'})
})

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  // Avoid leaking internal details; return generic message
  res.status(500).json({ error: 'Internal server error' })
})

// Daily Maintenance Job
async function dailyMaintenance() {
  console.log('[Daily Maintenance] Starting daily maintenance job...');
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  try {
    // ========================================================================
    // 1. Update habit streaks for missed days
    // ========================================================================
    console.log('[Daily Maintenance] Checking for broken streaks...');
    
    // Fetch all active streaks
    const { data: streaks, error: streaksError } = await supabase
      .from(TABLES.STREAKS)
      .select('id, habit_id, user_id, current_streak, last_completed_date')
      .gt('current_streak', 0); // Only check habits with active streaks

    if (streaksError) {
      console.error('[Daily Maintenance] Error fetching streaks:', streaksError);
    } else if (streaks && streaks.length > 0) {
      // Check each streak to see if it should be reset
      for (const streak of streaks) {
        if (!streak.last_completed_date) continue;

        const lastDate = new Date(streak.last_completed_date);
        const daysSinceCompletion = Math.floor((new Date(today) - lastDate) / (1000 * 60 * 60 * 24));

        // If more than 1 day has passed, reset the streak
        if (daysSinceCompletion > 1) {
          const { error: updateError } = await supabase
            .from(TABLES.STREAKS)
            .update({ current_streak: 0 })
            .eq('id', streak.id);

          if (updateError) {
            console.error(`[Daily Maintenance] Error resetting streak ${streak.id}:`, updateError);
          } else {
            console.log(`[Daily Maintenance] Reset streak for habit ${streak.habit_id} (${daysSinceCompletion} days missed)`);
          }
        }
      }
    }

    // ========================================================================
    // 2. Find all habits that are marked "is_active" = false and reactivate them if their frequency matches today
    // ========================================================================
    console.log('[Daily Maintenance] Reactivating habits based on frequency...');

    // Fetch all inactive habits
    const { data: inactiveHabits, error: inactiveHabitsError } = await supabase
      .from(TABLES.HABITS)
      .select('id, user_id, frequency')
      .eq('is_active', false);
    if (inactiveHabitsError) {
      console.error('[Daily Maintenance] Error fetching inactive habits:', inactiveHabitsError);
    } else if (inactiveHabits && inactiveHabits.length > 0) {
      for (const habit of inactiveHabits) {
        let shouldActivate = false;
        if (habit.frequency === 'Daily') {
          shouldActivate = true;
        } else if (habit.frequency === 'Weekly') {
          const todayDay = new Date().getDay(); // 0 (Sun) to 6 (Sat)
          if (todayDay === 0) { // Reactivate weekly habits on Sundays
            shouldActivate = true;
          }
        } else if (habit.frequency === 'Monthly') {
          const todayDate = new Date().getDate(); // 1 to 31
          if (todayDate === 1) { // Reactivate monthly habits on the 1st
            shouldActivate = true;
          }
        }

        if (shouldActivate) {
          const { error: activateError } = await supabase
            .from(TABLES.HABITS)
            .update({ is_active: true })
            .eq('id', habit.id);

          if (activateError) {
            console.error(`[Daily Maintenance] Error reactivating habit ${habit.id}:`, activateError);
          }
          else {
            console.log(`[Daily Maintenance] Reactivated habit ${habit.id} based on frequency ${habit.frequency}`);
          }
        }
      }
    }

    // ========================================================================
    // 3. Decrease all pet moods by one level
    // ========================================================================
    console.log('[Daily Maintenance] Updating pet moods...');
    
    // Fetch all pets
    const { data: pets, error: petsError } = await supabase
      .from(TABLES.PETS)
      .select('id, mood, last_interaction_date');

    if (petsError) {
      console.error('[Daily Maintenance] Error fetching pets:', petsError);
    } else if (pets && pets.length > 0) {
      for (const pet of pets) {
        const newMood = PET_MOOD_DOWN[pet.mood] || pet.mood;

        const { error: moodUpdateError } = await supabase
          .from(TABLES.PETS)
          .update({ mood: newMood })
          .eq('id', pet.id);

        if (moodUpdateError) {
          console.error(`[Daily Maintenance] Error updating mood for pet ${pet.id}:`, moodUpdateError);
        } else {
          console.log(`[Daily Maintenance] Updated mood for pet ${pet.id} from ${pet.mood} to ${newMood}`);
        }
      }
    }

    console.log('[Daily Maintenance] Daily maintenance job completed.');
  } catch (error) {
    console.error('[Daily Maintenance] Unexpected error during daily maintenance:', error);
  }
}

// Schedule daily maintenance at midnight
function scheduleDailyMaintenance() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // Next midnight

  const msUntilMidnight = midnight - now;

  // Schedule first run at next midnight
  setTimeout(() => {
    dailyMaintenance();

    // Then run every 24 hours
    setInterval(dailyMaintenance, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}

// start the server
app.listen(app.get('port'), () => {
  console.log('App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');

  // Schedule subsequent daily maintenance jobs
  scheduleDailyMaintenance();
});
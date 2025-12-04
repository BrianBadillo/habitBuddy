import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import { supabase } from './db/supabaseClient.js'
import { TABLES } from './db/tables.js'
import { PET_MOOD_DOWN } from './constants.js'

import authRouter from './routes/auth.js'
import meRouter from './routes/me.js'
import habitRouter from './routes/habits.js'
import petRouter from './routes/pets.js'
import quoteRouter from './routes/quote.js'
import friendRouter from './routes/friends.js'
import leaderboardRouter from './routes/leaderboard.js'
import adminRouter from './routes/admin.js'

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
app.use('/api/pet', petRouter);
// mount quote routes
app.use('/api/quote', quoteRouter);
// mount friends routes
app.use('/api/friends', friendRouter);
// mount leaderboard routes
app.use('/api/leaderboard', leaderboardRouter);
// mount admin routes
app.use('/api/admin', adminRouter);

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

// Daily maintenance job to update streaks, habits, and pet moods
async function dailyMaintenance() {
  console.log('[Daily Maintenance] Starting daily maintenance job...');

  const now = new Date(); // current date and time
  const todayDay = now.getDay(); // 0 (Sun) to 6 (Sat)
  const todayDate = now.getDate(); // 1 to 31

  try {
    // ========================================================================
    // 1. Update habit streaks for missed days
    // ========================================================================
    console.log('[Daily Maintenance] Checking for broken streaks...');
    
    // Fetch all active streaks
    const { data: streaks, error: streaksError } = await supabase
      .from(TABLES.STREAKS)
      .select(`
        id, 
        habit_id,
        user_id,
        current_streak,
        last_completed_date,
        habit:habit_id!inner(frequency)
      `)
      .gt('current_streak', 0); // Only check habits with active streaks (greater than 0)

    if (streaksError) {
      console.error('--- [Daily Maintenance] Error fetching streaks:', streaksError);
    } else if (streaks && streaks.length > 0) {
      // Check each streak to see if it should be reset
      for (const streak of streaks) {
        if (!streak.last_completed_date) continue;

        const lastDate = new Date(streak.last_completed_date);
        const frequency = streak.habit?.frequency;
        let shouldReset = false;

        if (frequency == 'daily') {
          // Daily: reset if more than 1 day has passed
          const daysSinceCompletion = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
          if (daysSinceCompletion > 1) {
            shouldReset = true;
          }
        } else if (frequency == 'weekly') {
          // Weekly: reset only on Monday if habit wasn't completed in the past week (since last Monday)
          if (todayDay === 1) { // Monday (week starts on Monday)
            // Calculate last Monday (start of current week)
            const lastMonday = new Date(now);
            lastMonday.setDate(now.getDate() - 7); // Go back to last Monday
            lastMonday.setHours(0, 0, 0, 0);
            
            // If last completion was before last Monday, reset the streak
            if (lastDate < lastMonday) {
              shouldReset = true;
            }
          }
        } else if (frequency == 'monthly') {
          // Monthly: reset only on the 1st if habit wasn't completed in the past month
          if (todayDate === 1) {
            // Calculate first day of last month
            const firstOfLastMonth = new Date(now);
            firstOfLastMonth.setMonth(now.getMonth() - 1);
            firstOfLastMonth.setDate(1);
            firstOfLastMonth.setHours(0, 0, 0, 0);
            
            // If last completion was before the 1st of last month, reset the streak
            if (lastDate < firstOfLastMonth) {
              shouldReset = true;
            }
          }
        }

        // Reset streak if needed
        if (shouldReset) {
          const { error: updateError } = await supabase
            .from(TABLES.STREAKS)
            .update({ current_streak: 0 })
            .eq('id', streak.id);

          if (updateError) {
            console.error(`--- [Daily Maintenance] Error resetting streak ${streak.id}:`, updateError);
          } else {
            console.log(`--- [Daily Maintenance] Reset ${frequency} streak id=${streak.id} for habit_id=${streak.habit_id}, user_id=${streak.user_id}.`);
          }
        }
      }
    }

    // ========================================================================
    // 2. Reactivate habits based on their frequency
    // ========================================================================
    console.log('[Daily Maintenance] Reactivating habits based on frequency...');

    // Fetch all inactive habits
    const { data: inactiveHabits, error: inactiveHabitsError } = await supabase
      .from(TABLES.HABITS)
      .select('id, user_id, name, frequency')
      .eq('is_active', false);
    
    if (inactiveHabitsError) {
      console.error('--- [Daily Maintenance] Error fetching inactive habits:', inactiveHabitsError);
    } else if (inactiveHabits && inactiveHabits.length > 0) {
      for (const habit of inactiveHabits) {
        let shouldActivate = false;

        if (habit.frequency == 'daily') {
          // Daily habits reactivate every day
          shouldActivate = true;
        } else if (habit.frequency == 'weekly') {
          // Weekly habits reactivate on Monday (day 1)
          if (todayDay === 1) {
            shouldActivate = true;
          }
        } else if (habit.frequency == 'monthly') {
          // Monthly: reactivate only on the 1st (start of month)
          if (todayDate === 1) {
            shouldActivate = true;
          }
        }

        if (shouldActivate) {
          const { error: activateError } = await supabase
            .from(TABLES.HABITS)
            .update({ is_active: true })
            .eq('id', habit.id);

          if (activateError) {
            console.error(`--- [Daily Maintenance] Error reactivating habit ${habit.id}:`, activateError);
          } else {
            console.log(`--- [Daily Maintenance] Reactivating habit "${habit.name}", ${habit.frequency} habit (id=${habit.id}, user_id=${habit.user_id}).`);
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
      console.error('--- [Daily Maintenance] Error fetching pets:', petsError);
    } else if (pets && pets.length > 0) {
      for (const pet of pets) {
        const oldMood = pet.mood;
        const newMood = PET_MOOD_DOWN[pet.mood] || pet.mood;

        if (oldMood === newMood) {
          // Mood is already at minimum, no change
          continue;
        }

        const { error: moodUpdateError } = await supabase
          .from(TABLES.PETS)
          .update({ mood: newMood })
          .eq('id', pet.id);

        if (moodUpdateError) {
          console.error(`--- [Daily Maintenance] Error updating mood for pet ${pet.id}:`, moodUpdateError);
        } else {
          console.log(`--- [Daily Maintenance] Updated pet ${pet.id} mood: ${oldMood} -> ${newMood}.`);
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
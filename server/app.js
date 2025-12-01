import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import { requireAuth } from './middleware/auth.js'

import authRouter from './routes/auth.js'
import meRouter from './routes/me.js'
import habitRouter from './routes/habits.js'
import petRouter from './routes/pets.js'

// create the app
const app = express()
// it's nice to set the port number so it's always the same
app.set('port', process.env.PORT || 3000);
// set up some middleware to handle processing body requests
app.use(express.json())
// set up cookie parser middleware to handle HttpOnly cookies
app.use(cookieParser())
// set up some midlleware to handle cors
app.use(cors())

// mount auth routes
app.use('/api/auth', authRouter)
// mount profile/user routes
app.use('/api', meRouter);
// mount habit routes
app.use('/api/habits', habitRouter);
// mount pet routes
app.use('/api/pets', petRouter);

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

// start the server
app.listen(app.get('port'), () => {
  console.log('App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});
  
// TODO: At midnight every day, run a job to update habit streaks, habit "is_active" statuses, and pet moods if the last interaction date is older than today. (and on server start)
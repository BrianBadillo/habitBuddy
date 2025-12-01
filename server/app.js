import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import { requireAuth } from './middleware/auth.js'

import authRouter from './routes/auth.js'
import meRouter from './routes/me.js'

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

// base route
app.get('/', (_req, res) => {
  res.send("Welcome to the Habit Buddy API!")
})

// health check route
app.get('/up', (_req, res) => {
  res.json({status: 'up'})
})

// start the server
app.listen(app.get('port'), () => {
  console.log('App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});
  
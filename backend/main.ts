import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth.ts'
import wallet from './routes/wallet.ts'
import mockAuth from './routes/mock-auth.ts'
import { jwt } from "hono/jwt";

const app = new Hono()

// Configure CORS to allow requests from frontend
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://https://phonomorph-mauve.vercel.app/'], // Common Next.js ports
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'PhonoMorph is running!'
  })
})

app.use('/wallet/*', jwt(
  {
    secret: Deno.env.get('JWT_SECRET')!,
  }
))

app.route('/wallet', wallet)
app.route('/auth', auth)
app.route('/mock-auth', mockAuth)

Deno.serve(app.fetch)

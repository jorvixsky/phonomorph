import { Hono } from 'hono'
import auth from './routes/auth.ts'
import wallet from './routes/wallet.ts'
import { jwt } from "hono/jwt";

const app = new Hono()

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Phonemorph is running!'
  })
})

app.use('/wallet/*', jwt(
  {
    secret: Deno.env.get('JWT_SECRET')!,
  }
))

app.route('/wallet', wallet)
app.route('/auth', auth)

Deno.serve(app.fetch)

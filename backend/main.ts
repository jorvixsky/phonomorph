import { Hono } from 'hono'
import auth from './routes/auth.ts'

const app = new Hono()

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Phonemorph is running!'
  })
})

// Mount phone routes
app.route('/auth', auth)

Deno.serve(app.fetch)

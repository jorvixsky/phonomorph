import { Hono } from 'hono'
import { sign } from 'hono/jwt'

const mockAuth = new Hono()

mockAuth.get('/send', (c) => {
  const { phoneNumber } = c.req.query()

  if (!phoneNumber) {
    return c.json({ error: 'Phone number is required' }, 400)
  }

  return c.json({
    message: 'Mock verification sent',
  })
})

mockAuth.get('/verify', async (c) => {
  const { phoneNumber, code } = c.req.query()

  if (!phoneNumber || !code) {
    return c.json({ error: 'Phone number and code are required' }, 400)
  }

  const token = await sign({
    aud: 'https://phonomorph.com',
    sub: phoneNumber,
    exp: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).getTime() / 1000,
  }, Deno.env.get('JWT_SECRET')!)

  return c.json({ token })
})

export default mockAuth
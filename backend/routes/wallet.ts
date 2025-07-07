import { Hono } from 'hono'
import { verify } from 'hono/jwt'

const wallet = new Hono()

wallet.get('/me', async (c) => {
  const { sub } = await verify(c.req.header('Authorization')?.split(' ')[1]!, Deno.env.get('JWT_SECRET')!)

  return c.json({ phoneNumber: sub })
})
export default wallet
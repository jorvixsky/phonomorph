import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import twilio from 'twilio'

const twilioClient = twilio(Deno.env.get('TWILIO_SID')!, Deno.env.get('TWILIO_AUTH_TOKEN')!)

const auth = new Hono()

auth.get('/send', async (c) => {
  const { phoneNumber } = c.req.query()

  if (!phoneNumber) {
    return c.json({ error: 'Phone number is required' }, 400)
  }

  const verification = await twilioClient.verify.v2.services(Deno.env.get('TWILIO_SERVICE_SID')!).verifications.create({
    to: phoneNumber,
    channel: 'sms'
  })

  return c.json(verification)
})

auth.get('/verify', async (c) => {
  const { phoneNumber, code } = c.req.query()

  if (!phoneNumber || !code) {
    return c.json({ error: 'Phone number and code are required' }, 400)
  }

  const verification = await twilioClient.verify.v2
  .services(Deno.env.get('TWILIO_SERVICE_SID')!)
  .verificationChecks.create({
    code: code,
    to: phoneNumber,
  });

  if (verification.status !== 'approved') {
    return c.json({ error: 'Invalid code' }, 400)
  }

  const token = await sign({
    aud: 'https://phonemorph.com',
    sub: phoneNumber,
    exp: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).getTime() / 1000,
  }, Deno.env.get('JWT_SECRET')!)

  return c.json({ token })
})

auth.get('/mock-verify', async (c) => {
  const { phoneNumber, code } = c.req.query()

  if (!phoneNumber || !code) {
    return c.json({ error: 'Phone number and code are required' }, 400)
  }

  const token = await sign({
    aud: 'https://phonemorph.com',
    sub: phoneNumber,
    exp: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).getTime() / 1000,
  }, Deno.env.get('JWT_SECRET')!)

  return c.json({ token })
})

export default auth
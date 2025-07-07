import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { generateMnemonic, privateKeyToAccount } from 'npm:viem/accounts'

interface Wallet {
    phone_number: string;
    private_key: string;
    public_key: string;
}

const db = new Client({
    user: Deno.env.get('PGUSER')!,
    database: Deno.env.get('PGDATABASE')!,
    hostname: Deno.env.get('PGHOST')!,
    port: Deno.env.get('PGPORT')!,
    password: Deno.env.get('PGPASSWORD')!,
})

const wallet = new Hono()

wallet.get('/me', async (c) => {
  const { sub } = await verify(c.req.header('Authorization')?.split(' ')[1]!, Deno.env.get('JWT_SECRET')!)

  return c.json({ phoneNumber: sub })
})

wallet.get('/create', async (c) => {
    try {
        const { sub } = await verify(c.req.header('Authorization')?.split(' ')[1]!, Deno.env.get('JWT_SECRET')!)

        await db.connect()

        const result = await db.queryObject<Wallet>(`
            SELECT * FROM public.wallets WHERE phone_number = $1
        `, [sub])

        if (result.rows.length !== 0) {
            return c.json({ error: 'Account has already been created' }, 400)
        }

        const mnemonic = generateMnemonic()
        const address = mnemonicToAccount(mnemonic).address


        await db.queryObject(`
            INSERT INTO public.wallets (phone_number, mnemonic, address) VALUES ($1, $2, $3)
        `, [sub, mnemonic, address])

        return c.json({ address })
    } catch (error) {
        console.error(error)
        return c.json({ error: 'Internal server error' }, 500)
    } finally {
        await db.end()
    }
})

wallet.get('/get', async (c) => {
    try {
        const { sub } = await verify(c.req.header('Authorization')?.split(' ')[1]!, Deno.env.get('JWT_SECRET')!)

        await db.connect()

        const result = await db.queryObject<Wallet>(`
            SELECT * FROM public.wallets WHERE phone_number = $1
        `, [sub])

        if (result.rows.length === 0) {
            return c.json({ error: 'Wallet not found' }, 404)
        }

        return c.json({ publicKey: result.rows[0].public_key, privateKey: result.rows[0].private_key })
    } catch (error) {
        console.error(error)
        return c.json({ error: 'Internal server error' }, 500)
    } finally {
        await db.end()
    }
})

export default wallet
import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { english, generateMnemonic, mnemonicToAccount } from 'npm:viem/accounts'
import { morphHolesky, morphismUSDT } from '../lib/chain.ts'
import { createWalletClient, createPublicClient, http, parseUnits, getAddress, formatEther } from 'npm:viem'

interface Wallet {
    phone_number: string;
    mnemonic: string;
    address: string;
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

        const mnemonic = generateMnemonic(english)
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

        return c.json({ address: result.rows[0].address })
    } catch (error) {
        console.error(error)
        return c.json({ error: 'Internal server error' }, 500)
    } finally {
        await db.end()
    }
})

wallet.post('/import-address', async (c) => {
    try {
        const { sub } = await verify(c.req.header('Authorization')?.split(' ')[1]!, Deno.env.get('JWT_SECRET')!)

        const { mnemonic } = await c.req.json()

        const address = mnemonicToAccount(mnemonic).address

        await db.queryObject(`
            INSERT INTO public.wallets (phone_number, mnemonic, address) VALUES ($1, $2, $3)
        `, [sub, mnemonic, address])

        return c.json({ address })
    } catch (error) {
        console.error(error)
        return c.json({ error: 'Internal server error' }, 500)
    }
})

wallet.post('/send', async (c) => {
    try {
        const { sub } = await verify(c.req.header('Authorization')?.split(' ')[1]!, Deno.env.get('JWT_SECRET')!)

        const { recipient, amount } = await c.req.json()

        if (!recipient || !amount) {
            return c.json({ error: 'Recipient phone number and amount are required' }, 400)
        }

        const phoneRegex = /^\+\d{10,15}$/
        if (!phoneRegex.test(recipient)) {
            return c.json({ error: 'Invalid phone number format. Please use format: +1234567890' }, 400)
        }

        const parsedAmount = parseFloat(amount)
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return c.json({ error: 'Invalid amount' }, 400)
        }

        await db.connect()

        const senderResult = await db.queryObject<Wallet>(`
            SELECT * FROM public.wallets WHERE phone_number = $1
        `, [sub])

        if (senderResult.rows.length === 0) {
            return c.json({ error: 'Sender wallet not found' }, 404)
        }

        if (sub === recipient) {
            return c.json({ error: 'Cannot send to your own phone number' }, 400)
        }

        const recipientResult = await db.queryObject<Wallet>(`
            SELECT * FROM public.wallets WHERE phone_number = $1
        `, [recipient])

        if (recipientResult.rows.length === 0) {
            return c.json({ error: 'Recipient wallet not found. Make sure they have created a wallet.' }, 404)
        }

        const senderWallet = senderResult.rows[0]
        const recipientWallet = recipientResult.rows[0]

        const account = mnemonicToAccount(senderWallet.mnemonic)
        const walletClient = createWalletClient({
            account,
            chain: morphHolesky,
            transport: http()
        })

        // Create public client to check ETH balance
        const publicClient = createPublicClient({
            chain: morphHolesky,
            transport: http()
        })

        // Check ETH balance for gas fees
        const ethBalance = await publicClient.getBalance({
            address: getAddress(senderWallet.address)
        })

        // Minimum ETH required for gas fees (approximately 0.001 ETH)
        const minEthForGas = parseUnits('0.001', 18)

        if (ethBalance < minEthForGas) {
            return c.json({
                error: `Insufficient ETH balance for gas fees. You need at least ${formatEther(minEthForGas)} ETH to send USDT tokens. Current ETH balance: ${formatEther(ethBalance)} ETH`
            }, 400)
        }

        // Send USDT token to recipient's address
        const hash = await walletClient.writeContract({
            address: getAddress(morphismUSDT.address),
            abi: [
                {
                    constant: false,
                    inputs: [
                        { name: '_to', type: 'address' },
                        { name: '_value', type: 'uint256' }
                    ],
                    name: 'transfer',
                    outputs: [{ name: '', type: 'bool' }],
                    type: 'function',
                },
            ],
            functionName: 'transfer',
            args: [
                getAddress(recipientWallet.address),
                parseUnits(amount.toString(), morphismUSDT.decimals)
            ]
        })

        return c.json({
            hash,
            message: 'Transaction sent successfully',
            recipientAddress: recipientWallet.address
        })

    } catch (error) {
        console.error('Error sending transaction:', error)
        return c.json({ error: 'Failed to send transaction' }, 500)
    } finally {
        await db.end()
    }
})

export default wallet
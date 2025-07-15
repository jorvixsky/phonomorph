'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SendTransaction from '@/components/wallet/send-transaction'
import { getAuthToken, isAuthenticated, getWalletAddress } from '@/lib/utils'
import { createPublicClient, http, formatUnits, formatEther } from 'viem'
import { wagmiConfig, morphismUSDT } from '@/lib/wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'

export default function SendPage() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [balance, setBalance] = useState<string>('')
  const [ethBalance, setEthBalance] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  // Create public client for reading balance
  const publicClient = createPublicClient({
    chain: wagmiConfig.chains[0], // Use the configured chain (Morph Holesky)
    transport: http()
  })

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/')
      return
    }

    loadWalletData()
  }, [router])

  const loadWalletData = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // Get JWT token
      const token = getAuthToken()
      
      if (!token) {
        setError('Authentication required. Please log in again.')
        return
      }

      // First try to get wallet address from localStorage
      const storedAddress = getWalletAddress()
      if (storedAddress) {
        setWalletAddress(storedAddress)
        await fetchBalance(storedAddress)
      } else {
        // If not in localStorage, fetch from backend
        const response = await fetch('http://localhost:8000/wallet/get', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.status === 404) {
          // No wallet found - redirect to dashboard
          router.push('/dashboard')
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch wallet data')
        }

        const data = await response.json()
        setWalletAddress(data.address)
        await fetchBalance(data.address)
      }
    } catch (err) {
      console.error('Error loading wallet data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load wallet data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBalance = async (address: string) => {
    try {
      // Get USDT token balance and ETH balance in parallel
      const [usdtBalance, ethBalanceResult] = await Promise.all([
        publicClient.readContract({
          address: morphismUSDT.address as `0x${string}`,
          abi: [
            {
              constant: true,
              inputs: [{ name: '_owner', type: 'address' }],
              name: 'balanceOf',
              outputs: [{ name: 'balance', type: 'uint256' }],
              type: 'function',
            },
          ],
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        }),
        publicClient.getBalance({
          address: address as `0x${string}`
        })
      ])
      
      const formattedUsdtBalance = formatUnits(usdtBalance as bigint, morphismUSDT.decimals)
      const formattedEthBalance = formatEther(ethBalanceResult)
      
      setBalance(formattedUsdtBalance)
      setEthBalance(formattedEthBalance)
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance('0.00')
      setEthBalance('0.00')
    }
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading wallet data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={loadWalletData} variant="outline">
              Try Again
            </Button>
            <Button onClick={handleBack}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!walletAddress) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>No Wallet Found</CardTitle>
              <CardDescription>
                You need to create a wallet before you can send transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Send Transaction</h1>
          <p className="text-muted-foreground">
            Send USDT to another user by phone number
          </p>
        </div>

        {/* Send Transaction Component */}
        <SendTransaction
          walletAddress={walletAddress}
          currentBalance={balance}
          ethBalance={ethBalance}
          onCancel={handleBack}
        />
      </div>
    </div>
  )
} 
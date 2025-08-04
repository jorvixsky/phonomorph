'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Sparkles, Wallet, ArrowRight, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAuthToken, isAuthenticated, setWalletAddress } from '@/lib/utils'

interface CreateWalletProps {
  onCancel?: () => void
}

export default function CreateWallet({ onCancel }: CreateWalletProps) {
  const [walletData, setWalletData] = useState<{ address: string } | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/')
    }
  }, [router])

  const createWallet = async () => {
    try {
      setIsCreating(true)
      setError('')
      
      // Get JWT token using the utility function
      const token = getAuthToken()
      
      if (!token) {
        setError('Authentication required. Please log in again.')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/wallet/create`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create wallet')
      }

      const data = await response.json()
      
      // Store wallet data (address) - the server handles the mnemonic securely
      setWalletData({
        address: data.address
      })

      // Store address in localStorage for easy access
      setWalletAddress(data.address)
      
    } catch (err) {
      console.error('Error creating wallet:', err)
      setError(err instanceof Error ? err.message : 'Failed to create wallet')
    } finally {
      setIsCreating(false)
    }
  }

  const handleContinue = () => {
    // Navigate back to dashboard to see the wallet
    router.push('/dashboard')
  }

  if (walletData) {
    // Success state - wallet created
    return (
      <div className="w-full max-w-lg mx-auto">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500 rounded-full p-3">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="flex items-center justify-center gap-2 text-green-800 dark:text-green-300">
              <Sparkles className="h-5 w-5" />
              Wallet Created Successfully!
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-400">
              Your digital wallet is ready to use. You can now send and receive payments!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <span className="font-medium">Your Wallet Address:</span>
                </div>
                <div className="bg-muted p-3 rounded border font-mono text-sm break-all">
                  {walletData.address}
                </div>
                <p className="text-xs text-muted-foreground">
                  This is your unique wallet address. You can share this with others to receive payments.
                </p>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Your wallet is secure!</p>
                  <p className="text-sm">We&apos;ve taken care of all the technical details. Your wallet is protected and only accessible with your phone number.</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button onClick={handleContinue} className="w-full" size="lg">
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to My Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Initial state - ready to create wallet
  return (
    <div className="w-full max-w-lg mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Create Your Digital Wallet
          </CardTitle>
          <CardDescription>
            We&apos;ll set up everything for you in seconds. No technical knowledge required!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 rounded-full p-1 mt-0.5">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  What happens when you create your wallet:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <li>✨ We generate a unique wallet address for you</li>
                  <li>🔒 Your wallet is secured with advanced encryption</li>
                  <li>📱 Access it anytime with your phone number</li>
                  <li>💰 Start sending and receiving payments immediately</li>
                  <li>🚀 No downloads or complicated setup required</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={createWallet}
              className="w-full"
              size="lg"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Your Wallet...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create My Wallet Now
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onCancel}
                disabled={isCreating}
              >
                Back to Options
              </Button>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By creating a wallet, you agree that we&apos;ll securely manage your wallet&apos;s technical details while giving you full control of your funds.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
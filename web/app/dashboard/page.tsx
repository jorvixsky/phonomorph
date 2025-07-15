'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Download, Key, Wallet, ChevronDown, ChevronUp, Users, CheckCircle, Sparkles, Shield, AlertCircle, ArrowRight, RefreshCw, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAuthToken, isAuthenticated, getWalletAddress, setWalletAddress } from '@/lib/utils'
import { createPublicClient, http, formatUnits, formatEther } from 'viem'
import { wagmiConfig, morphismUSDT } from '@/lib/wagmi'

interface WalletStatus {
  exists: boolean
  address?: string
  loading: boolean
  error?: string
  balance?: string
  ethBalance?: string
  balanceLoading?: boolean
}

export default function Dashboard() {
  const [walletStatus, setWalletStatus] = useState<WalletStatus>({
    exists: false,
    loading: true
  })
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [creationError, setCreationError] = useState('')
  const [justCreated, setJustCreated] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  // Create public client for reading balance
  const publicClient = createPublicClient({
    chain: wagmiConfig.chains[0], // Use the configured chain (Morph Holesky)
    transport: http()
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  useEffect(() => {
    if (isMounted) {
      checkWalletExists()
    }
  }, [isMounted])

  const fetchBalance = useCallback(async (address: string) => {
    try {
      setWalletStatus(prev => ({ ...prev, balanceLoading: true }))
      
      // Get USDT token balance and ETH balance in parallel
      const [usdtBalance, ethBalance] = await Promise.all([
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
      const formattedEthBalance = formatEther(ethBalance)
      
      setWalletStatus(prev => ({ 
        ...prev, 
        balance: formattedUsdtBalance,
        ethBalance: formattedEthBalance,
        balanceLoading: false 
      }))
    } catch (error) {
      console.error('Error fetching balance:', error)
      setWalletStatus(prev => ({ 
        ...prev, 
        balance: '0.00',
        ethBalance: '0.00',
        balanceLoading: false 
      }))
    }
  }, [publicClient])

  const checkWalletExists = useCallback(async () => {
    try {
      setWalletStatus(prev => ({ ...prev, loading: true, error: undefined }))
      
      // Check if user is authenticated
      if (!isAuthenticated()) {
        router.push('/')
        return
      }
      
      // Get JWT token using the utility function
      const token = getAuthToken()
      
      if (!token) {
        setWalletStatus({
          exists: false,
          loading: false,
          error: 'No authentication token found'
        })
        return
      }

      const response = await fetch('http://localhost:8000/wallet/get', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 404) {
        // Check if we have a locally stored address
        const storedAddress = getWalletAddress()
        if (storedAddress) {
          setWalletStatus({
            exists: true,
            loading: false,
            address: storedAddress
          })
          // Fetch balance for stored address
          await fetchBalance(storedAddress)
        } else {
          // No wallet found - show creation options
          setWalletStatus({
            exists: false,
            loading: false
          })
        }
      } else if (response.ok) {
        const data = await response.json()
        // Store address in localStorage for offline access
        console.log('data', data)
        if (data.address) {
          setWalletAddress(data.address)
        }
        setWalletStatus({
          exists: true,
          loading: false,
          address: data.address
        })
        // Fetch balance for existing wallet
        if (data.address) {
          await fetchBalance(data.address)
        }
      } else {
        throw new Error(`Wallet check failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error checking wallet:', error)
      setWalletStatus({
        exists: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  }, [router, fetchBalance])

  const handleCreateWallet = async () => {
    try {
      setIsCreatingWallet(true)
      setCreationError('')
      
      // Get JWT token using the utility function
      const token = getAuthToken()
      
      if (!token) {
        setCreationError('Authentication required. Please log in again.')
        return
      }

      const response = await fetch('http://localhost:8000/wallet/create', {
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
      
      // Store address in localStorage for easy access
      setWalletAddress(data.address)
      
      // Set just created flag and update wallet status
      setJustCreated(true)
      setWalletStatus({
        exists: true,
        loading: false,
        address: data.address
      })
      
      // Fetch balance for the new wallet
      await fetchBalance(data.address)
      
    } catch (err) {
      console.error('Error creating wallet:', err)
      setCreationError(err instanceof Error ? err.message : 'Failed to create wallet')
    } finally {
      setIsCreatingWallet(false)
    }
  }

  const handleGetStarted = () => {
    setJustCreated(false)
  }

  const handleRefreshBalance = () => {
    if (walletStatus.address) {
      fetchBalance(walletStatus.address)
    }
  }

  const handleImportMnemonic = () => {
    router.push('/dashboard/wallet/import/mnemonic')
  }

  const handleImportPrivateKey = () => {
    router.push('/dashboard/wallet/import/private-key')
  }

  if (walletStatus.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking wallet status...</p>
        </div>
      </div>
    )
  }

  if (walletStatus.error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive text-lg font-medium">Error</div>
          <p className="text-muted-foreground">{walletStatus.error}</p>
          <Button onClick={checkWalletExists} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (walletStatus.exists && justCreated) {
    // Show wallet creation celebration
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500 rounded-full p-3">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Your Wallet is Ready!
            </h1>
            <p className="text-muted-foreground text-lg">
              Your digital wallet is active and ready to use for payments and transactions.
            </p>
            <Button onClick={handleGetStarted}>
              Let&apos;s Get Started!
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (walletStatus.exists) {
    // Show existing wallet with balance
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Your Wallet Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your digital wallet and view your balance
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Balance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Balance
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshBalance}
                    disabled={walletStatus.balanceLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${walletStatus.balanceLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-3xl font-bold">
                      {walletStatus.balanceLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          Loading...
                        </div>
                      ) : (
                        `${parseFloat(walletStatus.balance || '0').toFixed(4)} USDT`
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Morphism USDT (Morph Holesky)
                    </p>
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-lg font-semibold">
                      {walletStatus.balanceLoading ? (
                        'Loading...'
                      ) : (
                        `${parseFloat(walletStatus.ethBalance || '0').toFixed(6)} ETH`
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      For transaction fees
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Address Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Address
                </CardTitle>
                <CardDescription>
                  Share this address to receive payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded border font-mono text-sm break-all">
                    {walletStatus.address}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(walletStatus.address || '')}
                    className="w-full"
                  >
                    Copy Address
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center">
            <Button
              onClick={() => router.push('/dashboard/wallet/send')}
              className="flex items-center gap-2"
              size="lg"
            >
              <Send className="h-5 w-5" />
              Send Transaction
            </Button>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Your wallet is secure!</p>
                <p className="text-sm">
                  This is a testnet wallet for development purposes. Your funds are protected and only accessible with your phone number.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // No wallet found - show creation options
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
                      <h1 className="text-3xl font-bold">Welcome! Let&apos;s Set Up Your Wallet</h1>
          <p className="text-muted-foreground text-lg">
            We&apos;ll create a secure digital wallet for you in just one click. It&apos;s completely free and takes seconds.
          </p>
        </div>

        {/* Primary Option - Create New Wallet */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Plus className="h-6 w-6 text-primary" />
              Create Your Wallet
            </CardTitle>
            <CardDescription className="text-base">
              The easiest way to get started. We&apos;ll handle all the technical details for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-gray-950 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-1">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">What you&apos;ll get:</h4>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2 ml-8">
                <li>✨ A unique wallet address generated instantly</li>
                <li>🔒 Advanced encryption and security</li>
                <li>📱 Access anytime with your phone number</li>
                <li>💰 Send and receive payments immediately</li>
                <li>🚀 No downloads or complicated setup</li>
              </ul>
            </div>

            {creationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{creationError}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={handleCreateWallet} 
              className="w-full" 
              size="lg"
              disabled={isCreatingWallet}
            >
              {isCreatingWallet ? (
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
          </CardContent>
        </Card>

        {/* Advanced Options - Collapsible */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            <Users className="h-4 w-4" />
            Advanced user? Import your existing wallet
            {showAdvancedOptions ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showAdvancedOptions && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Download className="h-5 w-5 text-blue-500" />
                    Import with Recovery Phrase
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Restore your wallet using a 12 or 24-word recovery phrase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleImportMnemonic} 
                    variant="outline" 
                    className="w-full"
                  >
                    Import Recovery Phrase
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Key className="h-5 w-5 text-orange-500" />
                    Import with Private Key
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Import your wallet using a private key string
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleImportPrivateKey} 
                    variant="outline" 
                    className="w-full"
                  >
                    Import Private Key
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Simple FAQ */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-medium">Frequently Asked Questions</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Is it safe?</p>
                  <p className="text-muted-foreground">Yes! Your wallet is secured with industry-standard encryption and only you have access to your funds.</p>
                </div>
                <div>
                  <p className="font-medium">Is it free?</p>
                  <p className="text-muted-foreground">Absolutely! Creating a wallet is completely free. You only pay network fees when making transactions.</p>
                </div>
                <div>
                  <p className="font-medium">Do I need to remember any passwords?</p>
                  <p className="text-muted-foreground">No! We handle the technical details securely. You just need to log in with your phone number.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
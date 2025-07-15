'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Send, CheckCircle, AlertCircle, ArrowRight, Loader2, Clock, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAuthToken, isAuthenticated } from '@/lib/utils'

interface SendTransactionProps {
  walletAddress?: string
  currentBalance?: string
  onCancel?: () => void
}

export default function SendTransaction({ walletAddress, currentBalance, onCancel }: SendTransactionProps) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [transactionHash, setTransactionHash] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [recipientError, setRecipientError] = useState('')
  const [amountError, setAmountError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/')
    }
  }, [router])

  const validateRecipient = (phoneNumber: string) => {
    if (!phoneNumber) {
      setRecipientError('')
      return false
    }

    // Basic phone number validation (must start with + and have 10-15 digits)
    const phoneRegex = /^\+\d{10,15}$/
    if (!phoneRegex.test(phoneNumber)) {
      setRecipientError('Invalid phone number format. Please use format: +1234567890')
      return false
    }

    setRecipientError('')
    return true
  }

  const validateAmount = (value: string) => {
    if (!value) {
      setAmountError('')
      return false
    }

    const parsedAmount = parseFloat(value)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Amount must be greater than 0')
      return false
    }

    if (currentBalance && parsedAmount > parseFloat(currentBalance)) {
      setAmountError('Insufficient balance')
      return false
    }

    setAmountError('')
    return true
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '')
    
    // Ensure it starts with + if there are digits
    if (cleaned.length > 0 && !cleaned.startsWith('+')) {
      return '+' + cleaned
    }
    
    return cleaned
  }

  const handleRecipientChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    setRecipient(formatted)
    validateRecipient(formatted)
    if (error) setError('')
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    validateAmount(value)
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateRecipient(recipient) || !validateAmount(amount)) {
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Get JWT token
      const token = getAuthToken()
      
      if (!token) {
        setError('Authentication required. Please log in again.')
        return
      }

      const response = await fetch('http://localhost:8000/wallet/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient,
          amount
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send transaction')
      }

      const data = await response.json()
      setTransactionHash(data.hash)
      setRecipientAddress(data.recipientAddress)
      setSuccess('Transaction sent successfully!')
      
      // Clear form
      setRecipient('')
      setAmount('')
      
    } catch (err) {
      console.error('Error sending transaction:', err)
      setError(err instanceof Error ? err.message : 'Failed to send transaction')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMaxAmount = () => {
    if (currentBalance) {
      // For USDT tokens, we can send the full balance
      const maxSendable = parseFloat(currentBalance)
      setAmount(maxSendable.toString())
      validateAmount(maxSendable.toString())
    }
  }

  const isFormValid = recipient && amount && !recipientError && !amountError && !isLoading

  if (success && transactionHash) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500 rounded-full p-3">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-xl text-green-700">Money Sent!</CardTitle>
             <CardDescription>
              Your payment has been sent to {recipient}
             </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    ${parseFloat(amount).toFixed(2)}
                   </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Sent to {recipient}
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your payment has been sent successfully!
                </p>
                <p className="text-xs text-muted-foreground">
                  The recipient will receive it shortly.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
                             <Button
                 variant="outline"
                 onClick={() => {
                   setSuccess('')
                   setTransactionHash('')
                   setRecipientAddress('')
                 }}
                 className="flex-1"
               >
                Send Again
               </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Transaction
          </CardTitle>
          <CardDescription>
            Send money to another user by phone number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recipient Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Phone Number</Label>
              <Input
                id="recipient"
                type="tel"
                placeholder="+1234567890"
                value={recipient}
                onChange={(e) => handleRecipientChange(e.target.value)}
                className={recipientError ? 'border-destructive' : ''}
              />
              {!recipientError && recipient.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Enter the phone number with country code (e.g., +1234567890)
                </p>
              )}
              {recipientError && (
                <p className="text-sm text-destructive">{recipientError}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="amount">Amount ($)</Label>
                {currentBalance && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxAmount}
                    className="h-auto p-0 text-xs"
                  >
                    Max: ${parseFloat(currentBalance).toFixed(2)}
                  </Button>
                )}
              </div>
              <Input
                id="amount"
                type="number"
                step="0.000001"
                placeholder="10.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={amountError ? 'border-destructive' : ''}
              />
              {amountError && (
                <p className="text-sm text-destructive">{amountError}</p>
              )}
            </div>

            {/* Current Balance Display */}
            {currentBalance && (
              <div className="bg-muted p-3 rounded text-center">
                <p className="text-sm text-muted-foreground">
                  Available Balance
                </p>
                <p className="text-lg font-semibold">
                  ${parseFloat(currentBalance).toFixed(2)}
                </p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}



            {/* Action Buttons */}
            <div className="flex gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!isFormValid}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                      Send Money
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
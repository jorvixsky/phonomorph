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
  ethBalance?: string
  onCancel?: () => void
}

export default function SendTransaction({ walletAddress, currentBalance, ethBalance, onCancel }: SendTransactionProps) {
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
      // For USDT tokens, we can send the full balance (gas fees are paid in ETH)
      const maxSendable = parseFloat(currentBalance)
      setAmount(maxSendable.toString())
      validateAmount(maxSendable.toString())
    }
  }

  const hasLowEthBalance = ethBalance && parseFloat(ethBalance) < 0.001
  const isFormValid = recipient && amount && !recipientError && !amountError && !isLoading && !hasLowEthBalance

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
                         <CardTitle className="text-xl text-green-700">Transaction Sent!</CardTitle>
             <CardDescription>
               Your transaction has been sent to {recipient}
             </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                         <div className="space-y-2">
               <Label>Transaction Hash</Label>
               <div className="bg-muted p-3 rounded border font-mono text-sm break-all">
                 {transactionHash}
               </div>
               <div className="flex gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => navigator.clipboard.writeText(transactionHash)}
                   className="flex-1"
                 >
                   Copy Hash
                 </Button>
                                    <Button
                     variant="outline"
                     size="sm"
                     onClick={() => window.open(`https://explorer-holesky.morphl2.io/tx/${transactionHash}`, '_blank')}
                     className="flex-1"
                   >
                     <ExternalLink className="h-4 w-4 mr-1" />
                     View on Explorer
                   </Button>
               </div>
             </div>
            
                         <div className="space-y-3">
               <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                 <div className="flex items-center gap-3 mb-3">
                   <div className="bg-blue-500 rounded-full p-1">
                     <Clock className="h-4 w-4 text-white" />
                   </div>
                   <div>
                     <h4 className="font-medium text-blue-900 dark:text-blue-100">
                       Transaction Status: Pending
                     </h4>
                     <p className="text-sm text-blue-700 dark:text-blue-300">
                       Your transaction is being processed on the blockchain
                     </p>
                   </div>
                 </div>
                 <div className="space-y-2 text-sm">
                   <div className="flex justify-between">
                     <span className="text-blue-700 dark:text-blue-300">Amount:</span>
                     <span className="font-mono text-blue-900 dark:text-blue-100">{amount} USDT</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-blue-700 dark:text-blue-300">To Phone:</span>
                     <span className="font-mono text-blue-900 dark:text-blue-100">{recipient}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-blue-700 dark:text-blue-300">To Address:</span>
                     <span className="font-mono text-blue-900 dark:text-blue-100 break-all">{recipientAddress}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-blue-700 dark:text-blue-300">Token:</span>
                     <span className="text-blue-900 dark:text-blue-100">Morphism USDT</span>
                   </div>
                 </div>
               </div>
             </div>

             <Alert>
               <Clock className="h-4 w-4" />
               <AlertDescription>
                 <div className="space-y-1">
                   <p className="font-medium">Transaction submitted successfully!</p>
                   <p className="text-sm">
                     Your transaction has been sent to <strong>{recipient}</strong> and may take a few minutes to confirm on the blockchain. You can track its progress using the transaction hash above.
                   </p>
                 </div>
               </AlertDescription>
             </Alert>

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
                 Send Another
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
            Send USDT to another user by phone number
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
                <Label htmlFor="amount">Amount (USDT)</Label>
                {currentBalance && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxAmount}
                    className="h-auto p-0 text-xs"
                  >
                    Max: {parseFloat(currentBalance).toFixed(4)} USDT
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
              <div className="bg-muted p-3 rounded space-y-2">
                <p className="text-sm text-muted-foreground">
                  USDT Balance: <span className="font-mono">{parseFloat(currentBalance).toFixed(4)} USDT</span>
                </p>
                {ethBalance && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      ETH Balance: <span className="font-mono">{parseFloat(ethBalance).toFixed(6)} ETH</span>
                    </p>
                    {parseFloat(ethBalance) < 0.001 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        ⚠️ Low ETH balance - you may need more ETH for transaction fees
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Low ETH Balance Warning */}
            {hasLowEthBalance && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Insufficient ETH for transaction fees</p>
                    <p className="text-sm">
                      You need at least 0.001 ETH to send USDT tokens. Please add ETH to your wallet first.
                    </p>
                  </div>
                </AlertDescription>
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
                ) : hasLowEthBalance ? (
                  <>
                    Insufficient ETH for fees
                  </>
                ) : (
                  <>
                    Send Transaction
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
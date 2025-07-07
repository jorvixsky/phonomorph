'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { mnemonicToAccount } from 'viem/accounts'
import { AlertCircle, CheckCircle, Eye, EyeOff, Shield, Download, Info } from 'lucide-react'
import { getAuthToken, isAuthenticated } from '@/lib/utils'

interface ImportMnemonicProps {
  onImport?: (mnemonic: string) => void
  onCancel?: () => void
}

export default function ImportMnemonic({ onImport, onCancel }: ImportMnemonicProps) {
  const [mnemonic, setMnemonic] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/')
    }
  }, [router])

  const validateMnemonic = (phrase: string): boolean => {
    try {
      const words = phrase.trim().split(/\s+/)
      
      if (words.length === 1 && words[0] === '') {
        setValidationState('idle')
        setError('')
        return false
      }
      
      if (words.length !== 12 && words.length !== 24) {
        setError('Mnemonic phrase must be exactly 12 or 24 words')
        setValidationState('invalid')
        return false
      }
      
      // Try to create an account from the mnemonic to validate it
      mnemonicToAccount(phrase)
      
      setError('')
      setValidationState('valid')
      return true
    } catch {
      setError('Invalid mnemonic phrase. Please check your words and try again.')
      setValidationState('invalid')
      return false
    }
  }

  const handleMnemonicChange = (value: string) => {
    setMnemonic(value)
    if (value.trim()) {
      validateMnemonic(value.trim())
    } else {
      setError('')
      setValidationState('idle')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!mnemonic.trim()) {
      setError('Please enter your mnemonic phrase')
      return
    }

    if (!validateMnemonic(mnemonic.trim())) {
      return
    }

    setIsLoading(true)
    try {
      // Get auth token and call import API
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch('http://localhost:8000/wallet/import-address', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mnemonic: mnemonic.trim() })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to import wallet')
      }

      // Success - redirect to dashboard or call onImport
      if (onImport) {
        await onImport(mnemonic.trim())
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import wallet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const cleanedText = pastedText.replace(/\s+/g, ' ').trim()
    setMnemonic(cleanedText)
    if (cleanedText) {
      validateMnemonic(cleanedText)
    }
  }

  const wordCount = mnemonic.trim() ? mnemonic.trim().split(/\s+/).length : 0
  const isValid = validationState === 'valid'

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Download className="h-5 w-5" />
            Import Wallet
          </CardTitle>
          <CardDescription>
            Enter your 12 or 24-word recovery phrase to restore your wallet
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="mnemonic" className="text-base font-medium">
                  Recovery Phrase
                </Label>
                <div className="flex items-center gap-2">
                  <Badge variant={wordCount === 0 ? 'secondary' : wordCount === 12 || wordCount === 24 ? 'default' : 'destructive'}>
                    {wordCount}/24 words
                  </Badge>
                  {isValid && (
                    <Badge>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <Textarea
                  id="mnemonic"
                  value={mnemonic}
                  onChange={(e) => handleMnemonicChange(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Enter your recovery phrase..."
                  className={`min-h-[120px] resize-none transition-all ${
                    isVisible ? 'font-mono' : 'font-sans'
                  } ${
                    validationState === 'invalid' 
                      ? 'border-destructive focus-visible:ring-destructive/20' 
                      : validationState === 'valid' 
                        ? 'border-green-500 focus-visible:ring-green-500/20'
                        : ''
                  } ${
                    !isVisible 
                      ? 'text-transparent selection:bg-transparent' 
                      : ''
                  }`}
                  style={{
                    textShadow: !isVisible ? '0 0 8px rgba(0,0,0,0.5)' : 'none',
                  }}
                  aria-invalid={validationState === 'invalid'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-3 right-3 h-8 w-8 p-0"
                  onClick={() => setIsVisible(!isVisible)}
                >
                  {isVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
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
                type="submit"
                className="w-full"
                size="lg"
                disabled={!mnemonic.trim() || validationState !== 'valid' || isLoading}
              >
                {isLoading ? 'Importing Wallet...' : 'Import Wallet'}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>

        <CardFooter className="border-t">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Security Guidelines:</p>
                <ul className="space-y-1 text-sm">
                  <li>• Never share your recovery phrase with anyone</li>
                  <li>• Store it securely offline in multiple locations</li>
                  <li>• Anyone with your phrase can access your wallet</li>
                  <li>• Double-check each word for typos</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>

      {/* Additional Help Card */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium">Need Help?</h4>
              <p className="text-sm text-muted-foreground">
                Recovery phrases are typically 12 or 24 words separated by spaces. 
                They should be entered in the exact order they were provided when you created your wallet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
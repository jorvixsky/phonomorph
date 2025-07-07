'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { privateKeyToAccount } from 'viem/accounts'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

interface ImportPrivateKeyProps {
  onImport?: (privateKey: string) => void
  onCancel?: () => void
}

export default function ImportPrivateKey({ onImport, onCancel }: ImportPrivateKeyProps) {
  const [privateKey, setPrivateKey] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validatePrivateKey = (key: string): boolean => {
    try {
      const cleanKey = key.trim()
      
      // Check if it's a valid hex string (with or without 0x prefix)
      const hexPattern = /^(0x)?[a-fA-F0-9]{64}$/
      if (!hexPattern.test(cleanKey)) {
        setError('Private key must be a 64-character hexadecimal string')
        return false
      }
      
      // Try to create an account from the private key to validate it
      const normalizedKey = cleanKey.startsWith('0x') ? cleanKey as `0x${string}` : `0x${cleanKey}` as `0x${string}`
      privateKeyToAccount(normalizedKey)
      
      setError('')
      return true
    } catch {
      setError('Invalid private key. Please check and try again.')
      return false
    }
  }

  const handlePrivateKeyChange = (value: string) => {
    setPrivateKey(value)
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!privateKey.trim()) {
      setError('Please enter your private key')
      return
    }

    if (!validatePrivateKey(privateKey.trim())) {
      return
    }

    setIsLoading(true)
    try {
      const normalizedKey = privateKey.trim().startsWith('0x') 
        ? privateKey.trim() 
        : `0x${privateKey.trim()}`
      await onImport?.(normalizedKey)
    } catch {
      setError('Failed to import wallet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text').trim()
    setPrivateKey(pastedText)
    if (error) {
      setError('')
    }
  }

  const isValid = privateKey.trim() && validatePrivateKey(privateKey.trim()) && !error

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Import Wallet</h2>
        <p className="text-sm text-muted-foreground">
          Enter your private key to restore your wallet
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="privateKey" className="text-sm font-medium">
            Private Key
          </label>
          <div className="relative">
            <input
              id="privateKey"
              type={isVisible ? 'text' : 'password'}
              value={privateKey}
              onChange={(e) => handlePrivateKeyChange(e.target.value)}
              onPaste={handlePaste}
              placeholder="Enter your private key (64 hex characters)..."
              className={`w-full p-3 text-sm border rounded-md transition-all font-mono ${
                error 
                  ? 'border-destructive focus-visible:ring-destructive/20' 
                  : isValid 
                    ? 'border-green-500 focus-visible:ring-green-500/20'
                    : 'border-input'
              } ${
                !isVisible 
                  ? 'text-transparent selection:bg-transparent' 
                  : 'bg-background'
              }`}
              style={{
                textShadow: !isVisible ? '0 0 8px rgba(0,0,0,0.5)' : 'none',
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setIsVisible(!isVisible)}
            >
              {isVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Length: {privateKey.replace(/^0x/, '').length}/64 characters</span>
            {isValid && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Valid private key</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <Button
            type="submit"
            className="w-full"
            disabled={!privateKey.trim() || !!error || isLoading}
          >
            {isLoading ? 'Importing...' : 'Import Wallet'}
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

      <div className="text-xs text-muted-foreground space-y-2">
        <p className="font-medium">Security Tips:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Never share your private key with anyone</li>
          <li>Store it securely offline</li>
          <li>Anyone with your private key can access your wallet</li>
          <li>Private keys are 64 hexadecimal characters (with or without 0x prefix)</li>
        </ul>
      </div>
    </div>
  )
} 
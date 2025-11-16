'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { Terminal, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function CliLoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code') || ''
  const { data: session, isPending } = useSession()
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [approved, setApproved] = useState<boolean>(false)

  useEffect(() => {
    if (!code) {
      return
    }
    if (session) return
    if (!isPending && !session) {
      router.replace(`/login?redirect=/cli/login&code=${encodeURIComponent(code)}`)
    }
  }, [code, session, isPending, router])

  async function approve() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/v1/cli/auth/device/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceCode: code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.message || 'Failed to approve CLI login')
        return
      }
      setApproved(true)
      setMessage('CLI login approved. You can return to your terminal now.')
    } catch {
      setError('Unexpected error approving CLI login')
    } finally {
      setLoading(false)
    }
  }

  // Invalid code state
  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-error/10 mb-4">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              Invalid Request
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
              This CLI login request is invalid or has expired. Please try again.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/projects')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Loading state
  if (isPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-primary/10 mb-4 animate-pulse">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              Redirecting…
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Please sign in to continue
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Success state
  if (approved) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-success/10 mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              Login Approved
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
              Your CLI has been authenticated successfully. You can close this window and return to your terminal.
            </p>
            <div className="w-full p-3 rounded-lg bg-success/10 border border-success/20 mb-6">
              <p className="text-sm font-mono text-success">✓ Token saved to ~/.envshield/config.json</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/projects')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Main approval request state
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 rounded-2xl bg-primary/10 mb-4">
            <Terminal className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            CLI Login Request
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Approve access to your EnvShield account
          </p>
        </div>

        {/* User info section */}
        <div className="bg-glass-light-bg dark:bg-glass-dark-bg border border-glass-light-border dark:border-glass-dark-border rounded-lg p-4 mb-6">
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark uppercase tracking-wide font-semibold mb-2">
            Logged in as
          </p>
          <p className="text-text-primary-light dark:text-text-primary-dark font-medium break-all">
            {session?.user?.email}
          </p>
        </div>

        {/* Info message */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-text-primary-light dark:text-text-primary-dark">
            Your terminal is waiting for approval to create an API token. This will allow the EnvShield CLI to authenticate with your account.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-error mb-1">Error</p>
              <p className="text-sm text-error/80">{error}</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {message && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-success mb-1">Success</p>
              <p className="text-sm text-success/80">{message}</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={approve}
            disabled={loading}
            loading={loading}
            className="flex-1"
          >
            {loading ? 'Approving…' : 'Approve'}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/projects')}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>

        {/* Footer info */}
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark text-center mt-6">
          Device code: <span className="font-mono">{code.slice(0, 8)}…</span>
        </p>
      </Card>
    </div>
  )
}

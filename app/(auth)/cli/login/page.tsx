import { Suspense } from 'react'
import { CliLoginClient } from './CliLoginClient'
export const dynamic = 'force-dynamic'

export default function CliLoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-6">Loading…</div>}>
      <CliLoginClient />
    </Suspense>
  )
}
import { useEffect, useState } from 'react'
import { getHealth } from '../lib/api'
import { supabase, USE_MOCKS } from '../lib/supabase'
import type { HealthResponse } from '../types/contracts'

/** Developer status page: confirms the frontend, backend and env are wired up. */
export default function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch((err: unknown) => setHealthError(String(err)))
  }, [])

  return (
    <section className="mx-auto max-w-md p-6">
      <h1 className="font-display text-3xl font-bold text-brand">Tinder for Food</h1>
      <p className="mt-2 text-sm">Dev status. This page will become the landing page.</p>
      <dl className="mt-6 space-y-2 rounded-xl bg-white p-4 text-sm shadow">
        <Row label="Mock mode" value={USE_MOCKS ? 'on (data/mock)' : 'off'} />
        <Row label="Supabase client" value={supabase ? 'configured' : 'not configured'} />
        <Row
          label="FastAPI /health"
          value={health ? `ok (v${health.version}, mocks ${health.use_mock_data ? 'on' : 'off'})` : healthError ? 'unreachable' : '…'}
        />
      </dl>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

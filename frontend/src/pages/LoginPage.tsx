import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DemoNotice, PageHeader, PaperPanel, PrimaryButton, SecondaryButton } from '../components/ui'
import { enterDemo, supabase, USE_MOCKS } from '../lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (USE_MOCKS || !supabase) {
      setNotice('Sign-in is unavailable in demo mode. Use Continue in demo mode below; no account is created.')
      return
    }
    setBusy(true)
    const result = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (result.error) setError(result.error.message)
    else navigate('/swipe')
  }

  async function resetPassword() {
    setError(null)
    if (USE_MOCKS || !supabase) {
      setNotice('Password reset is unavailable in demo mode. Continue in demo mode to explore the app.')
      return
    }
    if (!email) {
      setError('Enter your UCLA email first.')
      return
    }
    const result = await supabase.auth.resetPasswordForEmail(email)
    if (result.error) setError(result.error.message)
    else setNotice('Check your email for a password reset link.')
  }

  return (
    <section className="auth-page page-wrap">
      <Link className="back-link" to="/">← Back</Link>
      <PageHeader eyebrow="Welcome back" title="Let’s get you fed." description="Sign in to save your picks and preferences." />
      <PaperPanel className="auth-panel">
        <form onSubmit={signIn} className="stack-form">
          <label htmlFor="email">UCLA email</label>
          <input id="email" type="email" required placeholder="you@ucla.edu" value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required={!USE_MOCKS} placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="button" className="text-button" onClick={resetPassword}>Forgot password?</button>
          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="form-notice" role="status">{notice}</p>}
          <PrimaryButton type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</PrimaryButton>
        </form>
        {USE_MOCKS && <DemoNotice />}
      </PaperPanel>
      <SecondaryButton className="full-width" onClick={() => setNotice('Account registration is not enabled in this preview. You can explore every screen in demo mode.')}>Create an account</SecondaryButton>
      <button className="demo-entry" onClick={enterDemo}>Continue in demo mode</button>
    </section>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
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

  const [mode, setMode] = useState<'signin' | 'signup' | 'recovery'>('signin')

  useEffect(() => {
    if (USE_MOCKS || !supabase) return
    if (new URLSearchParams(window.location.search).has('recovery')) setMode('recovery')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setMode('recovery')
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (USE_MOCKS || !supabase) {
      setNotice('Choose Exit demo to use your account.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'recovery') {
        const result = await supabase.auth.updateUser({ password })
        if (result.error) throw result.error
      } else if (mode === 'signup') {
        const result = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/login` },
        })
        if (result.error) throw result.error
        if (!result.data.session) {
          setMode('signin')
          setNotice('Check your email to confirm your account, then sign in.')
          return
        }
      } else {
        const result = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (result.error) throw result.error
      }
      navigate(mode === 'signup' ? '/onboarding' : '/swipe', { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not access your account. Try again.')
    } finally {
      setBusy(false)
    }
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
    const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login?recovery=1` })
    if (result.error) setError(result.error.message)
    else setNotice('Check your email for a password reset link.')
  }

  return (
    <section className="auth-page page-wrap">
      <Link className="back-link" to="/">← Back</Link>
      <PageHeader eyebrow={mode === 'signup' ? 'Create an account' : mode === 'recovery' ? 'Password reset' : 'Welcome back'} title="Let’s get you fed." description="Sign in to save your picks and preferences." />
      <PaperPanel className="auth-panel">
        <form onSubmit={signIn} className="stack-form">
          {mode !== 'recovery' && <><label htmlFor="email">Email</label>
          <input id="email" type="email" required placeholder="you@ucla.edu" value={email} onChange={(event) => setEmail(event.target.value)} /></>}
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
          {mode === 'signin' && <button type="button" className="text-button" onClick={resetPassword}>Forgot password?</button>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="form-notice" role="status">{notice}</p>}
          <PrimaryButton type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'recovery' ? 'Update password' : mode === 'signup' ? 'Create account' : 'Sign in'}</PrimaryButton>
        </form>
        {USE_MOCKS && <DemoNotice />}
      </PaperPanel>
      {!USE_MOCKS && mode !== 'recovery' && <SecondaryButton className="full-width" disabled={busy} onClick={() => {
        setMode(mode === 'signin' ? 'signup' : 'signin')
        setError(null)
        setNotice(null)
      }}>{mode === 'signin' ? 'Create an account' : 'Back to sign in'}</SecondaryButton>}
      <button className="demo-entry" onClick={enterDemo}>Continue in demo mode</button>
    </section>
  )
}

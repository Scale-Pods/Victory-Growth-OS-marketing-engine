import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { LiquidCard } from '../components/ui'

export default function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('admin@victory.os')
  const [password, setPassword] = useState('Victory@2026')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(null)
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) setErr(error)
    else nav('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <LiquidCard lg style={{ width: 400, maxWidth: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
          <img src="https://victoryenergy.us/wp-content/uploads/2026/05/VE-Logo-Color.svg" alt="Victory Energy" style={{ height: 38, marginBottom: 14 }} />
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.022em' }}>Victory Growth OS</div>
          <div style={{ fontSize: 13, color: 'var(--label-secondary)' }}>Sign in to the Marketing Engine</div>
        </div>

        <form onSubmit={submit}>
          <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.02em', color: 'var(--label-tertiary)' }}>Email</label>
          <input className="input" style={{ margin: '6px 0 14px' }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.02em', color: 'var(--label-tertiary)' }}>Password</label>
          <input className="input" style={{ margin: '6px 0 4px' }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {err && <div style={{ color: 'var(--red)', fontSize: 13, margin: '10px 0 0' }}>{err}</div>}

          <button className="btn-primary" type="submit" disabled={busy} style={{ width: '100%', marginTop: 18, opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--separator)', fontSize: 12, color: 'var(--label-secondary)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--label-tertiary)' }}>Demo accounts · password Victory@2026</div>
          admin@victory.os · client@victory.os · designer@victory.os
        </div>
      </LiquidCard>
    </div>
  )
}

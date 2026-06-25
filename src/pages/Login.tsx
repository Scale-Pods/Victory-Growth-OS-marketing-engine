import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Send } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { LiquidCard } from '../components/ui'

const ROLES = [
  { key: 'admin',    label: 'Admin',    color: '#8b5cf6' },
  { key: 'client',   label: 'Client',   color: '#3b82f6' },
  { key: 'designer', label: 'Designer', color: '#f97316' },
]

const EMAIL = 'info@scalepods.co'

export default function Login() {
  const { signIn, resetPassword } = useAuth()
  const nav = useNavigate()

  const [role, setRole]         = useState('admin')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [err, setErr]           = useState<string | null>(null)
  const [busy, setBusy]         = useState(false)

  // Forgot-password state
  const [resetMode, setResetMode]   = useState(false)
  const [resetSent, setResetSent]   = useState(false)
  const [resetBusy, setResetBusy]   = useState(false)
  const [resetErr, setResetErr]     = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(null)
    const { error } = await signIn(EMAIL, password, role)
    setBusy(false)
    if (error) setErr(error)
    else nav('/')
  }

  async function sendReset() {
    setResetBusy(true); setResetErr(null)
    const { error } = await resetPassword(EMAIL)
    setResetBusy(false)
    if (error) setResetErr(error)
    else setResetSent(true)
  }

  const activeRole = ROLES.find((r) => r.key === role)!

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <LiquidCard lg style={{ width: 420, maxWidth: '100%' }}>

        {/* Logo + title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 26 }}>
          <img
            src="https://victoryenergy.us/wp-content/uploads/2026/05/VE-Logo-Color.svg"
            alt="Victory Energy" style={{ height: 40, marginBottom: 14 }}
          />
          <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-.022em' }}>Victory Growth OS</div>
          <div style={{ fontSize: 13, color: 'var(--label-secondary)', marginTop: 3 }}>Marketing Engine · Sign in</div>
        </div>

        {/* ── FORGOT-PASSWORD PANEL ── */}
        {resetMode ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Reset password</div>
            <div style={{ fontSize: 13, color: 'var(--label-secondary)', marginBottom: 18, lineHeight: 1.5 }}>
              A password reset link will be sent to <strong>{EMAIL}</strong>.
            </div>

            {resetSent ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                borderRadius: 12, background: 'rgba(52,199,89,.1)', border: '1px solid rgba(52,199,89,.25)',
                fontSize: 13, color: 'var(--green)', marginBottom: 16 }}>
                <Send size={16} />
                Reset link sent — check <strong style={{ marginLeft: 3 }}>{EMAIL}</strong>
              </div>
            ) : (
              <>
                {resetErr && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{resetErr}</div>}
                <button className="btn-primary" onClick={sendReset} disabled={resetBusy}
                  style={{ width: '100%', marginBottom: 12, opacity: resetBusy ? 0.7 : 1 }}>
                  {resetBusy ? 'Sending…' : 'Send reset link'}
                </button>
              </>
            )}

            <button onClick={() => { setResetMode(false); setResetSent(false); setResetErr(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
                color: 'var(--label-secondary)', padding: 0, textDecoration: 'underline' }}>
              ← Back to sign in
            </button>
          </>

        ) : (
          /* ── SIGN-IN FORM ── */
          <form onSubmit={submit}>

            {/* Role selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em',
                color: 'var(--label-tertiary)', marginBottom: 10 }}>Sign in as</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {ROLES.map((r) => {
                  const active = role === r.key
                  return (
                    <button key={r.key} type="button" onClick={() => setRole(r.key)}
                      style={{
                        padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                        fontWeight: 600, fontSize: 14, transition: 'all .15s ease',
                        background: active ? r.color : 'var(--fill-tertiary)',
                        color: active ? '#fff' : 'var(--label-secondary)',
                        boxShadow: active ? `0 4px 16px ${r.color}55` : 'none',
                        transform: active ? 'translateY(-1px)' : 'none',
                      }}>
                      {r.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Email (read-only) */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '.02em', color: 'var(--label-tertiary)' }}>Email</label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 8,
                  color: 'var(--label-secondary)', cursor: 'default', userSelect: 'none' }}>
                  <Mail size={15} style={{ flexShrink: 0, color: 'var(--label-tertiary)' }} />
                  {EMAIL}
                </div>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '.02em', color: 'var(--label-tertiary)' }}>Password</label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <input
                  className="input" type={showPw ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password" style={{ paddingRight: 44 }} autoFocus
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--label-tertiary)',
                    display: 'flex', padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign: 'right', marginBottom: 4 }}>
              <button type="button" onClick={() => setResetMode(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5,
                  color: 'var(--blue)', padding: '4px 0' }}>
                Forgot password?
              </button>
            </div>

            {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</div>}

            <button className="btn-primary" type="submit" disabled={busy}
              style={{ width: '100%', marginTop: 14, opacity: busy ? 0.7 : 1,
                background: activeRole.color,
                boxShadow: `0 4px 20px ${activeRole.color}55` }}>
              {busy ? 'Signing in…' : `Sign in as ${activeRole.label}`}
            </button>
          </form>
        )}
      </LiquidCard>
    </div>
  )
}

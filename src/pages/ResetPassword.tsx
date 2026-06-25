import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Eye, EyeOff } from 'lucide-react'
import { LiquidCard } from '../components/ui'
import { useAuth } from '../lib/auth'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // Supabase fires PASSWORD_RECOVERY event when user lands here via the email link.
  // The SDK auto-exchanges the token and sets the session — nothing extra needed.
  useEffect(() => {
    // If the user somehow lands here without a recovery session, send them back.
    const t = setTimeout(() => {
      if (!done) {/* stay on page — let Supabase handle the token exchange */}
    }, 500)
    return () => clearTimeout(t)
  }, [done])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setErr('Password must be at least 8 characters')
    if (password !== confirm) return setErr('Passwords do not match')
    setBusy(true); setErr(null)
    const { error } = await updatePassword(password)
    setBusy(false)
    if (error) { setErr(error); return }
    setDone(true)
    setTimeout(() => nav('/'), 2500)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <LiquidCard lg style={{ width: 420, maxWidth: '100%' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <img
            src="https://victoryenergy.us/wp-content/uploads/2026/05/VE-Logo-Color.svg"
            alt="Victory Energy" style={{ height: 38, marginBottom: 14 }}
          />
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.022em' }}>
            {done ? 'Password updated!' : 'Set new password'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--label-secondary)', marginTop: 4 }}>
            {done ? 'Redirecting to dashboard…' : 'Choose a new password for info@scalepods.co'}
          </div>
        </div>

        {done ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,199,89,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={28} style={{ color: 'var(--green)' }} />
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.02em', color: 'var(--label-tertiary)' }}>
              New password
            </label>
            <div style={{ position: 'relative', margin: '6px 0 14px' }}>
              <input
                className="input" type={showPw ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters" style={{ paddingRight: 42 }} autoFocus
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--label-tertiary)', display: 'flex' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.02em', color: 'var(--label-tertiary)' }}>
              Confirm password
            </label>
            <input
              className="input" type="password" style={{ margin: '6px 0 4px' }}
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
            />

            {err && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 10 }}>{err}</div>}

            <button className="btn-primary" type="submit" disabled={busy}
              style={{ width: '100%', marginTop: 20, opacity: busy ? 0.7 : 1 }}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </LiquidCard>
    </div>
  )
}

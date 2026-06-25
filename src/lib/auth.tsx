import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

const ROLE_KEY = 've_role'

type AuthCtx = {
  session: Session | null
  user: User | null
  role: string | null
  loading: boolean
  signIn: (email: string, password: string, role: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string) => Promise<{ error?: string }>
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<string | null>(
    () => localStorage.getItem(ROLE_KEY)
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const user = session?.user ?? null
  const role =
    selectedRole ||
    (user?.app_metadata?.role as string) ||
    (user?.user_metadata?.role as string) ||
    null

  async function signIn(email: string, password: string, role: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      setSelectedRole(role)
      localStorage.setItem(ROLE_KEY, role)
    }
    return { error: error?.message }
  }

  async function signOut() {
    localStorage.removeItem(ROLE_KEY)
    setSelectedRole(null)
    await supabase.auth.signOut()
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error?.message }
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error?.message }
  }

  return (
    <Ctx.Provider value={{ session, user, role, loading, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </Ctx.Provider>
  )
}

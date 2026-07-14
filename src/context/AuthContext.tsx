import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  isOwner: boolean
  isAdmin: boolean
  siteUserId: string | null
  username: string | null
  needsUsername: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signInWithGoogle: () => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [allowedEmails, setAllowedEmails] = useState<string[]>([])
  const [role, setRole] = useState<'admin' | 'user' | null>(null)
  const [siteUserId, setSiteUserId] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [needsUsername, setNeedsUsername] = useState(false)

  const fetchAllowed = async (currentEmail?: string) => {
    const { data, error } = await supabase.from('site_user_emails').select('email, user_id, site_users(role, status, handle, username_set)')
    if (error) return null
    setAllowedEmails((data ?? []).map((r: any) => String(r.email).toLowerCase()))
    const current = (data ?? []).find((r: any) => String(r.email).toLowerCase() === currentEmail?.toLowerCase()) as any
    setRole(current?.site_users?.role === 'admin' ? 'admin' : current ? 'user' : null)
    setSiteUserId(current?.user_id ?? null)
    const isVerified = current?.site_users?.status === 'verified'
    setVerified(isVerified)
    setUsername(current?.site_users?.handle ?? null)
    const missingUsername = current?.site_users?.username_set === false
    setNeedsUsername(missingUsername)
    return current ? { verified: isVerified, needsUsername: missingUsername } : null
  }

  useEffect(() => {
    // load current session
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) {
        const identity = await fetchAllowed(data.session.user.email)
        if (!identity?.verified && !identity?.needsUsername) { sessionStorage.setItem('auth_notice', 'Your account is waiting for admin verification.'); await supabase.auth.signOut(); setSession(null) }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        const identity = await fetchAllowed(session.user.email)
        if (!identity?.verified && !identity?.needsUsername) { sessionStorage.setItem('auth_notice', 'Your account is waiting for admin verification.'); setSession(null); setTimeout(() => supabase.auth.signOut(), 0) }
      } else {
        setAllowedEmails([])
        setRole(null)
        setSiteUserId(null)
        setVerified(false)
        setUsername(null)
        setNeedsUsername(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const isOwner = verified && !!(session?.user?.email && allowedEmails.includes(session.user.email.toLowerCase()))
  const isAdmin = isOwner && role === 'admin'

  // signIn with password first, then enforce DB allowlist and sign out if not allowed
  const signIn = async (email: string, password: string): Promise<string | null> => {
    const normalized = email.toLowerCase().trim()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: normalized, password })
    if (signInError) return signInError.message

    const { data, error: allowlistError } = await supabase
      .from('site_user_emails')
      .select('email, site_users(status)')
      .ilike('email', normalized)
      .limit(1)

    if (allowlistError || !data || data.length === 0 || (data[0] as any).site_users?.status !== 'verified') {
      await supabase.auth.signOut()
      return data?.length ? 'Your account is waiting for admin verification.' : 'Access denied.'
    }

    await fetchAllowed(normalized)
    return null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async (): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/private-login` },
    })
    return error?.message ?? null
  }

  return (
    <AuthContext.Provider value={{ session, loading, isOwner, isAdmin, siteUserId, username, needsUsername, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function PrivateLogin() {
  const { signIn, signInWithGoogle, session, isOwner, username: currentUsername, needsUsername } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recovering, setRecovering] = useState(window.location.hash.includes('type=recovery'))
  const [newPassword, setNewPassword] = useState('')
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [notice, setNotice] = useState('')
  const [usernameState, setUsernameState] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [showVerificationPopup, setShowVerificationPopup] = useState(false)

  useEffect(() => {
    const authNotice = sessionStorage.getItem('auth_notice')
    if (authNotice) {
      if (authNotice.toLowerCase().includes('waiting for admin verification')) setShowVerificationPopup(true)
      else setNotice(authNotice)
      sessionStorage.removeItem('auth_notice')
    }
  }, [])

  useEffect(() => {
    if (session && isOwner && currentUsername) navigate(`/${currentUsername}/edit`, { replace: true })
  }, [session, isOwner, currentUsername, navigate])

  const checkUsername = async (value = username) => {
    if (!/^[a-z0-9_-]{3,30}$/.test(value)) { setUsernameState('idle'); return false }
    setUsernameState('checking')
    const { data, error } = await supabase.rpc('is_username_available', { candidate: value })
    const available = !error && data === true
    setUsernameState(available ? 'available' : 'taken')
    return available
  }

  const completeGoogleUsername = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    if (!(await checkUsername())) { setLoading(false); setError('That username is unavailable or reserved.'); return }
    const { error } = await supabase.rpc('complete_username', { candidate: username })
    if (error) { setLoading(false); setError(error.message); return }
    sessionStorage.setItem('auth_notice', 'Username saved. Your account is waiting for admin verification.')
    await supabase.auth.signOut()
    window.location.reload()
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) setError(error.message)
    else { setRecovering(false); setNewPassword(''); await supabase.auth.signOut(); setError('Password updated. Sign in with your new password.') }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await signIn(email.trim().toLowerCase(), password)
    setLoading(false)
    if (err) {
      if (err.toLowerCase().includes('waiting for admin verification')) setShowVerificationPopup(true)
      else setError(err)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setNotice(''); setLoading(true)
    if (!(await checkUsername())) { setLoading(false); setError('That username is unavailable or reserved.'); return }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { display_name: displayName.trim(), username: username.trim().toLowerCase() }, emailRedirectTo: `${window.location.origin}/login` },
    })
    setLoading(false)
    if (error) return setError(error.message)
    if (data.session) await supabase.auth.signOut()
    setNotice('Account created. An admin must verify it before you can sign in.'); setCreatingAccount(false); setPassword('')
  }

  return (
    <div className="login-page">
      {showVerificationPopup && (
        <div className="verification-popup-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowVerificationPopup(false) }}>
          <div className="verification-popup" role="alertdialog" aria-modal="true" aria-labelledby="verification-popup-title">
            <div className="verification-popup-icon" aria-hidden="true">⌛</div>
            <h2 id="verification-popup-title">Waiting for verification</h2>
            <p>Your account has been created, but an admin must verify it before you can sign in and edit your portfolio.</p>
            <button type="button" className="btn-primary" onClick={() => setShowVerificationPopup(false)}>Okay</button>
          </div>
        </div>
      )}
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--accent)" />
              <path d="M16 8l6 4v8l-6 4-6-4v-8l6-4z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <h1>Portfolio Admin</h1>
          <p>Sign in to manage your portfolio</p>
        </div>

        {needsUsername ? (
          <form onSubmit={completeGoogleUsername} className="login-form">
            <p className="edit-hint">Choose your portfolio username to finish creating your Google account.</p>
            <div className="field"><label htmlFor="google-username">Username</label><input id="google-username" value={username} onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')); setUsernameState('idle') }} onBlur={() => checkUsername()} minLength={3} maxLength={30} pattern="[a-z0-9_-]+" required autoFocus /><span className={`field-help username-${usernameState}`}>{usernameState === 'checking' ? 'Checking…' : usernameState === 'available' ? 'Username available' : usernameState === 'taken' ? 'Username unavailable' : `Your portfolio: /${username || 'username'}/`}</span></div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading || username.length < 3}>{loading ? <span className="btn-spinner" /> : 'Save Username'}</button>
          </form>
        ) : recovering ? (
          <form onSubmit={updatePassword} className="login-form">
            <div className="field"><label htmlFor="new-password">New Password</label><input id="new-password" type="password" minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password" /></div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading || newPassword.length < 8}>{loading ? <span className="btn-spinner" /> : 'Update Password'}</button>
          </form>
        ) : <>
        <form onSubmit={creatingAccount ? handleSignUp : handleSubmit} className="login-form">
          {creatingAccount && <>
            <div className="field"><label htmlFor="display-name">Name</label><input id="display-name" value={displayName} onChange={e => setDisplayName(e.target.value)} autoComplete="name" required /></div>
            <div className="field"><label htmlFor="username">Username</label><input id="username" value={username} onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')); setUsernameState('idle') }} onBlur={() => checkUsername()} minLength={3} maxLength={30} pattern="[a-z0-9_-]+" autoComplete="username" placeholder="anas" required /><span className={`field-help username-${usernameState}`}>{usernameState === 'checking' ? 'Checking…' : usernameState === 'available' ? 'Username available' : usernameState === 'taken' ? 'Username unavailable' : `Your portfolio: /${username || 'username'}/`}</span></div>
          </>}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}
          {notice && <div className="login-notice">{notice}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="btn-spinner" />
            ) : (
              creatingAccount ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <button type="button" className="login-mode-btn" disabled={loading} onClick={() => { setCreatingAccount(value => !value); setError(''); setNotice('') }}>
          {creatingAccount ? 'Already have an account? Sign in' : 'Need an account? Create one'}
        </button>

        <div className="login-divider"><span>or</span></div>
        <button type="button" className="google-login-btn" disabled={loading} onClick={async () => {
          setLoading(true); setError('')
          const err = await signInWithGoogle()
          if (err) { setError(err); setLoading(false) }
        }}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 01-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0012 22z"/><path fill="#FBBC05" d="M6.39 13.86A6.02 6.02 0 016.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 002 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62z"/><path fill="#EA4335" d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.62 9.62 0 0012 2a10 10 0 00-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01z"/></svg>
          Continue with Google
        </button>
        </>}

        <p className="login-note">This page is not publicly linked.</p>
      </div>
    </div>
  )
}

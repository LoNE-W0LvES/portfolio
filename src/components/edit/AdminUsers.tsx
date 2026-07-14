import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface ManagedUser {
  id: string
  display_name: string
  role: 'admin' | 'user'
  emails: { email: string; verified: boolean }[]
}

export default function AdminUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const request = async (method: string, body?: object) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Your session expired. Please sign in again.')
    const response = await fetch('/api/admin/users', {
      method,
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'User operation failed')
    return result
  }

  const load = async () => {
    try { setUsers((await request('GET')).users) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load users') }
  }

  useEffect(() => { load() }, [])

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setMessage('')
    try { await action(); await load() }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Operation failed') }
    finally { setBusy(false) }
  }

  const createUser = () => run(async () => {
    await request('POST', { email, password, display_name: displayName })
    setEmail(''); setPassword(''); setDisplayName(''); setMessage('User created.')
  })

  return (
    <div className="admin-users">
      <h2>User Management</h2>
      <p className="edit-hint">Regular users have one login email. Only admins can manage accounts.</p>
      {message && <p className="admin-message">{message}</p>}
      <div className="edit-edu-card">
        <h3>Create User</h3>
        <div className="edit-form-grid">
          <div className="field"><label>Name</label><input value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="field field-full"><label>Temporary Password</label><input type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} /></div>
        </div>
        <button className="btn-primary" disabled={busy || !email || password.length < 8} onClick={createUser}>Create User</button>
      </div>
      <div className="admin-user-list">
        {users.map(user => (
          <div className="edit-edu-card" key={user.id}>
            <div className="admin-user-heading"><div><strong>{user.display_name || 'Unnamed user'}</strong><span className="admin-role">{user.role}</span></div></div>
            {user.emails.map(item => (
              <div className="admin-email-row" key={item.email}>
                <span>{item.email}</span><span>{item.verified ? 'Verified' : 'Unverified'}</span>
                {user.role !== 'admin' && <div className="avatar-actions">
                  {!item.verified && <button className="btn-outline" disabled={busy} onClick={() => run(async () => { await request('PATCH', { action: 'verify', email: item.email }); setMessage('User verified.') })}>Verify</button>}
                  <button className="btn-outline" disabled={busy} onClick={() => run(async () => { await request('PATCH', { action: 'reset', email: item.email }); setMessage('Password reset email sent.') })}>Reset Password</button>
                  <button className="edit-signout-btn" disabled={busy} onClick={() => { if (confirm(`Delete ${item.email}?`)) run(async () => { await request('DELETE', { email: item.email }); setMessage('User deleted.') }) }}>Delete</button>
                </div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

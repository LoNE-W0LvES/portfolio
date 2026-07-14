import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface ManagedUser {
  id: string
  display_name: string
  username: string
  role: 'admin' | 'user'
  status: 'pending' | 'verified'
  username_set: boolean
  emails: { email: string; verified: boolean }[]
}

export default function AdminUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editUsername, setEditUsername] = useState('')

  const request = async (method: string, body?: object) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Your session expired. Please sign in again.')
    const response = await fetch('/api/admin/users', {
      method,
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      throw new Error(`Admin API returned ${response.status} ${contentType || 'non-JSON'} instead of JSON. Redeploy the Vercel API route. ${text.slice(0, 80)}`)
    }
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
    await request('POST', { email, password, display_name: displayName, username })
    setEmail(''); setPassword(''); setDisplayName(''); setUsername(''); setShowCreate(false); setMessage('User created.')
  })

  const openEdit = (user: ManagedUser) => {
    setEditingUser(user); setEditName(user.display_name); setEditUsername(user.username_set ? user.username : '')
  }

  const saveEdit = () => {
    if (!editingUser?.emails[0]) return
    run(async () => {
      await request('PATCH', { action: 'edit', email: editingUser.emails[0].email, display_name: editName, username: editUsername })
      setEditingUser(null); setMessage('User updated.')
    })
  }

  return (
    <div className="admin-users">
      <h2>User Management</h2>
      <p className="edit-hint">Regular users have one login email. Only admins can manage accounts.</p>
      {message && <p className="admin-message">{message}</p>}
      <div><button className="btn-primary" onClick={() => setShowCreate(true)}>+ Create User</button></div>
      {showCreate && <div className="admin-modal-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowCreate(false) }}>
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
          <div className="admin-modal-header"><h3 id="create-user-title">Create User</h3><button type="button" className="icon-btn" aria-label="Close" onClick={() => setShowCreate(false)}>×</button></div>
          <div className="edit-form-grid">
            <div className="field"><label>Name</label><input value={displayName} onChange={e => setDisplayName(e.target.value)} autoFocus /></div>
            <div className="field"><label>Username</label><input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} minLength={3} maxLength={30} placeholder="anas" /></div>
            <div className="field field-full"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div className="field field-full"><label>Temporary Password</label><input type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} /></div>
          </div>
          <div className="admin-modal-actions"><button type="button" className="btn-outline" disabled={busy} onClick={() => setShowCreate(false)}>Cancel</button><button type="button" className="btn-primary" disabled={busy || !email || password.length < 8 || username.length < 3} onClick={createUser}>{busy ? 'Creating…' : 'Create User'}</button></div>
        </div>
      </div>}
      {editingUser && <div className="admin-modal-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setEditingUser(null) }}>
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
          <div className="admin-modal-header"><h3 id="edit-user-title">Edit User</h3><button type="button" className="icon-btn" aria-label="Close" onClick={() => setEditingUser(null)}>×</button></div>
          <div className="edit-form-grid">
            <div className="field field-full"><label>Name</label><input value={editName} onChange={e => setEditName(e.target.value)} autoFocus /></div>
            <div className="field field-full"><label>Username</label><input value={editUsername} onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} minLength={3} maxLength={30} /><span className="field-help">Changing this also changes the portfolio URL.</span></div>
          </div>
          <div className="admin-modal-actions"><button type="button" className="btn-outline" disabled={busy} onClick={() => setEditingUser(null)}>Cancel</button><button type="button" className="btn-primary" disabled={busy || !editName.trim() || editUsername.length < 3} onClick={saveEdit}>{busy ? 'Saving…' : 'Save Changes'}</button></div>
        </div>
      </div>}
      <div className="admin-user-list">
        {users.map(user => (
          <div className="edit-edu-card" key={user.id}>
            <div className="admin-user-heading"><div><strong>{user.display_name || 'Unnamed user'}</strong>{user.username_set ? <a href={`/${user.username}/`} target="_blank" rel="noreferrer">/{user.username}/</a> : <span>Username not chosen</span>}<span className="admin-role">{user.role}</span><span className="admin-role">{user.status}</span></div></div>
            {user.emails.map(item => (
              <div className="admin-email-row" key={item.email}>
                <span>{item.email}</span><span>{item.verified ? 'Verified' : 'Unverified'}</span>
                {user.role !== 'admin' && <div className="avatar-actions">
                  <button className="btn-outline" disabled={busy} onClick={() => openEdit(user)}>Edit</button>
                  {user.status !== 'verified' && user.username_set && <button className="btn-outline" disabled={busy} onClick={() => run(async () => { await request('PATCH', { action: 'verify', email: item.email }); setMessage('User verified and approved.') })}>Verify</button>}
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

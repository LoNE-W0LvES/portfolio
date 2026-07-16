import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Method = {
  id: string
  platform_name: string
  payment_url: string
  account_name: string
  description: string
  icon_url: string
  website_visible: boolean
  api_visible: boolean
  sort_order: number
}

const blank = (): Method => ({
  id: crypto.randomUUID(),
  platform_name: '',
  payment_url: '',
  account_name: '',
  description: '',
  icon_url: '',
  website_visible: true,
  api_visible: true,
  sort_order: 0,
})

export default function EditDonations() {
  const [methods, setMethods] = useState<Method[]>([])
  const [draft, setDraft] = useState<Method | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const request = async (method: string, body?: object) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Your session expired. Please sign in again.')
    const response = await fetch('/api/admin/donations', {
      method,
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const type = response.headers.get('content-type') || ''
    if (!type.includes('application/json')) throw new Error(`Donation API returned ${response.status} ${type || 'non-JSON'} instead of JSON.`)
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Donation operation failed.')
    return result
  }

  const load = async () => {
    try {
      const result = await request('GET')
      setMethods(result.methods || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load donation methods.')
    }
  }

  useEffect(() => { void load() }, [])

  const persist = async (next: Method[], successMessage: string) => {
    setBusy(true)
    setMessage('')
    try {
      const result = await request('PUT', { methods: next })
      setMethods(result.methods || [])
      setMessage(successMessage)
      return true
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save donation methods.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const saveDraft = async () => {
    if (!draft) return
    if (!draft.platform_name.trim()) return setMessage('Platform name is required.')
    try {
      for (const value of [draft.payment_url, draft.icon_url].filter(Boolean)) {
        const url = new URL(value)
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
      }
    } catch {
      return setMessage('Payment and icon links must use HTTP or HTTPS.')
    }
    const exists = methods.some(row => row.id === draft.id)
    const next = exists ? methods.map(row => row.id === draft.id ? draft : row) : [...methods, draft]
    if (await persist(next, exists ? 'Donation method updated.' : 'Donation method added.')) setDraft(null)
  }

  const move = (index: number, direction: number) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= methods.length) return
    const next = [...methods]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    void persist(next, 'Donation order updated.')
  }

  const remove = (method: Method) => {
    if (!confirm(`Delete ${method.platform_name}?`)) return
    void persist(methods.filter(row => row.id !== method.id), 'Donation method deleted.')
  }

  const updateDraft = (key: keyof Method, value: string | boolean) => {
    setDraft(current => current ? { ...current, [key]: value } : current)
  }

  return <div>
    <div className="donation-page-header">
      <h2>Global Donation Methods</h2>
      <p className="edit-hint">Shared across the website and managed only by administrators.</p>
      <button className="btn-primary" onClick={() => { setMessage(''); setDraft(blank()) }}>+ Add Method</button>
    </div>
    {message && <p className="admin-message">{message}</p>}
    {!methods.length && <div className="edit-edu-card donation-empty">No donation methods yet. Click Add Method to create one.</div>}
    <div className="admin-user-list donation-method-list">
      {methods.map((row, index) => <div className="edit-edu-card donation-method-card" key={row.id}>
        <div className="donation-method-summary">
          {row.icon_url ? <img src={row.icon_url} alt="" /> : <span>{row.platform_name.slice(0, 1).toUpperCase()}</span>}
          <div><strong>{row.platform_name}</strong><small>{row.account_name || row.payment_url}</small></div>
          <div className="donation-visibility-badges">
            {row.website_visible && <span>Website</span>}
            {row.api_visible && <span>API</span>}
          </div>
        </div>
        {row.description && <p className="edit-hint">{row.description}</p>}
        <div className="avatar-actions">
          <button className="btn-outline" disabled={busy || index === 0} onClick={() => move(index, -1)}>↑</button>
          <button className="btn-outline" disabled={busy || index === methods.length - 1} onClick={() => move(index, 1)}>↓</button>
          <button className="btn-outline" disabled={busy} onClick={() => { setMessage(''); setDraft({ ...row }) }}>Edit</button>
          <button className="edit-signout-btn" disabled={busy} onClick={() => remove(row)}>Delete</button>
        </div>
      </div>)}
    </div>

    {draft && <div className="admin-modal-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setDraft(null) }}>
      <div className="admin-modal" role="dialog" aria-modal="true">
        <div className="admin-modal-header"><h3>{methods.some(row => row.id === draft.id) ? 'Edit Donation Method' : 'Add Donation Method'}</h3><button className="icon-btn" disabled={busy} onClick={() => setDraft(null)}>×</button></div>
        <div className="edit-form-grid">
          <div className="field"><label>Platform name</label><input autoFocus value={draft.platform_name} onChange={e => updateDraft('platform_name', e.target.value)} /></div>
          <div className="field"><label>Account / username</label><input value={draft.account_name} onChange={e => updateDraft('account_name', e.target.value)} /></div>
          <div className="field field-full"><label>Payment URL</label><input type="url" value={draft.payment_url} onChange={e => updateDraft('payment_url', e.target.value)} placeholder="https://…" /></div>
          <div className="field field-full"><label>Icon URL (optional)</label><input type="url" value={draft.icon_url} onChange={e => updateDraft('icon_url', e.target.value)} placeholder="https://…" /></div>
          <div className="field field-full"><label>Description</label><textarea value={draft.description} onChange={e => updateDraft('description', e.target.value)} /></div>
          <label className="donation-check"><input type="checkbox" checked={draft.website_visible} onChange={e => updateDraft('website_visible', e.target.checked)} /> Show on website</label>
          <label className="donation-check"><input type="checkbox" checked={draft.api_visible} onChange={e => updateDraft('api_visible', e.target.checked)} /> Include in API</label>
        </div>
        <div className="admin-modal-actions"><button className="btn-outline" disabled={busy} onClick={() => setDraft(null)}>Cancel</button><button className="btn-primary" disabled={busy} onClick={saveDraft}>{busy ? 'Saving…' : methods.some(row => row.id === draft.id) ? 'Save Changes' : 'Add Method'}</button></div>
      </div>
    </div>}
  </div>
}

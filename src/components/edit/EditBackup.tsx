import React, { useRef, useState } from 'react'
import { supabase, type PortfolioSettings } from '../../lib/supabase'
import './EditBackup.css'

interface BackupFile {
  format: 'lonewolves-portfolio-backup'
  version: 1
  exported_at: string
  portfolio: Record<string, unknown>
  repo_visibility: { repo_name: string; visible: boolean }[]
}

interface Props { settings: PortfolioSettings | null; saving: boolean; onSave: (updates: Partial<PortfolioSettings>) => Promise<void>; onRefresh: () => Promise<void> }
const PROTECTED = new Set(['id', 'owner_id', 'is_primary', 'slug', 'is_published', 'created_at', 'updated_at'])

export default function EditBackup({ settings, saving, onSave, onRefresh }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [message, setMessage] = useState('')

  const exportBackup = async () => {
    if (!settings) return
    const portfolio = Object.fromEntries(Object.entries(settings).filter(([key]) => !PROTECTED.has(key)))
    const { data } = await supabase.from('repo_visibility').select('repo_name,visible').eq('owner_id', settings.owner_id)
    const backup: BackupFile = { format: 'lonewolves-portfolio-backup', version: 1, exported_at: new Date().toISOString(), portfolio, repo_visibility: data || [] }
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `${settings.slug || 'portfolio'}-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click()
    URL.revokeObjectURL(url); setMessage('Backup exported successfully.')
  }

  const selectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as BackupFile
      if (parsed.format !== 'lonewolves-portfolio-backup' || parsed.version !== 1 || !parsed.portfolio || !Array.isArray(parsed.repo_visibility)) throw new Error('This is not a supported portfolio backup.')
      setPending(parsed); setMessage('Backup validated. Review the summary before restoring.')
    } catch (error) { setPending(null); setMessage(`Error: ${error instanceof Error ? error.message : 'Invalid JSON file.'}`) }
    event.target.value = ''
  }

  const restore = async () => {
    if (!settings || !pending) return
    const safeSettings = Object.fromEntries(Object.entries(pending.portfolio).filter(([key]) => key in settings && !PROTECTED.has(key))) as Partial<PortfolioSettings>
    await onSave(safeSettings)
    const rows = pending.repo_visibility.map(item => ({ owner_id: settings.owner_id, repo_name: item.repo_name, visible: Boolean(item.visible) }))
    if (rows.length) await supabase.from('repo_visibility').upsert(rows, { onConflict: 'owner_id,repo_name' })
    await onRefresh(); setPending(null); setMessage('Portfolio restored from backup.')
  }

  return <div className="backup-panel">
    <div className="backup-grid">
      <article><span className="backup-icon">↓</span><h3>Export portfolio</h3><p>Download your content, theme, layout, SEO settings, contacts, projects, credentials, and repository visibility as JSON.</p><button className="btn-primary" onClick={exportBackup} disabled={!settings}>Export Backup</button></article>
      <article><span className="backup-icon">↑</span><h3>Import portfolio</h3><p>Select a backup created by this site. Your account, username, publication status, and ownership will never be overwritten.</p><input ref={inputRef} hidden type="file" accept="application/json,.json" onChange={selectFile}/><button className="btn-outline" onClick={() => inputRef.current?.click()}>Choose Backup File</button></article>
    </div>
    {message && <p className={message.startsWith('Error') ? 'save-msg save-msg-error' : 'save-msg save-msg-ok'}>{message}</p>}
    {pending && <div className="backup-review"><h3>Restore this backup?</h3><dl><div><dt>Exported</dt><dd>{new Date(pending.exported_at).toLocaleString()}</dd></div><div><dt>Portfolio fields</dt><dd>{Object.keys(pending.portfolio).length}</dd></div><div><dt>Repository preferences</dt><dd>{pending.repo_visibility.length}</dd></div></dl><p>This replaces the current editable portfolio content. Account and URL details remain unchanged.</p><div><button className="btn-outline" onClick={() => setPending(null)}>Cancel</button><button className="btn-primary" disabled={saving} onClick={restore}>{saving ? 'Restoring...' : 'Restore Portfolio'}</button></div></div>}
  </div>
}

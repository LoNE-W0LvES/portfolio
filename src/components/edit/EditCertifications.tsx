import React, { useEffect, useState } from 'react'
import type { Certification, PortfolioSettings } from '../../lib/supabase'

interface Props { settings: PortfolioSettings | null; saving: boolean; onSave: (updates: Partial<PortfolioSettings>) => Promise<void> }
const empty = (): Certification => ({ name: '', issuer: '', issue_date: '', expiry_date: '', credential_id: '', credential_url: '' })

export default function EditCertifications({ settings, saving, onSave }: Props) {
  const [items, setItems] = useState<Certification[]>([])
  useEffect(() => { if (settings) setItems(structuredClone(settings.certifications ?? [])) }, [settings])
  const update = (index: number, key: keyof Certification, value: string) => setItems(current => current.map((item, i) => i === index ? { ...item, [key]: value } : item))
  return <div className="edit-edu-panel">
    {items.map((item, index) => <div className="edit-edu-card" key={index}>
      <div className="edit-edu-card-header"><span className="edit-edu-num">#{index + 1}</span><button className="icon-btn icon-btn-danger" onClick={() => setItems(current => current.filter((_, i) => i !== index))}>×</button></div>
      <div className="edit-form-grid">
        <div className="field field-full"><label>Certification name</label><input value={item.name} onChange={event => update(index, 'name', event.target.value)} placeholder="AWS Certified Cloud Practitioner" /></div>
        <div className="field field-full"><label>Issuing organization</label><input value={item.issuer} onChange={event => update(index, 'issuer', event.target.value)} placeholder="Amazon Web Services" /></div>
        <div className="field"><label>Issue date</label><input value={item.issue_date} onChange={event => update(index, 'issue_date', event.target.value)} placeholder="June 2026" /></div>
        <div className="field"><label>Expiry date</label><input value={item.expiry_date} onChange={event => update(index, 'expiry_date', event.target.value)} placeholder="No expiration" /></div>
        <div className="field"><label>Credential ID</label><input value={item.credential_id} onChange={event => update(index, 'credential_id', event.target.value)} /></div>
        <div className="field"><label>Verification URL</label><input type="url" value={item.credential_url} onChange={event => update(index, 'credential_url', event.target.value)} placeholder="https://..." /></div>
      </div>
    </div>)}
    <button className="btn-outline" onClick={() => setItems(current => [...current, empty()])}>+ Add Certification</button>
    <div className="edit-form-footer"><button className="btn-primary" disabled={saving} onClick={() => onSave({ certifications: items })}>{saving ? 'Saving...' : 'Save Certifications'}</button></div>
  </div>
}

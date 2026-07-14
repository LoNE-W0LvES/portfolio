import React, { useEffect, useState } from 'react'
import type { PortfolioSettings, WorkExperience } from '../../lib/supabase'

interface Props {
  settings: PortfolioSettings | null
  saving: boolean
  onSave: (updates: Partial<PortfolioSettings>) => Promise<void>
}

const empty = (): WorkExperience => ({
  role: '', company: '', period: '', location: '', url: '', description: '',
})

export default function EditExperience({ settings, saving, onSave }: Props) {
  const [items, setItems] = useState<WorkExperience[]>([])

  useEffect(() => {
    if (settings) setItems(JSON.parse(JSON.stringify(settings.work_experience ?? [])))
  }, [settings])

  const update = (index: number, key: keyof WorkExperience, value: string) =>
    setItems(current => current.map((item, i) => i === index ? { ...item, [key]: value } : item))

  const remove = (index: number) => setItems(current => current.filter((_, i) => i !== index))

  return (
    <div className="edit-edu-panel">
      {items.map((item, i) => (
        <div key={i} className="edit-edu-card">
          <div className="edit-edu-card-header">
            <span className="edit-edu-num">#{i + 1}</span>
            <button type="button" className="icon-btn icon-btn-danger" onClick={() => remove(i)} aria-label={`Remove experience ${i + 1}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
          <div className="edit-form-grid">
            <div className="field field-full">
              <label>Role / Position</label>
              <input value={item.role} onChange={e => update(i, 'role', e.target.value)} placeholder="Software Engineer" />
            </div>
            <div className="field field-full">
              <label>Company</label>
              <input value={item.company} onChange={e => update(i, 'company', e.target.value)} placeholder="Company name" />
            </div>
            <div className="field">
              <label>Period</label>
              <input value={item.period} onChange={e => update(i, 'period', e.target.value)} placeholder="2024 – Present" />
            </div>
            <div className="field">
              <label>Location</label>
              <input value={item.location} onChange={e => update(i, 'location', e.target.value)} placeholder="City, Country or Remote" />
            </div>
            <div className="field field-full">
              <label>Company Website</label>
              <input value={item.url} onChange={e => update(i, 'url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="field field-full">
              <label>Description</label>
              <textarea rows={4} value={item.description} onChange={e => update(i, 'description', e.target.value)} placeholder="Describe your responsibilities and achievements..." />
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="btn-outline" onClick={() => setItems(current => [...current, empty()])}>+ Add Experience</button>
      <div className="edit-form-footer">
        <button type="button" className="btn-primary" onClick={() => onSave({ work_experience: items })} disabled={saving}>
          {saving ? 'Saving...' : 'Save Experience'}
        </button>
      </div>
    </div>
  )
}

'use client'

import React, { useEffect, useState } from 'react'
import type { PortfolioSettings, Education } from '@/lib/supabase'

interface Props {
  settings: PortfolioSettings | null
  saving: boolean
  onSave: (updates: Partial<PortfolioSettings>) => Promise<void>
}

const empty = (): Education => ({ degree: '', institution: '', period: '', location: '', url: '', field: '' })

export default function EditEducation({ settings, saving, onSave }: Props) {
  const [items, setItems] = useState<Education[]>([])

  useEffect(() => {
    if (settings) setItems(JSON.parse(JSON.stringify(settings.education ?? [])))
  }, [settings])

  const update = (i: number, key: keyof Education, val: string) =>
    setItems(arr => arr.map((e, idx) => idx === i ? { ...e, [key]: val } : e))

  const remove = (i: number) => setItems(arr => arr.filter((_, idx) => idx !== i))

  const add = () => setItems(arr => [...arr, empty()])

  return (
    <div className="edit-edu-panel">
      {items.map((item, i) => (
        <div key={i} className="edit-edu-card">
          <div className="edit-edu-card-header">
            <span className="edit-edu-num">#{i + 1}</span>
            <button className="icon-btn icon-btn-danger" onClick={() => remove(i)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
          <div className="edit-form-grid">
            <div className="field field-full">
              <label>Degree / Program</label>
              <input value={item.degree} onChange={e => update(i, 'degree', e.target.value)} placeholder="B.Sc. in Computer Science" />
            </div>
            <div className="field field-full">
              <label>Institution</label>
              <input value={item.institution} onChange={e => update(i, 'institution', e.target.value)} placeholder="University Name" />
            </div>
            <div className="field">
              <label>Period</label>
              <input value={item.period} onChange={e => update(i, 'period', e.target.value)} placeholder="2018 – 2023" />
            </div>
            <div className="field">
              <label>Location</label>
              <input value={item.location} onChange={e => update(i, 'location', e.target.value)} placeholder="City, Country" />
            </div>
            <div className="field">
              <label>Website URL</label>
              <input value={item.url} onChange={e => update(i, 'url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="field">
              <label>Field (optional)</label>
              <input value={item.field} onChange={e => update(i, 'field', e.target.value)} placeholder="Information Technology" />
            </div>
          </div>
        </div>
      ))}
      <button className="btn-outline" onClick={add}>+ Add Education</button>
      <div className="edit-form-footer">
        <button className="btn-primary" onClick={() => onSave({ education: items })} disabled={saving}>
          {saving ? 'Saving...' : 'Save Education'}
        </button>
      </div>
    </div>
  )
}

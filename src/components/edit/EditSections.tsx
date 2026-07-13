import React, { useEffect, useState } from 'react'
import type { PortfolioSettings } from '../../lib/supabase'

interface Props {
  settings: PortfolioSettings | null
  saving: boolean
  onSave: (updates: Partial<PortfolioSettings>) => Promise<void>
}

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero / Intro',
  about: 'About Me',
  skills: 'Technical Skills',
  education: 'Education',
  repos: 'GitHub Repositories',
  cv_projects: 'Projects',
  awards: 'Awards & Recognition',
  contact: 'Contact',
}

export default function EditSections({ settings, saving, onSave }: Props) {
  const ALL = ['hero', 'about', 'skills', 'education', 'repos', 'cv_projects', 'awards', 'contact']
  const [order, setOrder] = useState<string[]>(ALL)
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL.map(k => [k, true]))
  )

  useEffect(() => {
    if (settings) {
      setOrder(settings.sections_order)
      setVisible(settings.sections_visible)
    }
  }, [settings])

  const moveUp = (i: number) => {
    if (i === 0) return
    const next = [...order];
    [next[i - 1], next[i]] = [next[i], next[i - 1]]
    setOrder(next)
  }

  const moveDown = (i: number) => {
    if (i === order.length - 1) return
    const next = [...order];
    [next[i], next[i + 1]] = [next[i + 1], next[i]]
    setOrder(next)
  }

  const toggleVisible = (key: string) => setVisible(v => ({ ...v, [key]: !v[key] }))

  return (
    <div className="edit-sections-panel">
      <p className="edit-hint">Use arrows to reorder. Toggle the eye to show or hide a section.</p>
      <ul className="sections-list">
        {order.map((key, i) => (
          <li key={key} className={`section-item ${visible[key] === false ? 'section-item-hidden' : ''}`}>
            <span className="section-item-label">
              <span className="section-drag-icon">⠿</span>
              {SECTION_LABELS[key] ?? key}
            </span>
            <div className="section-item-actions">
              <button className="section-action-btn" onClick={() => toggleVisible(key)} title={visible[key] === false ? 'Show' : 'Hide'}>
                {visible[key] === false ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
              <button className="section-action-btn" onClick={() => moveUp(i)} disabled={i === 0}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polyline points="18 15 12 9 6 15"/></svg>
              </button>
              <button className="section-action-btn" onClick={() => moveDown(i)} disabled={i === order.length - 1}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="edit-form-footer">
        <button className="btn-primary" onClick={() => onSave({ sections_order: order, sections_visible: visible })} disabled={saving}>
          {saving ? 'Saving...' : 'Save Layout'}
        </button>
      </div>
    </div>
  )
}

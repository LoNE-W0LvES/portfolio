'use client'

import React, { useEffect, useState } from 'react'
import type { PortfolioSettings, CvProject } from '@/lib/supabase'

interface Props {
  settings: PortfolioSettings | null
  saving: boolean
  onSave: (updates: Partial<PortfolioSettings>) => Promise<void>
}

const empty = (): CvProject => ({ title: '', description: '', tags: [] })

export default function EditCvProjects({ settings, saving, onSave }: Props) {
  const [items, setItems] = useState<CvProject[]>([])
  const [newTag, setNewTag] = useState<Record<number, string>>({})

  useEffect(() => {
    if (settings) setItems(JSON.parse(JSON.stringify(settings.cv_projects ?? [])))
  }, [settings])

  const update = (i: number, key: 'title' | 'description', val: string) =>
    setItems(arr => arr.map((p, idx) => idx === i ? { ...p, [key]: val } : p))

  const addTag = (i: number) => {
    const val = (newTag[i] ?? '').trim()
    if (!val) return
    setItems(arr => arr.map((p, idx) => idx === i ? { ...p, tags: [...p.tags, val] } : p))
    setNewTag(t => ({ ...t, [i]: '' }))
  }

  const removeTag = (pi: number, ti: number) =>
    setItems(arr => arr.map((p, idx) => idx === pi ? { ...p, tags: p.tags.filter((_, j) => j !== ti) } : p))

  const remove = (i: number) => setItems(arr => arr.filter((_, idx) => idx !== i))
  const add = () => setItems(arr => [...arr, empty()])

  const moveUp = (i: number) => {
    if (i === 0) return
    setItems(arr => { const a = [...arr]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a })
  }
  const moveDown = (i: number) => {
    if (i === items.length - 1) return
    setItems(arr => { const a = [...arr]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a })
  }

  return (
    <div className="edit-cvp-panel">
      {items.map((item, i) => (
        <div key={i} className="edit-edu-card">
          <div className="edit-edu-card-header">
            <span className="edit-edu-num">{item.title || `Project #${i + 1}`}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="icon-btn" onClick={() => moveUp(i)} disabled={i === 0}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="18 15 12 9 6 15"/></svg>
              </button>
              <button className="icon-btn" onClick={() => moveDown(i)} disabled={i === items.length - 1}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <button className="icon-btn icon-btn-danger" onClick={() => remove(i)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          </div>
          <div className="field">
            <label>Title</label>
            <input value={item.title} onChange={e => update(i, 'title', e.target.value)} placeholder="Project title" />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Description</label>
            <textarea value={item.description} onChange={e => update(i, 'description', e.target.value)} rows={3} placeholder="What it does..." />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Tags</label>
            <div className="skill-tags skill-tags-edit">
              {item.tags.map((t, ti) => (
                <span key={ti} className="cvp-tag skill-tag-removable">
                  {t}<button onClick={() => removeTag(i, ti)} className="tag-remove">×</button>
                </span>
              ))}
              <div className="tag-add-row">
                <input
                  className="tag-add-input"
                  placeholder="Add tag..."
                  value={newTag[i] ?? ''}
                  onChange={e => setNewTag(t => ({ ...t, [i]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addTag(i)}
                />
                <button className="tag-add-btn" onClick={() => addTag(i)}>+</button>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button className="btn-outline" onClick={add}>+ Add Project</button>
      <div className="edit-form-footer">
        <button className="btn-primary" onClick={() => onSave({ cv_projects: items })} disabled={saving}>
          {saving ? 'Saving...' : 'Save Projects'}
        </button>
      </div>
    </div>
  )
}

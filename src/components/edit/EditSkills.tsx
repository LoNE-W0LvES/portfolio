import React, { useEffect, useState } from 'react'
import type { PortfolioSettings, Skill } from '../../lib/supabase'

interface Props {
  settings: PortfolioSettings | null
  saving: boolean
  onSave: (updates: Partial<PortfolioSettings>) => Promise<void>
}

export default function EditSkills({ settings, saving, onSave }: Props) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [digitalSkills, setDigitalSkills] = useState<string[]>([])
  const [newTag, setNewTag] = useState<Record<number, string>>({})

  useEffect(() => {
    if (settings) {
      setSkills(JSON.parse(JSON.stringify(settings.skills ?? [])))
      setDigitalSkills([...(settings.digital_skills ?? [])])
    }
  }, [settings])

  const updateCategory = (i: number, val: string) =>
    setSkills(s => s.map((g, idx) => idx === i ? { ...g, category: val } : g))

  const addItem = (i: number) => {
    const val = (newTag[i] ?? '').trim()
    if (!val) return
    setSkills(s => s.map((g, idx) => idx === i ? { ...g, items: [...g.items, val] } : g))
    setNewTag(t => ({ ...t, [i]: '' }))
  }

  const removeItem = (gi: number, ii: number) =>
    setSkills(s => s.map((g, idx) => idx === gi ? { ...g, items: g.items.filter((_, j) => j !== ii) } : g))

  const removeGroup = (i: number) => setSkills(s => s.filter((_, idx) => idx !== i))

  const addGroup = () => setSkills(s => [...s, { category: 'New Category', items: [] }])

  const addDigital = () => {
    const val = (newTag[-1] ?? '').trim()
    if (!val) return
    setDigitalSkills(d => [...d, val])
    setNewTag(t => ({ ...t, [-1]: '' }))
  }

  const removeDigital = (i: number) => setDigitalSkills(d => d.filter((_, idx) => idx !== i))

  return (
    <div className="edit-skills-panel">
      {skills.map((group, gi) => (
        <div key={gi} className="edit-skill-group">
          <div className="edit-skill-group-header">
            <input
              className="edit-skill-category-input"
              value={group.category}
              onChange={e => updateCategory(gi, e.target.value)}
            />
            <button className="icon-btn icon-btn-danger" onClick={() => removeGroup(gi)} title="Remove group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
          </div>
          <div className="skill-tags skill-tags-edit">
            {group.items.map((item, ii) => (
              <span key={ii} className="skill-tag skill-tag-removable">
                {item}
                <button onClick={() => removeItem(gi, ii)} className="tag-remove">×</button>
              </span>
            ))}
            <div className="tag-add-row">
              <input
                className="tag-add-input"
                placeholder="Add skill..."
                value={newTag[gi] ?? ''}
                onChange={e => setNewTag(t => ({ ...t, [gi]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addItem(gi)}
              />
              <button className="tag-add-btn" onClick={() => addItem(gi)}>+</button>
            </div>
          </div>
        </div>
      ))}

      <button className="btn-outline" onClick={addGroup}>+ Add Skill Group</button>

      <div className="edit-skill-group" style={{ marginTop: 24 }}>
        <div className="edit-skill-group-header">
          <span className="edit-skill-category-label">Digital Skills</span>
        </div>
        <div className="skill-tags skill-tags-edit">
          {digitalSkills.map((s, i) => (
            <span key={i} className="skill-tag skill-tag-soft skill-tag-removable">
              {s}<button onClick={() => removeDigital(i)} className="tag-remove">×</button>
            </span>
          ))}
          <div className="tag-add-row">
            <input
              className="tag-add-input"
              placeholder="Add digital skill..."
              value={newTag[-1] ?? ''}
              onChange={e => setNewTag(t => ({ ...t, [-1]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addDigital()}
            />
            <button className="tag-add-btn" onClick={addDigital}>+</button>
          </div>
        </div>
      </div>

      <div className="edit-form-footer">
        <button className="btn-primary" onClick={() => onSave({ skills, digital_skills: digitalSkills })} disabled={saving}>
          {saving ? 'Saving...' : 'Save Skills'}
        </button>
      </div>
    </div>
  )
}

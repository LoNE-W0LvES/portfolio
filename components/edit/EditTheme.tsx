'use client'

import React, { useEffect, useState } from 'react'
import type { PortfolioSettings } from '@/lib/supabase'

interface Props {
  settings: PortfolioSettings | null
  saving: boolean
  onSave: (updates: Partial<PortfolioSettings>) => Promise<void>
}

const ACCENT_PRESETS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#64748b', '#0ea5e9',
]

export default function EditTheme({ settings, saving, onSave }: Props) {
  const [accent, setAccent] = useState('#3b82f6')

  useEffect(() => {
    if (settings) {
      setAccent(settings.accent_color)
    }
  }, [settings])

  const handleSave = () => onSave({ accent_color: accent })

  return (
    <div className="edit-theme-panel">
      <div className="edit-section-group">
        <h3 className="edit-group-title">Accent Color</h3>
        <p className="edit-hint" style={{ marginBottom: 0 }}>
          Choose the accent color used for buttons, links, and highlights across your portfolio.
        </p>
        <div className="accent-presets">
          {ACCENT_PRESETS.map(color => (
            <button
              key={color}
              className={`accent-preset ${accent === color ? 'active' : ''}`}
              style={{ background: color }}
              onClick={() => setAccent(color)}
              title={color}
            />
          ))}
        </div>
        <div className="accent-custom">
          <label>Custom color</label>
          <div className="accent-custom-input">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="color-picker" />
            <input type="text" value={accent} onChange={e => setAccent(e.target.value)} placeholder="#3b82f6" maxLength={7} className="color-text" />
          </div>
        </div>
        <div className="accent-preview">
          <span>Preview:</span>
          <button style={{ background: accent }} className="btn-primary" type="button">Button</button>
        </div>
      </div>

      <div className="edit-form-footer">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Theme'}
        </button>
      </div>
    </div>
  )
}

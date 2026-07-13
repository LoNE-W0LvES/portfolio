import React, { useEffect, useState } from 'react'
import type { PortfolioSettings, Theme } from '../../lib/supabase'

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
  const [theme, setTheme] = useState<Theme>('dark')
  const [accent, setAccent] = useState('#3b82f6')

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme)
      setAccent(settings.accent_color)
    }
  }, [settings])

  const handleSave = () => {
    onSave({ theme, accent_color: accent })
  }

  return (
    <div className="edit-theme-panel">
      <div className="edit-section-group">
        <h3 className="edit-group-title">Color Theme</h3>
        <div className="theme-options">
          {(['light', 'dark', 'auto'] as Theme[]).map(t => (
            <button
              key={t}
              className={`theme-option ${theme === t ? 'active' : ''}`}
              onClick={() => setTheme(t)}
            >
              <span className="theme-option-icon">
                {t === 'light' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
                {t === 'dark' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                )}
                {t === 'auto' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                )}
              </span>
              <span className="theme-option-label">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="edit-section-group">
        <h3 className="edit-group-title">Accent Color</h3>
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
            <input
              type="color"
              value={accent}
              onChange={e => setAccent(e.target.value)}
              className="color-picker"
            />
            <input
              type="text"
              value={accent}
              onChange={e => setAccent(e.target.value)}
              placeholder="#3b82f6"
              maxLength={7}
              className="color-text"
            />
          </div>
        </div>
        <div className="accent-preview">
          <span>Preview: </span>
          <button style={{ background: accent }} className="btn-primary accent-preview-btn">
            Button
          </button>
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

import React, { useEffect, useState } from 'react'
import type { PortfolioSettings, ViewerTheme } from '../../lib/supabase'

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
  const [viewerTheme, setViewerTheme] = useState<ViewerTheme>('default')

  useEffect(() => {
    if (settings) {
      setAccent(settings.accent_color)
      setViewerTheme(settings.viewer_theme ?? 'default')
    }
  }, [settings])

  const handleSave = () => onSave({ accent_color: accent, viewer_theme: viewerTheme })

  return (
    <div className="edit-theme-panel">
      <div className="edit-section-group">
        <h3 className="edit-group-title">Portfolio Viewer Theme</h3>
        <p className="edit-hint" style={{ marginBottom: 0 }}>Changes only the public portfolio viewer. The editor keeps its current interface.</p>
        <div className="viewer-theme-grid">
          <button type="button" className={`viewer-theme-card default-preview ${viewerTheme === 'default' ? 'active' : ''}`} onClick={() => setViewerTheme('default')}><span className="viewer-theme-visual"><i/><i/><i/></span><strong>Default</strong><small>Clean, familiar portfolio layout</small></button>
          <button type="button" className={`viewer-theme-card kinetic-preview ${viewerTheme === 'kinetic' ? 'active' : ''}`} onClick={() => setViewerTheme('kinetic')}><span className="viewer-theme-visual"><b>MOVE</b><i/></span><strong>Kinetic</strong><small>Editorial layout with immersive motion</small></button>
        </div>
      </div>
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

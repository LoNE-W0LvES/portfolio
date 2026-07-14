import React, { useEffect, useState } from 'react'
import type { PortfolioSettings } from '../../lib/supabase'
import './EditSeo.css'

interface Props {
  settings: PortfolioSettings | null
  saving: boolean
  onSave: (updates: Partial<PortfolioSettings>) => void
}

export default function EditSeo({ settings, saving, onSave }: Props) {
  const [form, setForm] = useState({ seo_title: '', seo_description: '', social_image_url: '', favicon_url: '', search_indexable: true, is_published: false })

  useEffect(() => {
    if (!settings) return
    setForm({
      seo_title: settings.seo_title || '',
      seo_description: settings.seo_description || '',
      social_image_url: settings.social_image_url || '',
      favicon_url: settings.favicon_url || '',
      search_indexable: settings.search_indexable ?? true,
      is_published: settings.is_published,
    })
  }, [settings])

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm(current => ({ ...current, [key]: value }))
  const previewTitle = form.seo_title || settings?.display_name || 'Portfolio'
  const previewDescription = form.seo_description || settings?.bio || 'Personal portfolio'

  return <div className="edit-seo-panel">
    <div className="edit-section-group">
      <h3 className="edit-group-title">Publishing</h3>
      <label className="seo-toggle"><input type="checkbox" checked={form.is_published} onChange={event => update('is_published', event.target.checked)} /><span><strong>Publish portfolio</strong><small>When disabled, your username portfolio is hidden from public visitors.</small></span></label>
      <label className="seo-toggle"><input type="checkbox" checked={form.search_indexable} onChange={event => update('search_indexable', event.target.checked)} /><span><strong>Allow search engine indexing</strong><small>Disable this to ask Google and other search engines not to list this portfolio.</small></span></label>
    </div>
    <div className="edit-section-group">
      <h3 className="edit-group-title">Search & Social Details</h3>
      <div className="edit-form-grid">
        <div className="field field-full"><label>Page title</label><input value={form.seo_title} maxLength={70} placeholder={`${settings?.display_name || 'Your name'} — Portfolio`} onChange={event => update('seo_title', event.target.value)} /><span className="field-help">{form.seo_title.length}/70 characters</span></div>
        <div className="field field-full"><label>Meta description</label><textarea value={form.seo_description} maxLength={170} rows={4} placeholder={settings?.bio || 'A short description of this portfolio.'} onChange={event => update('seo_description', event.target.value)} /><span className="field-help">{form.seo_description.length}/170 characters</span></div>
        <div className="field field-full"><label>Social sharing image URL</label><input type="url" value={form.social_image_url} placeholder="https://example.com/social-preview.jpg" onChange={event => update('social_image_url', event.target.value)} /></div>
        <div className="field field-full"><label>Favicon URL</label><input type="url" value={form.favicon_url} placeholder="https://example.com/favicon.png" onChange={event => update('favicon_url', event.target.value)} /></div>
      </div>
    </div>
    <div className="edit-section-group">
      <h3 className="edit-group-title">Sharing Preview</h3>
      <div className="seo-preview">{form.social_image_url && <img src={form.social_image_url} alt="Social preview" />}<div><strong>{previewTitle}</strong><p>{previewDescription}</p><small>{window.location.origin}/{settings?.slug || 'username'}/</small></div></div>
    </div>
    <div className="edit-form-footer"><button className="btn-primary" disabled={saving} onClick={() => onSave(form)}>{saving ? 'Saving...' : 'Save SEO & Sharing'}</button></div>
  </div>
}

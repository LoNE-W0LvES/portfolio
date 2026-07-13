import React, { useEffect, useState } from 'react'
import type { PortfolioSettings } from '../../lib/supabase'

interface Props {
  settings: PortfolioSettings | null
  saving: boolean
  onSave: (updates: Partial<PortfolioSettings>) => Promise<void>
}

export default function EditProfile({ settings, saving, onSave }: Props) {
  const [form, setForm] = useState({
    display_name: '',
    title: '',
    bio: '',
    avatar_url: '',
    email: '',
    location: '',
    github_username: '',
    website_url: '',
    linkedin_url: '',
    twitter_url: '',
  })

  useEffect(() => {
    if (settings) {
      setForm({
        display_name: settings.display_name,
        title: settings.title,
        bio: settings.bio,
        avatar_url: settings.avatar_url,
        email: settings.email,
        location: settings.location,
        github_username: settings.github_username,
        website_url: settings.website_url,
        linkedin_url: settings.linkedin_url,
        twitter_url: settings.twitter_url,
      })
    }
  }, [settings])

  const set = (key: string, value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <div className="edit-form-grid">
        <div className="field">
          <label>Display Name</label>
          <input value={form.display_name} onChange={e => set('display_name', e.target.value)} placeholder="Your Name" />
        </div>
        <div className="field">
          <label>Title / Role</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Full Stack Developer" />
        </div>
        <div className="field field-full">
          <label>Bio</label>
          <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={4} placeholder="Tell visitors about yourself..." />
        </div>
        <div className="field">
          <label>Avatar URL</label>
          <input value={form.avatar_url} onChange={e => set('avatar_url', e.target.value)} placeholder="https://..." />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label>Location</label>
          <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, Country" />
        </div>
        <div className="field">
          <label>GitHub Username</label>
          <input value={form.github_username} onChange={e => set('github_username', e.target.value)} placeholder="octocat" />
        </div>
        <div className="field">
          <label>Website URL</label>
          <input value={form.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://yoursite.com" />
        </div>
        <div className="field">
          <label>LinkedIn URL</label>
          <input value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
        </div>
        <div className="field">
          <label>Twitter / X URL</label>
          <input value={form.twitter_url} onChange={e => set('twitter_url', e.target.value)} placeholder="https://x.com/..." />
        </div>
      </div>
      <div className="edit-form-footer">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}

import React, { useEffect, useState } from 'react'
import { supabase, type PortfolioSettings } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { tr } from '../../lib/i18n'

const AVATAR_BUCKET = 'avatars'
const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

interface StoredAvatar {
  path: string
  name: string
  url: string
  created_at: string | null
}

function getAvatarPathFromUrl(url: string): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`
    const idx = parsed.pathname.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(parsed.pathname.slice(idx + marker.length))
  } catch {
    return null
  }
}

interface Props {
  settings: PortfolioSettings | null
  saving: boolean
  onSave: (updates: Partial<PortfolioSettings>) => Promise<void>
}

export default function EditProfile({ settings, saving, onSave }: Props) {
  const t = (key: Parameters<typeof tr>[1]) => tr(settings?.preferred_language, key)
  const { siteUserId, isAdmin } = useAuth()
  const [form, setForm] = useState({
    display_name: '',
    title: '',
    bio: '',
    avatar_url: '',
    location: '',
    nationality: '',
    github_username: '',
    preferred_language: 'en' as PortfolioSettings['preferred_language'],
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarsLoading, setAvatarsLoading] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState('')
  const [storedAvatars, setStoredAvatars] = useState<StoredAvatar[]>([])

  useEffect(() => {
    if (settings) {
      setForm({
        display_name: settings.display_name,
        title: settings.title,
        bio: settings.bio,
        avatar_url: settings.avatar_url,
        location: settings.location,
        nationality: settings.nationality,
        github_username: settings.github_username,
        preferred_language: settings.preferred_language ?? 'en',
      })
    }
  }, [settings])

  const loadStoredAvatars = async () => {
    setAvatarsLoading(true)
    const { data, error } = await supabase
      .storage
      .from(AVATAR_BUCKET)
      .list(isAdmin ? '' : (siteUserId ?? ''), { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

    if (error) {
      setAvatarMsg(`Failed to load uploaded images: ${error.message}`)
      setStoredAvatars([])
      setAvatarsLoading(false)
      return
    }

    const rows = (data ?? [])
      .filter(file => !!file.name && !file.name.endsWith('/'))
      .map(file => {
        return {
          path: isAdmin ? file.name : `${siteUserId}/${file.name}`,
          name: file.name,
          created_at: file.created_at ?? null,
          url: supabase.storage.from(AVATAR_BUCKET).getPublicUrl(isAdmin ? file.name : `${siteUserId}/${file.name}`).data.publicUrl,
        }
      })

    setStoredAvatars(rows)
    setAvatarsLoading(false)
  }

  useEffect(() => {
    loadStoredAvatars()
  }, [siteUserId, isAdmin])

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm(f => ({ ...f, [key]: value }))

  const handleAvatarUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setAvatarMsg('Choose a JPG, PNG, WebP, or GIF image.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarMsg('The image must be 5 MB or smaller.')
      e.target.value = ''
      return
    }

    setUploadingAvatar(true)
    setAvatarMsg('')

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40) || 'avatar'
    const fileName = `${Date.now()}-${baseName}.${ext}`
    const path = isAdmin ? fileName : `${siteUserId}/${fileName}`

    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      setAvatarMsg(`Upload failed: ${error.message}`)
      setUploadingAvatar(false)
      e.target.value = ''
      return
    }

    const publicUrl = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl
    set('avatar_url', publicUrl)
    await onSave({ avatar_url: publicUrl })
    setAvatarMsg('Avatar uploaded and selected.')
    await loadStoredAvatars()
    setUploadingAvatar(false)
    e.target.value = ''
  }

  const handleUseAvatar = async (url: string) => {
    setAvatarMsg('')
    set('avatar_url', url)
    await onSave({ avatar_url: url })
    setAvatarMsg('Avatar updated.')
  }

  const handleDeleteAvatar = async (path: string) => {
    if (!window.confirm('Permanently delete this uploaded image?')) return
    setAvatarMsg('')
    const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path])
    if (error) {
      setAvatarMsg(`Delete failed: ${error.message}`)
      return
    }

    const currentPath = getAvatarPathFromUrl(form.avatar_url)
    if (currentPath === path) {
      set('avatar_url', '')
      await onSave({ avatar_url: '' })
    }
    await loadStoredAvatars()
    setAvatarMsg('Image deleted.')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <div className="edit-form-grid">
        <div className="field">
          <label>{t('displayName')}</label>
          <input value={form.display_name} onChange={e => set('display_name', e.target.value)} placeholder="Your Name" />
        </div>
        <div className="field">
          <label>{t('titleRole')}</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Full Stack Developer" />
        </div>
        <div className="field field-full">
          <label>{t('bio')}</label>
          <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={4} placeholder="Tell visitors about yourself..." />
        </div>
        <div className="field">
          <label>{t('avatarUrl')}</label>
          <input value={form.avatar_url} onChange={e => set('avatar_url', e.target.value)} placeholder="https://..." />
        </div>
        <div className="field field-full avatar-manager">
          <label>{t('avatarManager')}</label>
          <div className="avatar-upload-row">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar || saving}
            />
            {uploadingAvatar && <span className="avatar-uploading-text">Uploading...</span>}
          </div>
          <p className="avatar-help">JPG, PNG, WebP, or GIF. Maximum size: 5 MB.</p>
          {avatarMsg && <p className="avatar-msg">{avatarMsg}</p>}

          <div className="avatar-current">
            <span>Current:</span>
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="Current avatar" className="avatar-thumb" />
            ) : (
              <span className="avatar-empty">No avatar selected</span>
            )}
          </div>

          <div className="avatar-gallery">
            {avatarsLoading && <p className="avatar-empty">Loading uploaded images...</p>}
            {!avatarsLoading && storedAvatars.length === 0 && <p className="avatar-empty">No uploaded images yet.</p>}
            {!avatarsLoading && storedAvatars.length > 0 && (
              <div className="avatar-grid">
                {storedAvatars.map(item => {
                  const isActive = form.avatar_url === item.url
                  return (
                    <div key={item.path} className={`avatar-card ${isActive ? 'active' : ''}`}>
                      <img src={item.url} alt={item.name} className="avatar-thumb" />
                      <p className="avatar-name" title={item.name}>{item.name}</p>
                      <div className="avatar-actions">
                        <button type="button" className="btn-primary" disabled={saving || isActive} onClick={() => handleUseAvatar(item.url)}>
                          {isActive ? 'Selected' : 'Use'}
                        </button>
                        <button type="button" className="repo-toggle-btn hidden" disabled={saving} onClick={() => handleDeleteAvatar(item.path)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="field">
          <label>{t('nationality')}</label>
          <input value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="Bangladeshi" />
        </div>
        <div className="field">
          <label>{t('location')}</label>
          <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Dhaka, Bangladesh" />
        </div>
        <div className="field">
          <label>{t('githubUsername')}</label>
          <input value={form.github_username} onChange={e => set('github_username', e.target.value)} placeholder="octocat" />
        </div>
        <div className="field">
          <label>{t('language')}</label>
          <select value={form.preferred_language} onChange={e => set('preferred_language', e.target.value as PortfolioSettings['preferred_language'])}>
            <option value="en">English</option><option value="bn">বাংলা</option><option value="ja">日本語</option><option value="zh">简体中文</option><option value="th">ไทย</option><option value="id">Bahasa Indonesia</option><option value="ko">한국어</option>
          </select>
        </div>
      </div>
      <div className="edit-form-footer">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t('saving') : t('saveProfile')}
        </button>
      </div>
    </form>
  )
}

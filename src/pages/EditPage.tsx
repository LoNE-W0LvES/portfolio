import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { supabase } from '../lib/supabase'
import type { GitHubRepo, PortfolioSettings } from '../lib/supabase'
import EditProfile from '../components/edit/EditProfile'
import EditSections from '../components/edit/EditSections'
import EditTheme from '../components/edit/EditTheme'
import EditRepos from '../components/edit/EditRepos'
import EditSkills from '../components/edit/EditSkills'
import EditCvProjects from '../components/edit/EditCvProjects'
import EditEducation from '../components/edit/EditEducation'
import EditExperience from '../components/edit/EditExperience'
import AdminUsers from '../components/edit/AdminUsers'
import EditContacts from '../components/edit/EditContacts'
import EditSeo from '../components/edit/EditSeo'
import EditCertifications from '../components/edit/EditCertifications'
import EditAnalytics from '../components/edit/EditAnalytics'
import EditBackup from '../components/edit/EditBackup'
import EditServicesTestimonials from '../components/edit/EditServicesTestimonials'
import EditCvExport from '../components/edit/EditCvExport'
import EditAwardsRecognition from '../components/edit/EditAwardsRecognition'

type Tab = 'profile' | 'sections' | 'theme' | 'seo' | 'analytics' | 'backup' | 'cv_export' | 'services' | 'awards' | 'repos' | 'skills' | 'projects' | 'education' | 'certifications' | 'experience' | 'contacts' | 'users'

export default function EditPage() {
  const { isOwner, isAdmin, username: currentUsername, loading: authLoading, signOut } = useAuth()
  const { username: routeUsername } = useParams()
  const { settings, repoVisibility, refresh } = usePortfolio()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('profile')
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [reposLoading, setReposLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    if (!authLoading && (!isOwner || routeUsername?.toLowerCase() !== currentUsername)) navigate('/login')
  }, [authLoading, isOwner, routeUsername, currentUsername, navigate])

  useEffect(() => {
    if (!settings?.github_username) return
    setReposLoading(true)
    fetch(`https://api.github.com/users/${settings.github_username}/repos?per_page=100&sort=updated`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRepos(data); setReposLoading(false) })
      .catch(() => setReposLoading(false))
  }, [settings?.github_username])

  const saveSettings = async (updates: Partial<PortfolioSettings>) => {
    setSaving(true)
    setSaveMsg('')
    try {
      const { data, error } = await supabase
        .from('portfolio_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', settings?.id ?? -1)
        .select('id')
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Database update was blocked. Check the portfolio_settings UPDATE policy for your logged-in user.')

      setSaveMsg('Saved!')
      await refresh()
      setTimeout(() => setSaveMsg(''), 2500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown database error'
      setSaveMsg('Error: ' + message)
    } finally {
      setSaving(false)
    }
  }

  const toggleRepoVisibility = async (repoName: string, fullName: string, visible: boolean) => {
    const existing = repoVisibility.find(r => r.repo_name === fullName || r.repo_name === repoName)
    if (existing) {
      await supabase.from('repo_visibility').update({ visible }).eq('id', existing.id)
    } else {
      await supabase.from('repo_visibility').insert({ owner_id: settings?.owner_id, repo_name: fullName, visible })
    }
    await refresh()
  }

  if (authLoading) return <div className="portfolio-loading"><div className="spinner" /></div>
  if (!isOwner) return null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'sections', label: 'Sections' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'services', label: 'Services & Testimonials' },
    { id: 'awards', label: 'Awards & Recognition' },
    { id: 'experience', label: 'Experience' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'projects', label: 'Projects' },
    { id: 'repos', label: 'Repos' },
    ...(isAdmin ? [{ id: 'users' as Tab, label: 'Users' }] : []),
    { id: 'theme', label: 'Theme' },
    { id: 'seo', label: 'SEO & Sharing' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'backup', label: 'Backup' },
    { id: 'cv_export', label: 'Export CV' },
  ]

  return (
    <div className="edit-page">
      <header className="edit-header">
        <div className="edit-header-left">
          <button onClick={() => navigate(`/${currentUsername}/`)} className="edit-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M19 12H5M5 12l7 7M5 12l7-7"/></svg>
            View Portfolio
          </button>
          <h1 className="edit-title">Edit Portfolio</h1>
        </div>
        <div className="edit-header-right">
          {saveMsg && <span className={`save-msg ${saveMsg.startsWith('Error') ? 'save-msg-error' : 'save-msg-ok'}`}>{saveMsg}</span>}
          <button onClick={signOut} className="edit-signout-btn">Sign Out</button>
        </div>
      </header>

      <nav className="edit-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`edit-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="edit-main">
        {tab === 'profile' && <EditProfile settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'sections' && <EditSections settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'theme' && <EditTheme settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'seo' && <EditSeo settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'analytics' && <EditAnalytics settings={settings} />}
        {tab === 'backup' && <EditBackup settings={settings} saving={saving} onSave={saveSettings} onRefresh={refresh} />}
        {tab === 'cv_export' && <EditCvExport settings={settings} />}
        {tab === 'skills' && <EditSkills settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'education' && <EditEducation settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'certifications' && <EditCertifications settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'services' && <EditServicesTestimonials settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'awards' && <EditAwardsRecognition settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'experience' && <EditExperience settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'contacts' && <EditContacts settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'projects' && <EditCvProjects settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'repos' && (
          <EditRepos
            repos={repos}
            loading={reposLoading}
            repoVisibility={repoVisibility}
            onToggle={toggleRepoVisibility}
            githubUsername={settings?.github_username ?? ''}
          />
        )}
        {tab === 'users' && isAdmin && <AdminUsers />}
      </main>
    </div>
  )
}

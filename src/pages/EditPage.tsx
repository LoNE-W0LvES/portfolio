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

type Tab = 'profile' | 'sections' | 'theme' | 'repos' | 'skills' | 'projects' | 'education' | 'experience' | 'users'

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
    if (!authLoading && (!isOwner || routeUsername?.toLowerCase() !== currentUsername)) navigate('/private-login')
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
    { id: 'theme', label: 'Theme' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'repos', label: 'Repos' },
    ...(isAdmin ? [{ id: 'users' as Tab, label: 'Users' }] : []),
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
        {tab === 'skills' && <EditSkills settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'education' && <EditEducation settings={settings} saving={saving} onSave={saveSettings} />}
        {tab === 'experience' && <EditExperience settings={settings} saving={saving} onSave={saveSettings} />}
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

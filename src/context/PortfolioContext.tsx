import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PortfolioSettings, RepoVisibility } from '../lib/supabase'

interface PortfolioContextValue {
  settings: PortfolioSettings | null
  repoVisibility: RepoVisibility[]
  loading: boolean
  refresh: () => Promise<void>
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null)

const defaultSettings: PortfolioSettings = {
  id: 1,
  github_username: '',
  display_name: 'Developer',
  title: 'Full Stack Engineer',
  bio: '',
  avatar_url: '',
  email: '',
  location: '',
  website_url: '',
  linkedin_url: '',
  twitter_url: '',
  sections_order: ['hero', 'about', 'repos', 'contact'],
  sections_visible: { hero: true, about: true, repos: true, contact: true },
  theme: 'dark',
  accent_color: '#3b82f6',
  created_at: '',
  updated_at: '',
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PortfolioSettings | null>(null)
  const [repoVisibility, setRepoVisibility] = useState<RepoVisibility[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const [{ data: settingsData }, { data: visData }] = await Promise.all([
      supabase.from('portfolio_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('repo_visibility').select('*'),
    ])
    setSettings(settingsData ?? defaultSettings)
    setRepoVisibility(visData ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  return (
    <PortfolioContext.Provider value={{ settings, repoVisibility, loading, refresh: fetchData }}>
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider')
  return ctx
}

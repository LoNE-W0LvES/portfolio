import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PortfolioSettings, RepoVisibility, Theme } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useLocation } from 'react-router-dom'

interface PortfolioContextValue {
  settings: PortfolioSettings | null
  repoVisibility: RepoVisibility[]
  loading: boolean
  refresh: () => Promise<void>
  updateTheme: (theme: Theme) => Promise<void>
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null)

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { session, isOwner, siteUserId, username, loading: authLoading } = useAuth()
  const location = useLocation()
  const [settings, setSettings] = useState<PortfolioSettings | null>(null)
  const [repoVisibility, setRepoVisibility] = useState<RepoVisibility[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (authLoading) return
    setLoading(true)
    const parts = location.pathname.split('/').filter(Boolean).map(part => part.toLowerCase())
    const segment = parts[0]
    const isEditRoute = parts[1] === 'edit' && segment === username
    const isSystemRoute = !segment || ['private-login', 'api'].includes(segment)
    const settingsQuery = isEditRoute && session && isOwner && siteUserId
      ? supabase.from('portfolio_settings').select('*').eq('owner_id', siteUserId).maybeSingle()
      : !isSystemRoute
        ? supabase.from('portfolio_settings').select('*').eq('slug', segment).eq('is_published', true).maybeSingle()
        : supabase.from('portfolio_settings').select('*').eq('is_primary', true).maybeSingle()
    const { data: s, error: settingsError } = await settingsQuery
    const { data: v, error: visibilityError } = s?.owner_id
      ? await supabase.from('repo_visibility').select('*').eq('owner_id', s.owner_id)
      : { data: [], error: null }
    if (settingsError) console.error('Failed to load portfolio settings:', settingsError.message)
    if (visibilityError) console.error('Failed to load repository visibility:', visibilityError.message)
    setSettings(s)
    setRepoVisibility(v ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [authLoading, session?.user.id, isOwner, siteUserId, username, location.pathname])

  const updateTheme = async (theme: Theme) => {
    setSettings(prev => prev ? { ...prev, theme } : prev)
    await supabase
      .from('portfolio_settings')
      .update({ theme, updated_at: new Date().toISOString() })
      .eq('id', settings?.id ?? -1)
  }

  return (
    <PortfolioContext.Provider value={{ settings, repoVisibility, loading, refresh: fetchData, updateTheme }}>
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider')
  return ctx
}

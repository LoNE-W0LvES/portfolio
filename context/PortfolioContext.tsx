'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PortfolioSettings, RepoVisibility, Theme } from '@/lib/supabase'

interface PortfolioContextValue {
  settings: PortfolioSettings | null
  repoVisibility: RepoVisibility[]
  loading: boolean
  refresh: () => Promise<void>
  updateTheme: (theme: Theme) => Promise<void>
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null)

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PortfolioSettings | null>(null)
  const [repoVisibility, setRepoVisibility] = useState<RepoVisibility[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const [settingsRes, visRes] = await Promise.all([
      supabase.from('portfolio_settings').select('*').eq('id', 1).single(),
      supabase.from('repo_visibility').select('*'),
    ])

    if (settingsRes.data) setSettings(settingsRes.data as PortfolioSettings)
    if (visRes.data) setRepoVisibility(visRes.data as RepoVisibility[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const updateTheme = async (theme: Theme) => {
    setSettings(prev => prev ? { ...prev, theme } : prev)
    await supabase
      .from('portfolio_settings')
      .update({ theme, updated_at: new Date().toISOString() })
      .eq('id', 1)
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

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

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PortfolioSettings | null>(null)
  const [repoVisibility, setRepoVisibility] = useState<RepoVisibility[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const [{ data: s }, { data: v }] = await Promise.all([
      supabase.from('portfolio_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('repo_visibility').select('*'),
    ])
    setSettings(s)
    setRepoVisibility(v ?? [])
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

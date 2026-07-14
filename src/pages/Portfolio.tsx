import React, { useEffect, useMemo, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import type { GitHubRepo } from '../lib/supabase'
import DefaultPortfolio from '../themes/default/DefaultPortfolio'

const KineticPortfolio = React.lazy(() => import('../themes/kinetic/KineticPortfolio'))

export default function Portfolio() {
  const { settings, repoVisibility, loading, updateTheme } = usePortfolio()
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [reposLoading, setReposLoading] = useState(false)

  useEffect(() => {
    if (!settings?.github_username) return
    setReposLoading(true)
    fetch(`https://api.github.com/users/${settings.github_username}/repos?per_page=100&sort=updated`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRepos(data); setReposLoading(false) })
      .catch(() => setReposLoading(false))
  }, [settings?.github_username])

  const visibleRepos = useMemo(() => {
    const hiddenSet = new Set(repoVisibility.filter(r => !r.visible).map(r => r.repo_name))
    return repos.filter(r => !hiddenSet.has(r.full_name) && !hiddenSet.has(r.name))
  }, [repos, repoVisibility])

  if (loading) {
    return <div className="portfolio-loading"><div className="spinner" /></div>
  }

  if (!settings) {
    return <div className="portfolio-loading"><p>Portfolio not found.</p></div>
  }

  return settings.viewer_theme === 'kinetic'
    ? <React.Suspense fallback={<div className="portfolio-loading"><div className="spinner" /></div>}><KineticPortfolio settings={settings} repos={visibleRepos} reposLoading={reposLoading} /></React.Suspense>
    : <DefaultPortfolio settings={settings} repos={visibleRepos} reposLoading={reposLoading} onThemeToggle={updateTheme} />
}

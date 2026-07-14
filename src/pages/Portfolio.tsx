import React, { useEffect, useMemo, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import type { GitHubRepo } from '../lib/supabase'
import DefaultPortfolio from '../themes/default/DefaultPortfolio'
import { supabase } from '../lib/supabase'

const KineticPortfolio = React.lazy(() => import('../themes/kinetic/KineticPortfolio'))

export default function Portfolio() {
  const { settings, repoVisibility, loading, updateTheme } = usePortfolio()
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [reposLoading, setReposLoading] = useState(false)

  useEffect(() => {
    if (!settings) return
    const title = settings.seo_title || `${settings.display_name || 'Portfolio'}${settings.title ? ` — ${settings.title}` : ''}`
    const description = settings.seo_description || settings.bio || settings.about_text || 'Personal portfolio'
    const pageUrl = `${window.location.origin}/${settings.slug || ''}/`
    const image = settings.social_image_url || settings.avatar_url || ''
    document.title = title

    const setMeta = (attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.appendChild(element) }
      element.content = content
    }
    setMeta('name', 'description', description)
    setMeta('name', 'robots', settings.search_indexable ? 'index,follow' : 'noindex,nofollow')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:url', pageUrl)
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    if (image) { setMeta('property', 'og:image', image); setMeta('name', 'twitter:image', image) }

    if (settings.favicon_url) {
      let favicon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (!favicon) { favicon = document.createElement('link'); favicon.rel = 'icon'; document.head.appendChild(favicon) }
      favicon.href = settings.favicon_url
    }
  }, [settings])

  useEffect(() => {
    if (!settings?.id || !settings.is_published) return
    const record = (eventType: string, target = '') => {
      void supabase.from('portfolio_analytics').insert({ portfolio_id: settings.id, event_type: eventType, target: target.slice(0, 500) })
    }
    const viewKey = `portfolio-view:${settings.id}:${new Date().toISOString().slice(0, 10)}`
    if (!sessionStorage.getItem(viewKey)) { sessionStorage.setItem(viewKey, '1'); record('view') }
    const handleClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]')
      if (!link) return
      const href = link.href
      if (link.closest('#contact, #contact-k') || /^(mailto:|tel:)/i.test(link.getAttribute('href') || '')) record('contact_click', href)
      else if (link.closest('.repo-card, .kinetic-repo, .projects-grid, .kinetic-projects') || /github\.com/i.test(href)) record('project_click', href)
      else if (link.origin !== window.location.origin) record('external_click', href)
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [settings?.id, settings?.is_published])

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

import React, { useEffect, useMemo, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import type { GitHubRepo, Theme } from '../lib/supabase'
import HeroSection from '../components/sections/HeroSection'

import AboutSection from '../components/sections/AboutSection'
import SkillsSection from '../components/sections/SkillsSection'
import EducationSection from '../components/sections/EducationSection'
import ExperienceSection from '../components/sections/ExperienceSection'
import ReposSection from '../components/sections/ReposSection'
import CvProjectsSection from '../components/sections/CvProjectsSection'
import AwardsSection from '../components/sections/AwardsSection'
import ContactSection from '../components/sections/ContactSection'

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

  const order = settings?.sections_order ?? ['hero', 'about', 'skills', 'experience', 'education', 'repos', 'cv_projects', 'awards', 'contact']
  const vis = settings?.sections_visible ?? {}
  const currentTheme: Theme = settings?.theme ?? 'dark'

  const sectionMap: Record<string, React.ReactNode> = {
    hero: <HeroSection key="hero" settings={settings} />,
    about: <AboutSection key="about" settings={settings} />,
    skills: <SkillsSection key="skills" settings={settings} />,
    education: <EducationSection key="education" settings={settings} />,
    experience: <ExperienceSection key="experience" settings={settings} />,
    repos: <ReposSection key="repos" repos={visibleRepos} loading={reposLoading} githubUsername={settings?.github_username ?? ''} />,
    cv_projects: <CvProjectsSection key="cv_projects" settings={settings} />,
    awards: <AwardsSection key="awards" settings={settings} />,
    contact: <ContactSection key="contact" settings={settings} />,
  }

  return (
    <div className="portfolio">
      <button
        className="theme-toggle-fab"
        onClick={() => updateTheme(currentTheme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
        title={currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {currentTheme === 'dark' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
      </button>
      {order.filter(s => vis[s] !== false).map(s => sectionMap[s] ?? null)}
    </div>
  )
}

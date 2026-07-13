import React, { useEffect, useMemo, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import type { GitHubRepo } from '../lib/supabase'
import HeroSection from '../components/sections/HeroSection'
import AboutSection from '../components/sections/AboutSection'
import SkillsSection from '../components/sections/SkillsSection'
import EducationSection from '../components/sections/EducationSection'
import ReposSection from '../components/sections/ReposSection'
import CvProjectsSection from '../components/sections/CvProjectsSection'
import AwardsSection from '../components/sections/AwardsSection'
import ContactSection from '../components/sections/ContactSection'

export default function Portfolio() {
  const { settings, repoVisibility, loading } = usePortfolio()
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

  const order = settings?.sections_order ?? ['hero', 'about', 'skills', 'education', 'repos', 'cv_projects', 'awards', 'contact']
  const vis = settings?.sections_visible ?? {}

  const sectionMap: Record<string, React.ReactNode> = {
    hero: <HeroSection key="hero" settings={settings} />,
    about: <AboutSection key="about" settings={settings} />,
    skills: <SkillsSection key="skills" settings={settings} />,
    education: <EducationSection key="education" settings={settings} />,
    repos: <ReposSection key="repos" repos={visibleRepos} loading={reposLoading} githubUsername={settings?.github_username ?? ''} />,
    cv_projects: <CvProjectsSection key="cv_projects" settings={settings} />,
    awards: <AwardsSection key="awards" settings={settings} />,
    contact: <ContactSection key="contact" settings={settings} />,
  }

  return (
    <div className="portfolio">
      {order.filter(s => vis[s] !== false).map(s => sectionMap[s] ?? null)}
    </div>
  )
}

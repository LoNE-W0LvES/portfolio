import React from 'react'
import type { GitHubRepo, PortfolioSettings, Theme } from '../../lib/supabase'
import HeroSection from './sections/HeroSection'
import AboutSection from './sections/AboutSection'
import SkillsSection from './sections/SkillsSection'
import EducationSection from './sections/EducationSection'
import ExperienceSection from './sections/ExperienceSection'
import ReposSection from './sections/ReposSection'
import CvProjectsSection from './sections/CvProjectsSection'
import AwardsSection from './sections/AwardsSection'
import ContactSection from './sections/ContactSection'
import CertificationsSection from './sections/CertificationsSection'
import ServicesSection from './sections/ServicesSection'
import TestimonialsSection from './sections/TestimonialsSection'

interface Props { settings: PortfolioSettings; repos: GitHubRepo[]; reposLoading: boolean; onThemeToggle: (theme: Theme) => void }

export default function DefaultPortfolio({ settings, repos, reposLoading, onThemeToggle }: Props) {
  const order = settings.sections_order ?? ['hero','about','skills','experience','education','repos','cv_projects','awards','contact']
  const vis = settings.sections_visible ?? {}
  const sectionMap: Record<string, React.ReactNode> = {
    hero: <HeroSection key="hero" settings={settings} />, about: <AboutSection key="about" settings={settings} />,
    skills: <SkillsSection key="skills" settings={settings} />, experience: <ExperienceSection key="experience" settings={settings} />,
    education: <EducationSection key="education" settings={settings} />,
    certifications: <CertificationsSection key="certifications" settings={settings} />,
    services: <ServicesSection key="services" settings={settings} />,
    testimonials: <TestimonialsSection key="testimonials" settings={settings} />,
    repos: <ReposSection key="repos" repos={repos} loading={reposLoading} githubUsername={settings.github_username} />,
    cv_projects: <CvProjectsSection key="cv_projects" settings={settings} />, awards: <AwardsSection key="awards" settings={settings} />,
    contact: <ContactSection key="contact" settings={settings} />,
  }
  return <div className="portfolio default-portfolio">
    <button className="theme-toggle-fab" onClick={() => onThemeToggle(settings.theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle color mode">◐</button>
    {order.filter(section => vis[section] !== false).map(section => sectionMap[section] ?? null)}
  </div>
}

import React from 'react'
import type { PortfolioSettings } from '../../lib/supabase'

interface Props { settings: PortfolioSettings | null }

export default function AboutSection({ settings }: Props) {
  if (!settings?.bio && !settings?.location) return null

  return (
    <section id="about" className="section about-section">
      <div className="section-inner">
        <h2 className="section-title">About</h2>
        <div className="about-content">
          {settings.bio && <p className="about-bio">{settings.bio}</p>}
          <div className="about-meta">
            {settings.location && (
              <span className="about-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {settings.location}
              </span>
            )}
            {settings.website_url && (
              <a href={settings.website_url} target="_blank" rel="noreferrer" className="about-meta-item about-meta-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
                {settings.website_url.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

import React from 'react'
import type { PortfolioSettings } from '../../../lib/supabase'
import { tr } from '../../../lib/i18n'

interface Props { settings: PortfolioSettings | null }

export default function CvProjectsSection({ settings }: Props) {
  const projects = settings?.cv_projects ?? []
  if (!projects.length) return null

  return (
    <section id="cv_projects" className="section cv-projects-section">
      <div className="section-inner">
        <h2 className="section-title">{tr(settings?.preferred_language,'projects')}</h2>
        <div className="cvp-grid">
          {projects.map((p, i) => (
            <div key={i} className="cvp-card">
              <div className="cvp-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <h3 className="cvp-title">{p.title}</h3>
              <p className="cvp-desc">{p.description}</p>
              <div className="cvp-tags">
                {p.tags.map((t, j) => (
                  <span key={j} className="cvp-tag">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

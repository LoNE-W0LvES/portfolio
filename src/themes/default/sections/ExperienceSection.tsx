import React from 'react'
import type { PortfolioSettings } from '../../../lib/supabase'
import { tr } from '../../../lib/i18n'

interface Props { settings: PortfolioSettings | null }

export default function ExperienceSection({ settings }: Props) {
  const experience = settings?.work_experience ?? []
  if (!experience.length) return null

  return (
    <section id="experience" className="section experience-section snap-compact">
      <div className="section-inner">
        <h2 className="section-title">{tr(settings?.preferred_language,'workExperience')}</h2>
        <div className="timeline">
          {experience.map((item, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-content">
                <div className="timeline-header">
                  <h3 className="timeline-degree">{item.role}</h3>
                  {item.period && <span className="timeline-period">{item.period}</span>}
                </div>
                <div className="timeline-meta">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="timeline-inst">{item.company}</a>
                  ) : (
                    <span className="timeline-inst">{item.company}</span>
                  )}
                  {item.location && <span className="timeline-loc">{item.location}</span>}
                </div>
                {item.description && <p className="timeline-description">{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

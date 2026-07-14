import React from 'react'
import type { PortfolioSettings } from '../../../lib/supabase'

interface Props { settings: PortfolioSettings | null }

export default function EducationSection({ settings }: Props) {
  const edu = settings?.education ?? []
  if (!edu.length) return null

  return (
    <section id="education" className="section education-section">
      <div className="section-inner">
        <h2 className="section-title">Education</h2>
        <div className="timeline">
          {edu.map((e, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-content">
                <div className="timeline-header">
                  <h3 className="timeline-degree">{e.degree}</h3>
                  <span className="timeline-period">{e.period}</span>
                </div>
                <div className="timeline-meta">
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noreferrer" className="timeline-inst">{e.institution}</a>
                  ) : (
                    <span className="timeline-inst">{e.institution}</span>
                  )}
                  {e.location && <span className="timeline-loc">{e.location}</span>}
                </div>
                {e.field && <p className="timeline-field">{e.field}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

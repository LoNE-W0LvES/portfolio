import React from 'react'
import type { PortfolioSettings } from '../../../lib/supabase'

interface Props { settings: PortfolioSettings | null }

export default function AwardsSection({ settings }: Props) {
  const awards = settings?.awards ?? []
  if (!awards.length) return null

  return (
    <section id="awards" className="section awards-section">
      <div className="section-inner">
        <h2 className="section-title">Awards & Recognition</h2>
        <div className="awards-list">
          {awards.map((a, i) => (
            <div key={i} className="award-card">
              <div className="award-year">{a.year}</div>
              <div className="award-body">
                <div className="award-title">{a.title}</div>
                <div className="award-org">{a.org}</div>
              </div>
              <div className="award-trophy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                  <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/>
                  <path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
                  <path d="M4 22h16"/>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                  <path d="M18 2H6v7a6 6 0 0012 0V2z"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

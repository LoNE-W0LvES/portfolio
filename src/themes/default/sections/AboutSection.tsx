import React from 'react'
import type { PortfolioSettings } from '../../../lib/supabase'
import { tr } from '../../../lib/i18n'

interface Props { settings: PortfolioSettings | null }

export default function AboutSection({ settings }: Props) {
  const bio = settings?.bio
  if (!bio && !settings?.location && !settings?.nationality) return null

  return (
    <section id="about" className="section about-section snap-compact">
      <div className="section-inner">
        <h2 className="section-title">{tr(settings?.preferred_language,'about')}</h2>
        <div className="about-grid">
          <div className="about-bio-col">
            {bio && <p className="about-bio">{bio}</p>}
          </div>
          <div className="about-info-col">
            {[
              settings?.location && { icon: 'map-pin', label: tr(settings.preferred_language,'location'), value: settings.location },
              settings?.nationality && { icon: 'flag', label: tr(settings.preferred_language,'nationality'), value: settings.nationality },
              settings?.phone && { icon: 'phone', label: 'Phone', value: settings.phone },
              settings?.email && { icon: 'mail', label: 'Email', value: settings.email, href: `mailto:${settings.email}` },
            ].filter(Boolean).map((item: any) => (
              <div key={item.label} className="about-info-item">
                <span className="about-info-label">{item.label}</span>
                {item.href
                  ? <a href={item.href} className="about-info-value about-info-link">{item.value}</a>
                  : <span className="about-info-value">{item.value}</span>
                }
              </div>
            ))}
            {settings?.languages && settings.languages.length > 0 && (
              <div className="about-info-item about-info-item-col">
                <span className="about-info-label">{tr(settings.preferred_language,'languages')}</span>
                <div className="about-langs">
                  {settings.languages.map((l, i) => (
                    <div key={i} className="about-lang">
                      <span className="about-lang-name">{l.name}</span>
                      <span className="about-lang-level">{l.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
import '../compact-sections.css';

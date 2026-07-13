import React from 'react'
import type { PortfolioSettings } from '../../lib/supabase'

interface Props { settings: PortfolioSettings | null }

export default function SkillsSection({ settings }: Props) {
  const skills = settings?.skills ?? []
  if (!skills.length) return null

  return (
    <section id="skills" className="section skills-section">
      <div className="section-inner">
        <h2 className="section-title">Technical Skills</h2>
        <div className="skills-grid">
          {skills.map((group, i) => (
            <div key={i} className="skill-group">
              <h3 className="skill-group-title">{group.category}</h3>
              <div className="skill-tags">
                {group.items.map((item, j) => (
                  <span key={j} className="skill-tag">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        {settings?.digital_skills && settings.digital_skills.length > 0 && (
          <div className="digital-skills">
            <h3 className="skill-group-title">Digital Skills</h3>
            <div className="skill-tags">
              {settings.digital_skills.map((s, i) => (
                <span key={i} className="skill-tag skill-tag-soft">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

import React from 'react'
import type { PortfolioSettings } from '../../../lib/supabase'

export default function CertificationsSection({ settings }: { settings: PortfolioSettings }) {
  if (!settings.certifications?.length) return null
  return <section id="certifications" className="section certifications-section"><div className="section-inner"><h2 className="section-title">Certifications</h2><div className="timeline">
    {settings.certifications.map((item, index) => <article className="timeline-item" key={`${item.name}-${index}`}><div className="timeline-dot"/><div className="timeline-content"><div className="timeline-header"><h3 className="timeline-degree">{item.name}</h3><span className="timeline-period">{item.issue_date}{item.expiry_date ? ` — ${item.expiry_date}` : ''}</span></div><div className="timeline-meta"><span className="timeline-inst">{item.issuer}</span></div>{item.credential_id && <p className="timeline-field">Credential ID: {item.credential_id}</p>}{item.credential_url && <a className="btn-outline" href={item.credential_url} target="_blank" rel="noreferrer">Verify credential ↗</a>}</div></article>)}
  </div></div></section>
}

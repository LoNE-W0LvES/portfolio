import React, { useEffect, useMemo, useState } from 'react'
import { supabase, type PortfolioSettings } from '../../lib/supabase'
import './EditAnalytics.css'

interface EventRow { event_type: string; target: string; created_at: string }

export default function EditAnalytics({ settings }: { settings: PortfolioSettings | null }) {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!settings?.id) return
    setLoading(true)
    const since = new Date(Date.now() - 90 * 86400000).toISOString()
    supabase.from('portfolio_analytics').select('event_type,target,created_at').eq('portfolio_id', settings.id).gte('created_at', since).order('created_at', { ascending: false }).limit(5000)
      .then(({ data }) => { setEvents((data as EventRow[]) || []); setLoading(false) })
  }, [settings?.id])
  const counts = useMemo(() => ({ views: events.filter(e => e.event_type === 'view').length, projects: events.filter(e => e.event_type === 'project_click').length, contacts: events.filter(e => e.event_type === 'contact_click').length, external: events.filter(e => e.event_type === 'external_click').length }), [events])
  const days = useMemo(() => Array.from({ length: 14 }, (_, offset) => { const date = new Date(Date.now() - (13 - offset) * 86400000); const key = date.toISOString().slice(0, 10); return { key, label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value: events.filter(e => e.event_type === 'view' && e.created_at.startsWith(key)).length } }), [events])
  const max = Math.max(1, ...days.map(day => day.value))
  if (loading) return <div className="portfolio-loading"><div className="spinner" /></div>
  return <div className="analytics-panel"><p className="edit-hint">Anonymous activity from the last 90 days. No IP addresses, cookies, or personal visitor identities are stored.</p>
    <div className="analytics-cards"><article><strong>{counts.views}</strong><span>Page views</span></article><article><strong>{counts.projects}</strong><span>Project clicks</span></article><article><strong>{counts.contacts}</strong><span>Contact clicks</span></article><article><strong>{counts.external}</strong><span>External clicks</span></article></div>
    <div className="edit-section-group"><h3 className="edit-group-title">Views — last 14 days</h3><div className="analytics-chart">{days.map(day => <div key={day.key} title={`${day.label}: ${day.value} views`}><span style={{ height: `${Math.max(day.value ? 8 : 2, day.value / max * 100)}%` }} /><small>{day.label}</small></div>)}</div></div>
    <div className="edit-section-group"><h3 className="edit-group-title">Recent activity</h3><div className="analytics-list">{events.slice(0, 20).map((event, index) => <div key={`${event.created_at}-${index}`}><strong>{event.event_type.replace('_', ' ')}</strong><span>{event.target || 'Portfolio page'}</span><time>{new Date(event.created_at).toLocaleString()}</time></div>)}{!events.length && <p className="edit-hint">No analytics recorded yet.</p>}</div></div>
  </div>
}

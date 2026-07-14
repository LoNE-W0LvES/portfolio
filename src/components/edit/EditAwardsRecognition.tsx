import React, { useEffect, useState } from 'react'
import type { Award, Language, PortfolioSettings } from '../../lib/supabase'

interface Props { settings: PortfolioSettings | null; saving: boolean; onSave: (updates: Partial<PortfolioSettings>) => Promise<void> }
const emptyAward = (): Award => ({ year: '', title: '', org: '' })
const emptyLanguage = (): Language => ({ name: '', level: '' })

export default function EditAwardsRecognition({ settings, saving, onSave }: Props) {
  const [awards, setAwards] = useState<Award[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  useEffect(() => { if (settings) { setAwards(structuredClone(settings.awards ?? [])); setLanguages(structuredClone(settings.languages ?? [])) } }, [settings])
  const updateAward = (i: number, key: keyof Award, value: string) => setAwards(current => current.map((item,index) => index===i ? {...item,[key]:value} : item))
  const updateLanguage = (i: number, key: keyof Language, value: string) => setLanguages(current => current.map((item,index) => index===i ? {...item,[key]:value} : item))
  return <div className="edit-awards-panel">
    <div className="edit-section-group"><h3 className="edit-group-title">Awards & Recognition</h3><p className="edit-hint">Add honors, competition placements, scholarships, and professional recognition.</p>
      {awards.map((item,i)=><div className="edit-edu-card" key={i}><div className="edit-edu-card-header"><span className="edit-edu-num">Award #{i+1}</span><button className="icon-btn icon-btn-danger" onClick={()=>setAwards(current=>current.filter((_,index)=>index!==i))}>×</button></div><div className="edit-form-grid"><div className="field field-full"><label>Award title</label><input value={item.title} onChange={e=>updateAward(i,'title',e.target.value)} placeholder="1st Runner-up — Innovative Idea"/></div><div className="field"><label>Year</label><input value={item.year} onChange={e=>updateAward(i,'year',e.target.value)} placeholder="2026"/></div><div className="field"><label>Organization</label><input value={item.org} onChange={e=>updateAward(i,'org',e.target.value)} placeholder="Organization or event"/></div></div></div>)}
      <button className="btn-outline" onClick={()=>setAwards(current=>[...current,emptyAward()])}>+ Add Award</button>
    </div>
    <div className="edit-section-group"><h3 className="edit-group-title">Languages</h3><p className="edit-hint">Languages appear alongside recognition in both portfolio themes and CV exports.</p>
      {languages.map((item,i)=><div className="edit-edu-card" key={i}><div className="edit-edu-card-header"><span className="edit-edu-num">Language #{i+1}</span><button className="icon-btn icon-btn-danger" onClick={()=>setLanguages(current=>current.filter((_,index)=>index!==i))}>×</button></div><div className="edit-form-grid"><div className="field"><label>Language</label><input value={item.name} onChange={e=>updateLanguage(i,'name',e.target.value)} placeholder="Japanese"/></div><div className="field"><label>Proficiency</label><input value={item.level} onChange={e=>updateLanguage(i,'level',e.target.value)} placeholder="Basic (JLPT N4 / A2)"/></div></div></div>)}
      <button className="btn-outline" onClick={()=>setLanguages(current=>[...current,emptyLanguage()])}>+ Add Language</button>
    </div>
    <div className="edit-form-footer"><button className="btn-primary" disabled={saving} onClick={()=>onSave({awards,languages})}>{saving?'Saving...':'Save Awards & Recognition'}</button></div>
  </div>
}

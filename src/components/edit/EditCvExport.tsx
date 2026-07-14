import React, { useRef, useState } from 'react'
import type { PortfolioSettings } from '../../lib/supabase'
import './EditCvExport.css'

type Template = 'classic' | 'europass' | 'japanese'
type PageSize = 'a4'|'letter'|'legal'
const PAGE_SIZES:Record<PageSize,{label:string;css:string;width:string;height:string;docx:[number,number]}>={a4:{label:'A4',css:'A4',width:'210mm',height:'297mm',docx:[11906,16838]},letter:{label:'US Letter',css:'Letter',width:'8.5in',height:'11in',docx:[12240,15840]},legal:{label:'US Legal',css:'Legal',width:'8.5in',height:'14in',docx:[12240,20160]}}
type CvOption = 'photo'|'title'|'email'|'phone'|'location'|'website'|'github'|'linkedin'|'nationality'|'about'|'experience'|'education'|'certifications'|'skills'|'projects'|'projectDescriptions'|'projectTags'|'awards'|'languages'
const DEFAULT_OPTIONS: Record<CvOption, boolean> = { photo:true,title:true,email:true,phone:true,location:true,website:true,github:true,linkedin:true,nationality:true,about:true,experience:true,education:true,certifications:true,skills:true,projects:true,projectDescriptions:true,projectTags:true,awards:true,languages:true }

export default function EditCvExport({ settings }: { settings: PortfolioSettings | null }) {
  const [template, setTemplate] = useState<Template>('europass')
  const [pageSize, setPageSize] = useState<PageSize>('a4')
  const [shown, setShown] = useState(DEFAULT_OPTIONS)
  const [busy, setBusy] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  if (!settings) return null
  const linkedInContact = settings.contacts?.find(item => item.platform_name.toLowerCase() === 'linkedin' || item.platform_link.includes('linkedin.com'))
  const linkedInUrl = linkedInContact?.platform_link || settings.linkedin_url
  const linkedInStoredName = linkedInContact?.platform_username?.trim() || ''
  const linkedInPlaceholder = /^(connect|open link|visit|view profile|linkedin)$/i.test(linkedInStoredName)
  const linkedInSlug = (() => { try { return decodeURIComponent(new URL(linkedInUrl).pathname.split('/').filter(Boolean).pop() || '') } catch { return '' } })()
  const linkedInName = !linkedInPlaceholder && linkedInStoredName ? linkedInStoredName : linkedInSlug
  const contactLines = [
    [shown.location&&settings.location&&`Location: ${settings.location}`, shown.nationality&&settings.nationality&&`Nationality: ${settings.nationality}`],
    [shown.email&&settings.email&&`Email: ${settings.email}`, shown.phone&&settings.phone&&`Phone: ${settings.phone}`],
    [shown.linkedin&&linkedInName&&`LinkedIn: ${linkedInName}`, shown.github&&settings.github_username&&`GitHub: ${settings.github_username}`, shown.website&&settings.website_url&&`Website: ${settings.website_url}`],
  ].map(items => items.filter(Boolean).join(' · ')).filter(Boolean)
  const toggle = (key: CvOption) => setShown(current => ({ ...current, [key]: !current[key] }))
  const filename = (settings.display_name || 'portfolio').replace(/[^a-z0-9]+/gi, '_')

  const printPdf = () => {
    if (!previewRef.current) return
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
    document.body.appendChild(frame)
    const printWindow = frame.contentWindow
    const printDocument = frame.contentDocument
    if (!printWindow || !printDocument) { frame.remove(); return }
    printDocument.open()
    printDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>${filename}_CV</title><style>${PRINT_CSS.replace('size:A4','size:'+PAGE_SIZES[pageSize].css)}</style></head><body>${previewRef.current.outerHTML}</body></html>`)
    printDocument.close()
    const ready = Array.from(printDocument.images).map(image => image.complete ? Promise.resolve() : new Promise<void>(resolve => { image.onload = image.onerror = () => resolve() }))
    Promise.all([...(ready as Promise<void>[]), printDocument.fonts?.ready || Promise.resolve()]).then(() => window.setTimeout(() => {
      const cleanup = () => window.setTimeout(() => frame.remove(), 250)
      printWindow.addEventListener('afterprint', cleanup, { once: true })
      printWindow.focus()
      printWindow.print()
      window.setTimeout(cleanup, 60000)
    }, 150))
  }

  const exportDocx = async () => {
    setBusy(true)
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx')
      const paragraphs: InstanceType<typeof Paragraph>[] = []
      const heading = (text: string) => paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 260, after: 100 } }))
      const line = (text: string, bold = false) => paragraphs.push(new Paragraph({ children: [new TextRun({ text, bold })], spacing: { after: 70 } }))
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: settings.display_name, bold: true, size: 38 })], alignment: template === 'japanese' ? AlignmentType.LEFT : AlignmentType.CENTER }))
      if(shown.title) line(settings.title); contactLines.forEach(contactLine => line(contactLine))
      if(shown.about){ heading(template === 'japanese' ? '自己PR・概要' : 'PROFILE'); line(settings.about_text || settings.bio) }
      if (template === 'japanese') { heading('基本情報'); if(shown.nationality)line(`国籍: ${settings.nationality}`); if(shown.location)line(`住所: ${settings.location}`); if(shown.phone)line(`電話: ${settings.phone}`); if(shown.email)line(`メール: ${settings.email}`); if(shown.github&&settings.github_username)line(`GitHub: ${settings.github_username}`) }
      if(shown.experience&&settings.work_experience?.length){ heading(template === 'japanese' ? '職務経歴' : 'WORK EXPERIENCE'); settings.work_experience.forEach(item => { line(`${item.period}  ${item.role} — ${item.company}`, true); line(`${item.location}${item.description ? ` | ${item.description}` : ''}`) }) }
      if(shown.education&&settings.education?.length){ heading(template === 'japanese' ? '学歴' : 'EDUCATION'); settings.education.forEach(item => { line(`${item.period}  ${item.degree}`, true); line(`${item.institution} · ${item.location} ${item.field || ''}`) }) }
      if (shown.certifications&&settings.certifications?.length) { heading(template === 'japanese' ? '資格・免許' : 'CERTIFICATIONS'); settings.certifications.forEach(item => line(`${item.issue_date}  ${item.name} — ${item.issuer}${item.credential_id ? ` (${item.credential_id})` : ''}`)) }
      if(shown.skills){ heading(template === 'japanese' ? 'スキル' : 'SKILLS'); settings.skills?.forEach(group => line(`${group.category}: ${group.items.join(', ')}`)); if (settings.digital_skills?.length) line(`Digital: ${settings.digital_skills.join(', ')}`) }
      if(shown.projects&&settings.cv_projects?.length){ heading(template === 'japanese' ? 'プロジェクト' : 'PROJECTS'); settings.cv_projects.forEach(item => { line(item.title, true); const details=[shown.projectDescriptions&&item.description,shown.projectTags&&item.tags?.length?`[${item.tags.join(', ')}]`:''].filter(Boolean).join(' '); if(details)line(details) }) }
      if (shown.awards&&settings.awards?.length) { heading(template === 'japanese' ? '受賞歴' : 'HONORS & AWARDS'); settings.awards.forEach(item => line(`${item.year}  ${item.title} — ${item.org}`)) }
      if (shown.languages&&settings.languages?.length) { heading(template === 'japanese' ? '語学力' : 'LANGUAGES'); settings.languages.forEach(item => line(`${item.name}: ${item.level}`)) }
      const doc = new Document({ sections: [{ properties: { page: { size: { width: PAGE_SIZES[pageSize].docx[0], height: PAGE_SIZES[pageSize].docx[1] } } }, children: paragraphs }] })
      const blob = await Packer.toBlob(doc); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${filename}_${template}.docx`; a.click(); URL.revokeObjectURL(url)
    } finally { setBusy(false) }
  }

  const downloadPdf = async () => {
    if (!previewRef.current) return
    setBusy(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      const dimensions: Record<PageSize, [number, number]> = { a4: [210, 297], letter: [215.9, 279.4], legal: [215.9, 355.6] }
      const [pageWidth, pageHeight] = dimensions[pageSize]
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pageWidth, pageHeight], compress: true })
      const imageData = canvas.toDataURL('image/jpeg', 0.94)
      const renderedHeight = canvas.height * pageWidth / canvas.width
      let remaining = renderedHeight
      let offset = 0
      pdf.addImage(imageData, 'JPEG', 0, offset, pageWidth, renderedHeight, undefined, 'FAST')
      remaining -= pageHeight
      while (remaining > 0) {
        offset -= pageHeight
        pdf.addPage([pageWidth, pageHeight], 'portrait')
        pdf.addImage(imageData, 'JPEG', 0, offset, pageWidth, renderedHeight, undefined, 'FAST')
        remaining -= pageHeight
      }
      pdf.save(`${filename}_${template}.pdf`)
    } finally { setBusy(false) }
  }

  return <div className="cv-export-panel"><div className="cv-export-toolbar"><div><label>CV template</label><div className="cv-template-buttons"><button className={template==='classic'?'active':''} onClick={()=>setTemplate('classic')}>Current CV</button><button className={template==='europass'?'active':''} onClick={()=>setTemplate('europass')}>Europass</button><button className={template==='japanese'?'active':''} onClick={()=>setTemplate('japanese')}>Japanese</button></div></div><label className="cv-page-size">Page size<select value={pageSize} onChange={event=>setPageSize(event.target.value as PageSize)}>{Object.entries(PAGE_SIZES).map(([key,value])=><option value={key} key={key}>{value.label}</option>)}</select></label><div className="cv-export-actions"><button className="btn-outline" disabled={busy} onClick={printPdf}>Print</button><button className="btn-outline" disabled={busy} onClick={downloadPdf}>PDF</button><button className="btn-primary" disabled={busy} onClick={exportDocx}>{busy?'Working...':'DOCX'}</button></div></div>
    <div className="cv-options"><CvOptions title="Header & contact" keys={['photo','title','email','phone','location','website','github','linkedin','nationality']} shown={shown} toggle={toggle}/><CvOptions title="Sections" keys={['about','experience','education','certifications','skills','projects','awards','languages']} shown={shown} toggle={toggle}/>{shown.projects&&<CvOptions title="Project details" keys={['projectDescriptions','projectTags']} shown={shown} toggle={toggle}/>}</div>
    <p className="edit-hint">Print opens the system print dialog. PDF downloads a ready-made file directly.</p>
    <div className="cv-preview-shell"><div ref={previewRef} className={`cv-paper cv-${template}`} style={{width:PAGE_SIZES[pageSize].width,minHeight:PAGE_SIZES[pageSize].height}}>
      <header>{shown.photo && settings.avatar_url && <img src={settings.avatar_url} alt=""/>}<div><h1>{settings.display_name}</h1>{shown.title&&<h2>{settings.title}</h2>}{!!contactLines.length&&<div className="cv-contact">{contactLines.map((contactLine,index)=><span key={index}>{contactLine}</span>)}</div>}</div></header>
      {template==='japanese' && <section><h3>基本情報</h3><div className="jp-grid"><b>氏名</b><span>{settings.display_name}</span>{shown.nationality&&<><b>国籍</b><span>{settings.nationality}</span></>}{shown.location&&<><b>住所</b><span>{settings.location}</span></>}{shown.phone&&<><b>電話</b><span>{settings.phone}</span></>}{shown.email&&<><b>メール</b><span>{settings.email}</span></>}{shown.github&&settings.github_username&&<><b>GitHub</b><span>{settings.github_username}</span></>}</div></section>}
      {shown.about&&<CvSection title={template==='japanese'?'自己PR・概要':'About me'}><p>{settings.about_text || settings.bio}</p></CvSection>}
      {shown.experience&&!!settings.work_experience?.length && <CvSection title={template==='japanese'?'職務経歴':'Work experience'}>{settings.work_experience.map((x,i)=><Entry key={i} date={x.period} title={x.role} meta={`${x.company} · ${x.location}`} body={x.description}/>)}</CvSection>}
      {shown.education&&!!settings.education?.length&&<CvSection title={template==='japanese'?'学歴':'Education'}>{settings.education.map((x,i)=><Entry key={i} date={x.period} title={x.degree} meta={`${x.institution} · ${x.location}`} body={x.field}/>)}</CvSection>}
      {shown.certifications&&!!settings.certifications?.length && <CvSection title={template==='japanese'?'資格・免許':'Certifications'}>{settings.certifications.map((x,i)=><Entry key={i} date={x.issue_date} title={x.name} meta={x.issuer} body={x.credential_id}/>)}</CvSection>}
      {shown.skills&&<CvSection title={template==='japanese'?'スキル':'Skills'}><div className="cv-skills">{settings.skills?.map((x,i)=><p key={i}><b>{x.category}</b>{x.items.join(' · ')}</p>)}</div></CvSection>}
      {shown.projects&&!!settings.cv_projects?.length && <CvSection title={template==='japanese'?'プロジェクト':'Projects'}>{settings.cv_projects.map((x,i)=><Entry key={i} title={x.title} body={shown.projectDescriptions?x.description:undefined} meta={shown.projectTags?x.tags?.join(' · '):undefined}/>)}</CvSection>}
      {shown.awards&&!!settings.awards?.length && <CvSection title={template==='japanese'?'受賞歴':'Honors and awards'}>{settings.awards.map((x,i)=><Entry key={i} date={x.year} title={x.title} meta={x.org}/>)}</CvSection>}
      {shown.languages&&!!settings.languages?.length && <CvSection title={template==='japanese'?'語学力':'Languages'}><p>{settings.languages.map(x=>`${x.name} — ${x.level}`).join(' · ')}</p></CvSection>}
    </div></div>
  </div>
}

function CvSection({title,children}:{title:string;children:React.ReactNode}){return <section><h3>{title}</h3>{children}</section>}
const OPTION_LABELS:Record<CvOption,string>={photo:'Profile photo',title:'Professional title',email:'Email',phone:'Phone',location:'Location',website:'Website',github:'GitHub',linkedin:'LinkedIn',nationality:'Nationality',about:'About me',experience:'Work experience',education:'Education',certifications:'Certifications',skills:'Skills',projects:'Projects',projectDescriptions:'Descriptions',projectTags:'Technology tags',awards:'Awards',languages:'Languages'}
function CvOptions({title,keys,shown,toggle}:{title:string;keys:CvOption[];shown:Record<CvOption,boolean>;toggle:(key:CvOption)=>void}){return <fieldset><legend>{title}</legend><div>{keys.map(key=><label key={key}><input type="checkbox" checked={shown[key]} onChange={()=>toggle(key)}/>{OPTION_LABELS[key]}</label>)}</div></fieldset>}
function Entry({date,title,meta,body}:{date?:string;title:string;meta?:string;body?:string}){return <article className={`cv-entry${date ? '' : ' cv-entry-undated'}`}>{date&&<time>{date}</time>}<div><h4>{title}</h4>{meta&&<strong>{meta}</strong>}{body&&<p>{body}</p>}</div></article>}
const PRINT_CSS = `@page{size:A4;margin:12mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0;padding:0;background:#fff}body{font:10.5pt Arial,"Noto Sans",sans-serif;color:#172033}.cv-paper{display:block!important;width:auto!important;max-width:none!important;min-height:0!important;margin:0!important;padding:0!important;background:#fff!important;color:#172033!important;box-shadow:none!important;font:inherit!important}.cv-paper header{display:flex;gap:18px;border-bottom:3px solid #1d4ed8;padding-bottom:16px;break-inside:avoid}.cv-paper header>div{min-width:0;flex:1}.cv-paper header img{display:block;width:92px!important;height:112px!important;max-width:92px!important;object-fit:cover!important;object-position:center!important;flex:0 0 92px}.cv-paper h1{font-size:25pt;margin:0}.cv-paper h2{font-size:12pt;color:#475569}.cv-contact{display:grid;gap:3px;color:#64748b}.cv-contact span{display:block}.cv-paper section{margin-top:18px}.cv-paper h3{text-transform:uppercase;color:#1d4ed8;border-bottom:1px solid #cbd5e1;padding-bottom:4px;break-after:avoid}.cv-entry{display:grid;grid-template-columns:105px minmax(0,1fr);gap:12px;margin:10px 0;break-inside:avoid;page-break-inside:avoid}.cv-entry-undated{grid-template-columns:minmax(0,1fr)}.cv-entry h4,.cv-entry p{margin:0 0 4px;overflow-wrap:anywhere}.cv-entry strong{display:block;font-size:9.5pt;color:#475569;margin-bottom:3px}.cv-skills p{display:grid;grid-template-columns:140px 1fr}.cv-japanese{font-family:"Yu Gothic","Noto Sans JP",Arial,sans-serif!important}.cv-japanese h3{color:#111;border:2px solid #111;padding:5px}.jp-grid{display:grid;grid-template-columns:80px 1fr;border:1px solid}.jp-grid>*{padding:6px;border:1px solid}.cv-europass header{border-color:#1769aa}.cv-europass h3{color:#1769aa}`

import React, { useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import type { GitHubRepo, PortfolioSettings } from '../../lib/supabase'
import { contactLogo, getContactLinks } from '../../lib/contacts'
import './kinetic.css'

interface Props { settings: PortfolioSettings; repos: GitHubRepo[]; reposLoading: boolean }
const reveal = { initial: { opacity: 0, y: 70 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .15 }, transition: { duration: .85, ease: [0.22, 1, 0.36, 1] as const } }
const codingMemes = [
  'It works on my machine',
  'One does not simply exit Vim',
  '99 little bugs in the code',
  'There is no place like 127.0.0.1',
  'Git push and pray',
  'CSS is awesome',
  'I fixed one bug and created three',
  'Semicolon missing — day ruined',
  'Works in development',
  'Do not deploy on Friday',
  'Console log driven development',
  'Temporary fix since 2019',
  'It is not a bug — it is a feature',
  'Merge conflict has entered the chat',
  'Have you tried turning it off and on',
  'Five minutes to code — three hours to debug',
  'Stack Overflow knows everything',
  'The tests passed locally',
  'Cache invalidation strikes again',
  'Frontend by day — debugger by night',
  'TODO — future me will understand',
  'Just one more dependency',
  'Undefined is not a function',
  'Docker says the container is healthy',
  'The API returned 200 with an error',
  'Naming things is the hardest problem',
  'My code needs coffee too',
  'Production is the real test environment',
]

function KineticRepo({ repo, index }: { repo: GitHubRepo; index: number }) {
  const [open, setOpen] = useState(false)
  const [readme, setReadme] = useState('')
  const [loading, setLoading] = useState(false)
  const toggle = async () => {
    const next = !open; setOpen(next)
    if (!next || readme || loading) return
    setLoading(true)
    try {
      const response = await fetch(`https://api.github.com/repos/${repo.full_name}/readme`, { headers: { Accept: 'application/vnd.github.html+json' } })
      if (!response.ok) throw new Error('README unavailable')
      const body = await response.text()
      setReadme(body.startsWith('"') ? JSON.parse(body) : body)
    } catch { setReadme('<p>This repository does not have a public README.</p>') }
    finally { setLoading(false) }
  }
  return <motion.article className={`kinetic-repo ${open ? 'open' : ''}`} {...reveal}>
    <button type="button" className="kinetic-repo-trigger" onClick={toggle} aria-expanded={open}><span>{String(index+1).padStart(2,'0')}</span><div><h3>{repo.name.replace(/-/g,' ')}</h3><p>{repo.description || 'Explore the repository and its implementation.'}</p><small>{repo.language || 'Code'} · ★ {repo.stargazers_count} · ⑂ {repo.forks_count}</small></div><b>{open ? '−' : '+'}</b></button>
    {open && <motion.div className="kinetic-repo-detail" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}><div className="kinetic-readme">{loading ? <p>Loading README…</p> : <div dangerouslySetInnerHTML={{ __html: readme }} />}</div><div className="kinetic-repo-actions">{repo.homepage && <a href={repo.homepage} target="_blank" rel="noreferrer">Open Project ↗</a>}<a href={repo.html_url} target="_blank" rel="noreferrer">View on GitHub ↗</a></div></motion.div>}
  </motion.article>
}

export default function KineticPortfolio({ settings, repos, reposLoading }: Props) {
  const { scrollYProgress } = useScroll()
  const drift = useTransform(scrollYProgress, [0, 1], ['0%', '-28%'])
  const skills = [...(settings.skills ?? []).flatMap(group => group.items), ...(settings.digital_skills ?? [])]
  const contacts = getContactLinks(settings)
  return <main className="kinetic-theme">
    <motion.div className="kinetic-progress" style={{ scaleX: scrollYProgress }} />
    <nav className="kinetic-nav"><a href="#top" className="kinetic-mark">{settings.display_name?.slice(0, 2).toUpperCase() || 'PF'}</a><div><a href="#work">Work</a><a href="#about-k">About</a><a href="#contact-k">Contact</a></div></nav>
    <section id="top" className="kinetic-hero">
      <motion.div className="kinetic-orbit" style={{ y: drift }} aria-hidden="true" />
      <div className="kinetic-kicker"><span>Independent portfolio</span><span>{settings.location || 'Available worldwide'}</span></div>
      <div className="kinetic-headline" aria-label={settings.display_name}>
        {(settings.display_name || 'Your Name').split(' ').map((word, index) => <div className="kinetic-mask" key={word + index}><motion.span initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: .15 + index * .12, ease: [0.22,1,0.36,1] }}>{word}</motion.span></div>)}
      </div>
      <motion.div className="kinetic-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .8 }}><p>{settings.title}</p><p>{[settings.location, settings.nationality].filter(Boolean).join(' · ') || 'Open to meaningful collaborations and ambitious ideas.'}</p></motion.div>
      {settings.avatar_url && <motion.div className="kinetic-portrait" initial={{ clipPath: 'inset(100% 0 0 0)' }} animate={{ clipPath: 'inset(0% 0 0 0)' }} transition={{ duration: 1.1, delay: .5, ease: [0.22,1,0.36,1] }}><img src={settings.avatar_url} alt={settings.display_name} /></motion.div>}
      <a href="#about-k" className="kinetic-scroll">Scroll to explore <span>↓</span></a>
    </section>
    <div className="kinetic-marquee kinetic-meme-marquee" aria-label="Coding humor"><div>{[0,1].map(copy => <span key={copy}>{codingMemes.map(meme => <React.Fragment key={`${copy}-${meme}`}><em>{meme}</em><b>&gt;_&lt;</b></React.Fragment>)}</span>)}</div></div>
    <motion.section id="about-k" className="kinetic-section kinetic-about" {...reveal}><span className="kinetic-index">01 / Profile</span><h2>{settings.about_text || settings.bio}</h2><div className="kinetic-stats"><div><b>{settings.work_experience?.length || 0}</b><span>Roles</span></div><div><b>{repos.length}</b><span>Repositories</span></div><div><b>{skills.length}</b><span>Skills</span></div></div></motion.section>
    {!!skills.length && <section className="kinetic-section kinetic-skills"><span className="kinetic-index">02 / Capabilities</span><div className="kinetic-skill-list">{skills.map((skill, i) => <motion.div key={skill+i} initial={{ opacity: 0, x: i%2 ? 60 : -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i*.04,.4) }}><span>{String(i+1).padStart(2,'0')}</span>{skill}</motion.div>)}</div></section>}
    <section id="work" className="kinetic-section kinetic-work"><span className="kinetic-index">03 / Selected work</span><h2>Projects that move ideas forward.</h2><div className="kinetic-projects">{reposLoading ? <p>Loading work…</p> : repos.map((repo,i) => <KineticRepo repo={repo} index={i} key={repo.id} />)}</div></section>
    {!!settings.work_experience?.length && <section className="kinetic-section kinetic-history"><span className="kinetic-index">04 / Experience</span>{settings.work_experience.map((item,i) => <motion.article key={i} {...reveal}><span>{item.period}</span><div><h3>{item.role}</h3><p>{item.company} · {item.location}</p><p>{item.description}</p></div></motion.article>)}</section>}
    {!!settings.education?.length && <section className="kinetic-section kinetic-history kinetic-education"><span className="kinetic-index">05 / Education</span>{settings.education.map((item,i) => <motion.article key={i} {...reveal}><span>{item.period}</span><div><h3>{item.degree}</h3><p>{item.institution} · {item.location}</p><p>{item.field}</p></div></motion.article>)}</section>}
    {!!settings.cv_projects?.length && <section className="kinetic-section kinetic-editorial"><span className="kinetic-index">06 / Portfolio projects</span><div className="kinetic-editorial-grid">{settings.cv_projects.map((item,i) => <motion.article key={i} {...reveal}><span>0{i+1}</span><h3>{item.title}</h3><p>{item.description}</p><div>{item.tags.map(tag => <small key={tag}>{tag}</small>)}</div></motion.article>)}</div></section>}
    {(!!settings.awards?.length || !!settings.languages?.length) && <section className="kinetic-section kinetic-recognition"><span className="kinetic-index">07 / Recognition & languages</span><div>{settings.awards?.map((award,i) => <motion.article key={i} {...reveal}><b>{award.year}</b><span>{award.title}</span><small>{award.org}</small></motion.article>)}</div><div>{settings.languages?.map((language,i) => <motion.article key={i} {...reveal}><b>{String(i+1).padStart(2,'0')}</b><span>{language.name}</span><small>{language.level}</small></motion.article>)}</div></section>}
    <section id="contact-k" className="kinetic-contact"><motion.p {...reveal}>Have a project in mind?</motion.p><motion.a {...reveal} href={contacts[0]?.platform_link || '#top'}>Let's create<br/>something <i>alive.</i></motion.a><div className="kinetic-contact-grid">{contacts.map((contact,index) => <a href={contact.platform_link} target={contact.platform_link.startsWith('http') ? '_blank' : undefined} rel="noreferrer" key={`${contact.platform_name}-${index}`}>{contactLogo(contact.platform_link) && <img src={contactLogo(contact.platform_link)} alt="" width="24" height="24" />}<span>{contact.platform_name}</span>{contact.platform_username || 'Open link'} ↗</a>)}</div><footer><span>© {new Date().getFullYear()} {settings.display_name}</span><span>{settings.location}</span></footer></section>
  </main>
}

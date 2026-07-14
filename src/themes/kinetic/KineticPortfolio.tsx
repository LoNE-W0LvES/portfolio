import React from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import type { GitHubRepo, PortfolioSettings } from '../../lib/supabase'
import './kinetic.css'

interface Props { settings: PortfolioSettings; repos: GitHubRepo[]; reposLoading: boolean }
const reveal = { initial: { opacity: 0, y: 70 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .15 }, transition: { duration: .85, ease: [0.22, 1, 0.36, 1] as const } }

export default function KineticPortfolio({ settings, repos, reposLoading }: Props) {
  const { scrollYProgress } = useScroll()
  const drift = useTransform(scrollYProgress, [0, 1], ['0%', '-28%'])
  const skills = [...(settings.skills ?? []).flatMap(group => group.items), ...(settings.digital_skills ?? [])]
  return <main className="kinetic-theme">
    <motion.div className="kinetic-progress" style={{ scaleX: scrollYProgress }} />
    <nav className="kinetic-nav"><a href="#top" className="kinetic-mark">{settings.display_name?.slice(0, 2).toUpperCase() || 'PF'}</a><div><a href="#work">Work</a><a href="#about-k">About</a><a href="#contact-k">Contact</a></div></nav>
    <section id="top" className="kinetic-hero">
      <motion.div className="kinetic-orbit" style={{ y: drift }} aria-hidden="true" />
      <div className="kinetic-kicker"><span>Independent portfolio</span><span>{settings.location || 'Available worldwide'}</span></div>
      <div className="kinetic-headline" aria-label={settings.display_name}>
        {(settings.display_name || 'Your Name').split(' ').map((word, index) => <div className="kinetic-mask" key={word + index}><motion.span initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: .15 + index * .12, ease: [0.22,1,0.36,1] }}>{word}</motion.span></div>)}
      </div>
      <motion.div className="kinetic-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .8 }}><p>{settings.title}</p><p>{settings.bio}</p></motion.div>
      {settings.avatar_url && <motion.div className="kinetic-portrait" initial={{ clipPath: 'inset(100% 0 0 0)' }} animate={{ clipPath: 'inset(0% 0 0 0)' }} transition={{ duration: 1.1, delay: .5, ease: [0.22,1,0.36,1] }}><img src={settings.avatar_url} alt={settings.display_name} /></motion.div>}
      <a href="#about-k" className="kinetic-scroll">Scroll to explore <span>↓</span></a>
    </section>
    <div className="kinetic-marquee" aria-hidden="true"><div>{[0,1].map(i => <span key={i}>MOTION · DESIGN · CODE · EXPERIENCE · </span>)}</div></div>
    <motion.section id="about-k" className="kinetic-section kinetic-about" {...reveal}><span className="kinetic-index">01 / Profile</span><h2>{settings.about_text || settings.bio}</h2><div className="kinetic-stats"><div><b>{settings.work_experience?.length || 0}</b><span>Roles</span></div><div><b>{repos.length}</b><span>Repositories</span></div><div><b>{skills.length}</b><span>Skills</span></div></div></motion.section>
    {!!skills.length && <section className="kinetic-section kinetic-skills"><span className="kinetic-index">02 / Capabilities</span><div className="kinetic-skill-list">{skills.map((skill, i) => <motion.div key={skill+i} initial={{ opacity: 0, x: i%2 ? 60 : -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i*.04,.4) }}><span>{String(i+1).padStart(2,'0')}</span>{skill}</motion.div>)}</div></section>}
    <section id="work" className="kinetic-section kinetic-work"><span className="kinetic-index">03 / Selected work</span><h2>Projects that move ideas forward.</h2><div className="kinetic-projects">{reposLoading ? <p>Loading work…</p> : repos.slice(0,6).map((repo,i) => <motion.a href={repo.html_url} target="_blank" rel="noreferrer" key={repo.id} {...reveal}><span>0{i+1}</span><div><h3>{repo.name.replace(/-/g,' ')}</h3><p>{repo.description || 'Explore the repository and its implementation.'}</p></div><b>↗</b></motion.a>)}</div></section>
    {!!settings.work_experience?.length && <section className="kinetic-section kinetic-history"><span className="kinetic-index">04 / Experience</span>{settings.work_experience.map((item,i) => <motion.article key={i} {...reveal}><span>{item.period}</span><div><h3>{item.role}</h3><p>{item.company} · {item.location}</p><p>{item.description}</p></div></motion.article>)}</section>}
    <section id="contact-k" className="kinetic-contact"><motion.p {...reveal}>Have a project in mind?</motion.p><motion.a {...reveal} href={`mailto:${settings.email}`}>Let's create<br/>something <i>alive.</i></motion.a><footer><span>© {new Date().getFullYear()} {settings.display_name}</span><div>{settings.linkedin_url && <a href={settings.linkedin_url}>LinkedIn</a>}{settings.github_username && <a href={`https://github.com/${settings.github_username}`}>GitHub</a>}</div></footer></section>
  </main>
}

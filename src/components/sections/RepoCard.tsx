import React, { useState } from 'react'
import type { GitHubRepo } from '../../lib/supabase'

interface Props {
  repo: GitHubRepo
  langColors: Record<string, string>
}

export default function RepoCard({ repo, langColors }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [readme, setReadme] = useState<string | null>(null)
  const [readmeLoading, setReadmeLoading] = useState(false)
  const [readmeError, setReadmeError] = useState(false)

  const handleCardClick = async (e: React.MouseEvent) => {
    // Don't expand when clicking links/buttons inside the card
    if ((e.target as HTMLElement).closest('a, button')) return
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (readme !== null || readmeError) return
    setReadmeLoading(true)
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo.full_name}/readme`,
        { headers: { Accept: 'application/vnd.github.raw' } }
      )
      if (!res.ok) throw new Error('no readme')
      const text = await res.text()
      setReadme(text)
    } catch {
      setReadmeError(true)
    } finally {
      setReadmeLoading(false)
    }
  }

  const renderReadme = (text: string) => {
    let html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="readme-code"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="readme-inline-code">$1</code>')
      .replace(/^### (.+)$/gm, '<h4 class="readme-h4">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="readme-h3">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 class="readme-h2">$1</h2>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="readme-link">$1</a>')
      .replace(/^---+$/gm, '<hr class="readme-hr" />')
      .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="readme-ul">$&</ul>')
      .replace(/\n\n(?!<)/g, '</p><p class="readme-p">')
    return `<p class="readme-p">${html}</p>`
  }

  return (
    <div
      className={`repo-card ${expanded ? 'repo-card-expanded' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleCardClick(e as any)}
      aria-expanded={expanded}
    >
      <div className="repo-card-main">
        <div className="repo-card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16" className="repo-icon">
            <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>
            <rect x="7" y="7" width="10" height="10" rx="1"/>
          </svg>
          <span className="repo-name">{repo.name}</span>
          <svg
            className={`repo-chevron ${expanded ? 'repo-chevron-open' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        {repo.description && <p className="repo-desc">{repo.description}</p>}

        <div className="repo-meta">
          {repo.language && (
            <span className="repo-lang">
              <span className="repo-lang-dot" style={{ background: langColors[repo.language] ?? '#888' }} />
              {repo.language}
            </span>
          )}
          {repo.stargazers_count > 0 && (
            <span className="repo-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              {repo.stargazers_count}
            </span>
          )}
          {repo.forks_count > 0 && (
            <span className="repo-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <line x1="6" y1="3" x2="6" y2="15"/>
                <circle cx="18" cy="6" r="3"/>
                <circle cx="6" cy="18" r="3"/>
                <path d="M18 9a9 9 0 01-9 9"/>
              </svg>
              {repo.forks_count}
            </span>
          )}
          <span className="repo-click-hint">{expanded ? 'Click to collapse' : 'Click to view README'}</span>
        </div>

        <div className="repo-actions" onClick={e => e.stopPropagation()}>
          <a href={repo.html_url} target="_blank" rel="noreferrer" className="repo-open-btn">
            Open on GitHub
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
          {repo.homepage && (
            <a href={repo.homepage} target="_blank" rel="noreferrer" className="repo-open-btn repo-open-btn-accent">
              Live Demo
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
            </a>
          )}
        </div>
      </div>

      {expanded && (
        <div className="repo-readme" onClick={e => e.stopPropagation()}>
          {readmeLoading && <div className="readme-loading"><div className="spinner" /></div>}
          {readmeError && <p className="readme-empty">No README found for this repository.</p>}
          {readme && (
            <div className="readme-body" dangerouslySetInnerHTML={{ __html: renderReadme(readme) }} />
          )}
        </div>
      )}
    </div>
  )
}


export default RepoCard
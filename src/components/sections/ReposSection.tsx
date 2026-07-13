import React from 'react'
import type { GitHubRepo } from '../../lib/supabase'

interface Props {
  repos: GitHubRepo[]
  loading: boolean
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
}

export default function ReposSection({ repos, loading }: Props) {
  if (loading) {
    return (
      <section id="repos" className="section repos-section">
        <div className="section-inner">
          <h2 className="section-title">Projects</h2>
          <div className="repos-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="repo-card repo-card-skeleton" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!repos.length) return null

  return (
    <section id="repos" className="section repos-section">
      <div className="section-inner">
        <h2 className="section-title">Projects</h2>
        <div className="repos-grid">
          {repos.map(repo => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              className="repo-card"
            >
              <div className="repo-card-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" className="repo-icon">
                  <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                  <rect x="7" y="7" width="10" height="10" rx="1" />
                </svg>
                <span className="repo-name">{repo.name}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="repo-arrow">
                  <path d="M7 17L17 7M7 7h10v10" />
                </svg>
              </div>
              {repo.description && (
                <p className="repo-desc">{repo.description}</p>
              )}
              <div className="repo-meta">
                {repo.language && (
                  <span className="repo-lang">
                    <span
                      className="repo-lang-dot"
                      style={{ background: LANG_COLORS[repo.language] ?? '#888' }}
                    />
                    {repo.language}
                  </span>
                )}
                {repo.stargazers_count > 0 && (
                  <span className="repo-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {repo.stargazers_count}
                  </span>
                )}
                {repo.forks_count > 0 && (
                  <span className="repo-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <line x1="6" y1="3" x2="6" y2="15" />
                      <circle cx="18" cy="6" r="3" />
                      <circle cx="6" cy="18" r="3" />
                      <path d="M18 9a9 9 0 01-9 9" />
                    </svg>
                    {repo.forks_count}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

import React, { useState } from 'react'
import type { GitHubRepo } from '../../../lib/supabase'
import RepoCard from './RepoCard'

interface Props {
  repos: GitHubRepo[]
  loading: boolean
  githubUsername: string
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', 'C#': '#178600', Ruby: '#701516', PHP: '#4F5D95',
  Swift: '#ffac45', Kotlin: '#A97BFF', Dart: '#00B4AB', HTML: '#e34c26',
  CSS: '#563d7c', Shell: '#89e051',
}

export { LANG_COLORS }

export default function ReposSection({ repos, loading, githubUsername }: Props) {
  if (loading) {
    return (
      <section id="repos" className="section repos-section">
        <div className="section-inner">
          <h2 className="section-title">GitHub Repositories</h2>
          <div className="repos-grid">
            {[...Array(6)].map((_, i) => <div key={i} className="repo-card-skeleton" />)}
          </div>
        </div>
      </section>
    )
  }

  if (!repos.length && githubUsername) {
    return (
      <section id="repos" className="section repos-section">
        <div className="section-inner">
          <h2 className="section-title">GitHub Repositories</h2>
          <p className="section-empty">No public repositories found.</p>
        </div>
      </section>
    )
  }

  if (!repos.length) return null

  return (
    <section id="repos" className="section repos-section">
      <div className="section-inner">
        <div className="section-title-row">
          <h2 className="section-title">GitHub Repositories</h2>
          {githubUsername && (
            <a href={`https://github.com/${githubUsername}`} target="_blank" rel="noreferrer" className="section-title-link">
              View all on GitHub
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M7 17L17 7M7 7h10v10"/></svg>
            </a>
          )}
        </div>
        <div className="repos-grid">
          {repos.map(repo => (
            <RepoCard key={repo.id} repo={repo} langColors={LANG_COLORS} />
          ))}
        </div>
      </div>
    </section>
  )
}

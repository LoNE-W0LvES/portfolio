import React from 'react'
import type { GitHubRepo, RepoVisibility } from '../../lib/supabase'

interface Props {
  repos: GitHubRepo[]
  loading: boolean
  repoVisibility: RepoVisibility[]
  onToggle: (repoName: string, fullName: string, visible: boolean) => Promise<void>
  githubUsername: string
}

export default function EditRepos({ repos, loading, repoVisibility, onToggle, githubUsername }: Props) {
  const getVisible = (repo: GitHubRepo): boolean => {
    const entry = repoVisibility.find(r => r.repo_name === repo.full_name || r.repo_name === repo.name)
    return entry ? entry.visible : true
  }

  if (!githubUsername) {
    return (
      <div className="edit-repos-empty">
        <p>Set a GitHub username in the Profile tab to manage repo visibility.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="edit-repos-loading">
        <div className="spinner" />
        <p>Loading repos...</p>
      </div>
    )
  }

  if (!repos.length) {
    return (
      <div className="edit-repos-empty">
        <p>No repositories found for <strong>@{githubUsername}</strong>.</p>
      </div>
    )
  }

  return (
    <div className="edit-repos-panel">
      <p className="edit-hint">
        All repos are shown by default. Toggle to hide individual repos from your portfolio.
      </p>
      <ul className="repo-list">
        {repos.map(repo => {
          const visible = getVisible(repo)
          return (
            <li key={repo.id} className={`repo-list-item ${!visible ? 'repo-hidden' : ''}`}>
              <div className="repo-list-info">
                <span className="repo-list-name">{repo.name}</span>
                {repo.description && (
                  <span className="repo-list-desc">{repo.description}</span>
                )}
              </div>
              <button
                className={`repo-toggle-btn ${visible ? 'visible' : 'hidden'}`}
                onClick={() => onToggle(repo.name, repo.full_name, !visible)}
                title={visible ? 'Hide this repo' : 'Show this repo'}
              >
                {visible ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Showing
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                    Hidden
                  </>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

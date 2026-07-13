import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Theme = 'light' | 'dark' | 'auto'

export interface PortfolioSettings {
  id: number
  github_username: string
  display_name: string
  title: string
  bio: string
  avatar_url: string
  email: string
  location: string
  website_url: string
  linkedin_url: string
  twitter_url: string
  sections_order: string[]
  sections_visible: Record<string, boolean>
  theme: Theme
  accent_color: string
  created_at: string
  updated_at: string
}

export interface RepoVisibility {
  id: string
  repo_name: string
  visible: boolean
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  topics: string[]
  updated_at: string
  homepage: string | null
  fork: boolean
}

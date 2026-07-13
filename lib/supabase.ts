import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export type Theme = 'light' | 'dark'

export interface Skill {
  category: string
  items: string[]
}

export interface Education {
  degree: string
  institution: string
  period: string
  location: string
  url: string
  field: string
}

export interface CvProject {
  title: string
  description: string
  tags: string[]
}

export interface Award {
  year: string
  title: string
  org: string
}

export interface Language {
  name: string
  level: string
}

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
  discord_username: string
  phone: string
  whatsapp: string
  nationality: string
  sections_order: string[]
  sections_visible: Record<string, boolean>
  theme: Theme
  accent_color: string
  skills: Skill[]
  education: Education[]
  cv_projects: CvProject[]
  awards: Award[]
  languages: Language[]
  digital_skills: string[]
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
  default_branch: string
}

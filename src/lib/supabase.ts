import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

export interface WorkExperience {
  role: string
  company: string
  period: string
  location: string
  url: string
  description: string
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
  work_experience: WorkExperience[]
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

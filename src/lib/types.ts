export type Role = 'user' | 'admin'
export type ItemType = 'file' | 'link'
export type Visibility = 'private' | 'public' | 'members' | 'unlisted'
export type ItemStatus = 'draft' | 'published' | 'archived'

export interface Profile {
  user_id: string
  display_name: string | null
  email: string | null
  avatar_url: string | null
  role: Role
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  sort_order: number
  active: boolean
}

export interface Folder {
  id: string
  owner_id: string
  parent_id: string | null
  name: string
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  owner_id: string
  folder_id: string | null
  category_id: string | null
  item_type: ItemType
  title: string
  slug: string
  description: string | null
  visibility: Visibility
  status: ItemStatus
  download_requires_auth: boolean
  external_url: string | null
  storage_path: string | null
  preview_path: string | null
  file_name: string | null
  mime_type: string | null
  size_bytes: number | null
  version: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  download_count: number
  click_count: number
  lilkank_categories?: { name: string; slug: string } | null
  lilkank_folders?: { name: string } | null
}

export interface Settings {
  id: number
  site_name: string
  site_tagline: string
  allow_registration: boolean
  require_auth_for_downloads: boolean
  default_visibility: Visibility
  created_at: string
  updated_at: string
}

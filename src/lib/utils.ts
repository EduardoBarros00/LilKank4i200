import { supabase } from './supabase'

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function uniqueSlug(title: string) {
  const base = slugify(title) || 'item'
  return `${base}-${Math.random().toString(36).slice(2, 8)}`
}

export function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
}

export function formatBytes(bytes?: number | null) {
  if (bytes === null || bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`
}

export function formatDate(value?: string | null, withTime = false) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value))
}

export function getPreviewUrl(path?: string | null) {
  if (!path) return null
  return supabase.storage.from('lilkank-previews').getPublicUrl(path).data.publicUrl
}

export function safeExternalUrl(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export function shortId(value?: string | null) {
  if (!value) return 'Visitante'
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DEFAULT_BACKGROUND } from '../assets/defaultBackground'
import { db } from '../lib/supabase'
import type { Settings } from '../lib/types'

export function SiteAppearance() {
  const { data } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await db.from('lilkank_settings').select('*').eq('id', 1).maybeSingle()
      if (error) throw error
      return data as Settings | null
    },
    staleTime: 60_000,
  })

  useEffect(() => {
    const root = document.documentElement
    const image = data?.background_image_url?.trim() || DEFAULT_BACKGROUND
    const overlay = Math.min(85, Math.max(0, Number(data?.background_overlay ?? 46))) / 100
    const position = data?.background_position?.trim() || 'center'

    root.style.setProperty('--site-background-image', `url("${image}")`)
    root.style.setProperty('--site-background-overlay', String(overlay))
    root.style.setProperty('--site-background-position', position)
    if (data?.site_name) document.title = data.site_name
  }, [data])

  return null
}

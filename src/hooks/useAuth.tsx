import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { db, supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

type AuthValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (userId?: string | null) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data } = await db.from('lilkank_profiles').select('*').eq('user_id', userId).maybeSingle()
    setProfile((data as Profile | null) || null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session?.user.id)
      setLoading(false)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next)
      await loadProfile(next?.user.id)
      setLoading(false)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthValue>(() => ({
    session,
    user: session?.user || null,
    profile,
    loading,
    refreshProfile: async () => loadProfile(session?.user.id),
  }), [session, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return value
}

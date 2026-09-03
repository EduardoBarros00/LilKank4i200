import { Navigate, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullLoader />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return children
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullLoader />
  if (!user) return <Navigate to="/login?next=/admin" replace />
  if (profile?.role !== 'admin') return <Navigate to="/conta" replace />
  return children
}

export function FullLoader() {
  return <div className="full-loader"><LoaderCircle className="spin" size={28} /><span>Carregando…</span></div>
}

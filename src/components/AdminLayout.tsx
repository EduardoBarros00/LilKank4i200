import { Archive, Download, FileUp, FolderLock, Gauge, HardDriveDownload, Link2, LogOut, Settings, UsersRound, World } from 'lucide-react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const nav = [
  { to: '/admin', end: true, label: 'Dashboard', icon: Gauge },
  { to: '/admin/cofre', label: 'Meu Cofre', icon: FolderLock },
  { to: '/admin/arquivos', label: 'Arquivos', icon: FileUp },
  { to: '/admin/links', label: 'Links', icon: Link2 },
  { to: '/admin/publicacoes', label: 'Publicações', icon: Archive },
  { to: '/admin/usuarios', label: 'Usuários', icon: UsersRound },
  { to: '/admin/downloads', label: 'Downloads', icon: Download },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export function AdminLayout() {
  const { profile } = useAuth()
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link className="admin-brand" to="/"><span className="brand-mark"><HardDriveDownload size={19} /></span><div><strong>LilKank</strong><small>Painel Admin</small></div></Link>
      <nav className="admin-nav">{nav.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon size={17} /><span>{label}</span></NavLink>)}</nav>
      <div className="admin-sidebar-foot"><Link to="/" className="btn btn-outline btn-block"><World size={16} />Ver site público</Link><button className="btn btn-ghost btn-block" onClick={async () => { await supabase.auth.signOut(); window.location.assign('/') }}><LogOut size={16} />Sair</button></div>
    </aside>
    <div className="admin-main"><header className="admin-top"><div><strong>Painel LilKank</strong><span>{profile?.display_name || 'Administrador'}</span></div><Link to="/conta" className="admin-avatar">{(profile?.display_name || 'A').slice(0, 1).toUpperCase()}</Link></header><main className="admin-content"><Outlet /></main></div>
  </div>
}

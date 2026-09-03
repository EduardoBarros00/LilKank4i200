import { HardDriveDownload, LogIn, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

export function PublicLayout() {
  const { user, profile } = useAuth()
  const { dark, toggle } = useTheme()
  return <div className="site-shell">
    <header className="topbar"><div className="container topbar-inner">
      <Link className="brand" to="/"><span className="brand-mark"><HardDriveDownload size={20} /></span><strong>LilKank</strong></Link>
      <nav className="main-nav"><NavLink to="/" end>Início</NavLink><NavLink to="/explorar">Explorar</NavLink><NavLink to="/links">Links</NavLink></nav>
      <div className="top-actions"><button className="icon-btn" onClick={toggle} aria-label="Alternar tema">{dark ? <Sun size={17} /> : <Moon size={17} />}</button>{profile?.role === 'admin' && <Link className="btn btn-outline hide-mobile" to="/admin"><ShieldCheck size={16} />Admin</Link>}{user ? <Link className="btn btn-primary" to="/conta"><UserRound size={16} />Minha conta</Link> : <Link className="btn btn-primary" to="/login"><LogIn size={16} />Entrar</Link>}</div>
    </div><nav className="mobile-nav"><NavLink to="/" end>Início</NavLink><NavLink to="/explorar">Explorar</NavLink><NavLink to="/links">Links</NavLink>{user && <NavLink to="/downloads">Downloads</NavLink>}</nav></header>
    <Outlet />
    <footer className="footer"><div className="container footer-inner"><span>© {new Date().getFullYear()} LilKank</span><span>Arquivos, links e downloads protegidos em um só lugar.</span></div></footer>
  </div>
}

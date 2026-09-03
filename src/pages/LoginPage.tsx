import { FormEvent, useEffect, useState } from 'react'
import { HardDriveDownload, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { notify } from '../lib/notify'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (user) window.location.assign(next.startsWith('/') ? next : '/') }, [user, next])
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) return notify(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message, 'error')
    notify('Login realizado com sucesso.')
    window.location.assign(next.startsWith('/') ? next : '/')
  }
  return <main className="auth-layout"><section className="auth-side"><Link className="brand brand-inverse" to="/"><span className="brand-mark"><HardDriveDownload size={20} /></span><strong>LilKank</strong></Link><div><small>Acesso seguro</small><h1>Baixe, salve e acompanhe seus conteúdos.</h1><p>O cadastro protege os downloads e permite manter favoritos e histórico em um só lugar.</p></div><span>LilKank · Espaço digital</span></section><section className="auth-form-wrap"><form className="auth-card" onSubmit={submit}><Link className="brand auth-mobile-brand" to="/"><span className="brand-mark"><HardDriveDownload size={18} /></span><strong>LilKank</strong></Link><small>Entrar</small><h2>Acessar sua conta</h2><p>Use seu e-mail e senha para continuar.</p><label>E-mail<div className="input-icon"><Mail size={17} /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" /></div></label><label>Senha<div className="input-icon"><LockKeyhole size={17} /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div></label><button className="btn btn-primary btn-large btn-block" disabled={busy}>{busy && <LoaderCircle className="spin" size={18} />}Entrar</button><div className="auth-switch">Ainda não tem conta? <Link to={`/cadastro?next=${encodeURIComponent(next)}`}>Criar conta gratuita</Link></div><Link className="back-link" to="/">← Voltar à biblioteca</Link></form></section></main>
}

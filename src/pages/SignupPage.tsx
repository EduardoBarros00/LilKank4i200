import { useQuery } from '@tanstack/react-query'
import { FormEvent, useState } from 'react'
import { CheckCircle2, HardDriveDownload, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { notify } from '../lib/notify'
import { db, supabase } from '../lib/supabase'

export function SignupPage() {
  const [params] = useSearchParams(); const next = params.get('next') || '/'
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false)
  const { data: settings } = useQuery({ queryKey: ['registration-settings'], queryFn: async () => (await db.from('lilkank_settings').select('allow_registration').eq('id', 1).maybeSingle()).data })
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 8) return notify('Use uma senha com pelo menos 8 caracteres.', 'error')
    if (password !== confirm) return notify('As senhas não coincidem.', 'error')
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } })
    setBusy(false)
    if (error) return notify(error.message, 'error')
    if (data.session) window.location.assign(next.startsWith('/') ? next : '/')
    else setDone(true)
  }
  if (settings?.allow_registration === false) return <main className="center-box"><div className="message-card"><HardDriveDownload size={30} /><h1>Cadastros temporariamente fechados</h1><p>O administrador desativou novos cadastros neste momento.</p><Link className="btn btn-primary" to="/">Voltar ao início</Link></div></main>
  if (done) return <main className="center-box"><div className="message-card"><CheckCircle2 size={32} /><h1>Confira seu e-mail</h1><p>Enviamos uma confirmação para <strong>{email}</strong>. Confirme o endereço e depois faça login.</p><Link className="btn btn-primary" to="/login">Ir para o login</Link></div></main>
  return <main className="auth-form-only"><form className="auth-card" onSubmit={submit}><Link className="brand" to="/"><span className="brand-mark"><HardDriveDownload size={18} /></span><strong>LilKank</strong></Link><small>Conta gratuita</small><h2>Criar sua conta</h2><p>Cadastre-se para liberar downloads protegidos e salvar favoritos.</p><label>Nome<div className="input-icon"><UserRound size={17} /><input required value={name} onChange={(e) => setName(e.target.value)} /></div></label><label>E-mail<div className="input-icon"><Mail size={17} /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div></label><label>Senha<div className="input-icon"><LockKeyhole size={17} /><input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div></label><label>Confirmar senha<input type="password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label><button className="btn btn-primary btn-large btn-block" disabled={busy}>{busy && <LoaderCircle className="spin" size={18} />}Criar conta</button><div className="auth-switch">Já tem conta? <Link to={`/login?next=${encodeURIComponent(next)}`}>Entrar</Link></div></form></main>
}

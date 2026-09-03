import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Heart, LoaderCircle, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ItemCard } from '../components/ItemCard'
import { useAuth } from '../hooks/useAuth'
import { notify } from '../lib/notify'
import { db, supabase } from '../lib/supabase'
import type { Item } from '../lib/types'

export function AccountPage() {
  const { user, profile, refreshProfile } = useAuth(); const qc = useQueryClient(); const [name, setName] = useState(profile?.display_name || '')
  useEffect(() => setName(profile?.display_name || ''), [profile?.display_name])
  const { data: favorites = [] } = useQuery({ queryKey: ['favorites', user?.id], queryFn: async () => {
    const { data } = await db.from('lilkank_favorites').select('item_id, lilkank_items(*, lilkank_categories(name,slug))').eq('user_id', user!.id).order('created_at', { ascending: false })
    return (data || []).map((row: any) => row.lilkank_items).filter(Boolean) as Item[]
  } })
  const save = useMutation({ mutationFn: async () => { const { error } = await db.from('lilkank_profiles').update({ display_name: name.trim() }).eq('user_id', user!.id); if (error) throw error }, onSuccess: async () => { await refreshProfile(); qc.invalidateQueries({ queryKey: ['profile'] }); notify('Perfil atualizado.') }, onError: (error: Error) => notify(error.message, 'error') })
  return <main className="container page"><div className="page-head"><div><small>Sua área</small><h1>Minha conta</h1><p>Perfil, favoritos e atalhos da sua conta.</p></div><div className="page-actions">{profile?.role === 'admin' && <Link className="btn btn-outline" to="/admin"><ShieldCheck size={16} />Painel Admin</Link>}<button className="btn btn-outline" onClick={async () => { await supabase.auth.signOut(); window.location.assign('/') }}><LogOut size={16} />Sair</button></div></div><div className="account-grid"><section className="panel profile-panel"><span className="big-icon"><UserRound size={22} /></span><h3>Perfil</h3><p className="muted">{user?.email}</p><label>Nome exibido<input value={name} onChange={(e) => setName(e.target.value)} /></label><button className="btn btn-primary btn-block" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <LoaderCircle className="spin" size={17} />}Salvar perfil</button><Link className="btn btn-soft btn-block" to="/downloads"><Download size={16} />Meus downloads</Link></section><section><div className="subhead"><Heart size={20} /><h2>Favoritos</h2></div>{favorites.length ? <div className="item-grid two-col">{favorites.map((item) => <ItemCard key={item.id} item={item} />)}</div> : <div className="empty compact"><h3>Nenhum favorito</h3><p>Abra um item e use “Salvar nos favoritos”.</p></div>}</section></div></main>
}

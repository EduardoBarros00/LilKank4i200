import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../lib/notify'
import { db } from '../../lib/supabase'
import type { Profile, Role } from '../../lib/types'
import { formatDate, shortId } from '../../lib/utils'
import { AdminEmpty } from './AdminDashboard'

export function UsersAdminPage() {
  const { user } = useAuth(); const qc = useQueryClient()
  const { data = [] } = useQuery({ queryKey: ['admin-users'], queryFn: async () => { const { data, error } = await db.from('lilkank_profiles').select('*').order('created_at', { ascending: false }); if (error) throw error; return (data || []) as Profile[] } })
  const setRole = async (profile: Profile, role: Role) => {
    if (profile.user_id === user?.id && role !== 'admin') return notify('Você não pode remover seu próprio acesso administrativo.', 'error')
    if (!window.confirm(`Alterar ${profile.display_name || profile.email || shortId(profile.user_id)} para ${role === 'admin' ? 'administrador' : 'usuário'}?`)) return
    const { error } = await db.rpc('lilkank_set_user_role', { target_user: profile.user_id, new_role: role })
    if (error) return notify(error.message, 'error')
    qc.invalidateQueries({ queryKey: ['admin-users'] }); notify('Função do usuário atualizada.')
  }
  return <>
    <div className="admin-page-head"><div><small>Acesso</small><h1>Usuários</h1><p>Contas cadastradas no LilKank e seus níveis de permissão.</p></div><span className="chip chip-primary">{data.length} usuários</span></div>
    <section className="panel">{data.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Usuário</th><th>E-mail</th><th>ID</th><th>Cadastro</th><th>Função</th></tr></thead><tbody>{data.map((profile) => <tr key={profile.user_id}><td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>{profile.role === 'admin' ? <ShieldCheck size={15} /> : <UserRound size={15} />}<strong>{profile.display_name || 'Sem nome'}</strong></span></td><td>{profile.email || '—'}</td><td title={profile.user_id}>{shortId(profile.user_id)}</td><td>{formatDate(profile.created_at)}</td><td><select value={profile.role} onChange={(e) => setRole(profile, e.target.value as Role)} disabled={profile.user_id === user?.id}><option value="user">Usuário</option><option value="admin">Administrador</option></select></td></tr>)}</tbody></table></div> : <AdminEmpty text="Nenhum usuário cadastrado ainda." />}</section>
  </>
}

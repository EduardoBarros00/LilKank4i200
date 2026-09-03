import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, FileText, Link2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../lib/notify'
import { db } from '../../lib/supabase'
import type { Item, ItemStatus, Visibility } from '../../lib/types'
import { formatDate } from '../../lib/utils'
import { AdminEmpty } from './AdminDashboard'

export function PublicationsPage() {
  const { user } = useAuth(); const qc = useQueryClient(); const [filter, setFilter] = useState('todos')
  const { data = [] } = useQuery({ queryKey: ['publications', user?.id], queryFn: async () => {
    const { data } = await db.from('lilkank_items').select('*, lilkank_categories(name,slug)').eq('owner_id', user!.id).order('updated_at', { ascending: false }); return (data || []) as Item[]
  } })
  const rows = data.filter((item) => filter === 'todos' || item.status === filter)
  const update = async (item: Item, patch: Record<string, unknown>) => {
    const next = { ...patch }
    if (patch.status === 'published' && !item.published_at) next.published_at = new Date().toISOString()
    const { error } = await db.from('lilkank_items').update(next).eq('id', item.id)
    if (error) return notify(error.message, 'error')
    qc.invalidateQueries({ queryKey: ['publications'] }); qc.invalidateQueries({ queryKey: ['home'] }); qc.invalidateQueries({ queryKey: ['explore'] }); notify('Publicação atualizada.')
  }
  return <>
    <div className="admin-page-head"><div><small>Controle editorial</small><h1>Publicações</h1><p>Defina o que fica privado, público, disponível para cadastrados ou não listado.</p></div><div className="toolbar"><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="todos">Todos</option><option value="draft">Rascunhos</option><option value="published">Publicados</option><option value="archived">Arquivados</option></select></div></div>
    <section className="panel">{rows.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Conteúdo</th><th>Tipo</th><th>Status</th><th>Visibilidade</th><th>Login no download</th><th>Atualizado</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><strong>{item.title}</strong></td><td>{item.item_type === 'file' ? <span className="chip"><FileText size={12} />Arquivo</span> : <span className="chip"><Link2 size={12} />Link</span>}</td><td><select value={item.status} onChange={(e) => update(item, { status: e.target.value as ItemStatus })}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></td><td><select value={item.visibility} onChange={(e) => update(item, { visibility: e.target.value as Visibility })}><option value="private">Privado</option><option value="public">Público</option><option value="members">Cadastrados</option><option value="unlisted">Não listado</option></select></td><td>{item.item_type === 'file' ? <input type="checkbox" checked={item.download_requires_auth} onChange={(e) => update(item, { download_requires_auth: e.target.checked })} aria-label="Exigir login" /> : '—'}</td><td>{formatDate(item.updated_at)}</td></tr>)}</tbody></table></div> : <AdminEmpty text="Nenhuma publicação neste filtro." />}</section>
    <div className="hint" style={{ marginTop: 12 }}><Eye size={16} />“Não listado” pode ser acessado pelo endereço direto, mas não aparece nas listagens públicas.</div>
  </>
}

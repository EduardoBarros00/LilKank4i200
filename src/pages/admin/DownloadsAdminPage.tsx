import { useQuery } from '@tanstack/react-query'
import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { db } from '../../lib/supabase'
import type { Profile } from '../../lib/types'
import { formatDate, shortId } from '../../lib/utils'
import { AdminEmpty } from './AdminDashboard'

export function DownloadsAdminPage() {
  const [search, setSearch] = useState(''); const [period, setPeriod] = useState('todos')
  const { data } = useQuery({ queryKey: ['admin-downloads'], queryFn: async () => {
    const [downloads, profiles] = await Promise.all([
      db.from('lilkank_downloads').select('id,item_id,user_id,downloaded_at,lilkank_items(title,slug,file_name)').order('downloaded_at', { ascending: false }).limit(1000),
      db.from('lilkank_profiles').select('*'),
    ])
    const map = new Map<string, Profile>((profiles.data || []).map((p: Profile) => [p.user_id, p]))
    return (downloads.data || []).map((row: any) => ({ ...row, profile: row.user_id ? map.get(row.user_id) : null }))
  } })
  const rows = useMemo(() => {
    const now = Date.now(); const q = search.toLowerCase().trim()
    return (data || []).filter((row: any) => {
      if (period !== 'todos') {
        const days = Number(period); if (new Date(row.downloaded_at).getTime() < now - days * 86400000) return false
      }
      const text = `${row.lilkank_items?.title || ''} ${row.profile?.display_name || ''} ${row.profile?.email || ''} ${row.user_id || ''}`.toLowerCase()
      return !q || text.includes(q)
    })
  }, [data, search, period])
  return <>
    <div className="admin-page-head"><div><small>Auditoria</small><h1>Downloads</h1><p>Histórico de downloads realizados no site.</p></div><span className="chip chip-primary"><Download size={13} />{rows.length} registros</span></div>
    <div className="toolbar" style={{ marginBottom: 14 }}><label className="search-field" style={{ width: 300 }}><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Arquivo, usuário ou e-mail" /></label><select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="todos">Todo o período</option><option value="1">Últimas 24 horas</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option></select></div>
    <section className="panel">{rows.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Arquivo</th><th>Usuário</th><th>E-mail</th><th>Data</th></tr></thead><tbody>{rows.map((row: any) => <tr key={row.id}><td><strong>{row.lilkank_items?.title || 'Arquivo removido'}</strong></td><td>{row.profile?.display_name || (row.user_id ? shortId(row.user_id) : 'Visitante')}</td><td>{row.profile?.email || '—'}</td><td>{formatDate(row.downloaded_at, true)}</td></tr>)}</tbody></table></div> : <AdminEmpty text="Nenhum download encontrado." />}</section>
  </>
}

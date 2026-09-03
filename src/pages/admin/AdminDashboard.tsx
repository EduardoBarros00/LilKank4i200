import { useQuery } from '@tanstack/react-query'
import { Download, FileText, Link2, UsersRound } from 'lucide-react'
import { db } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'

export function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const [items, users, downloads, todayDownloads, top, recent] = await Promise.all([
        db.from('lilkank_items').select('id,item_type,status', { count: 'exact' }),
        db.from('lilkank_profiles').select('user_id', { count: 'exact', head: true }),
        db.from('lilkank_downloads').select('id', { count: 'exact', head: true }),
        db.from('lilkank_downloads').select('id', { count: 'exact', head: true }).gte('downloaded_at', today.toISOString()),
        db.from('lilkank_items').select('id,title,slug,download_count,item_type').eq('item_type', 'file').order('download_count', { ascending: false }).limit(6),
        db.from('lilkank_downloads').select('id,user_id,downloaded_at,lilkank_items(title,slug)').order('downloaded_at', { ascending: false }).limit(8),
      ])
      const rows = items.data || []
      return {
        files: rows.filter((r: any) => r.item_type === 'file').length,
        links: rows.filter((r: any) => r.item_type === 'link').length,
        users: users.count || 0,
        downloads: downloads.count || 0,
        today: todayDownloads.count || 0,
        top: top.data || [],
        recent: recent.data || [],
      }
    },
  })

  const stats = [
    { label: 'Arquivos', value: data?.files || 0, icon: FileText },
    { label: 'Links', value: data?.links || 0, icon: Link2 },
    { label: 'Usuários', value: data?.users || 0, icon: UsersRound },
    { label: 'Downloads', value: data?.downloads || 0, icon: Download },
  ]

  return <>
    <div className="admin-page-head"><div><small>Visão geral</small><h1>Dashboard</h1><p>Acompanhe o crescimento e a atividade do LilKank.</p></div><div className="chip chip-primary">{data?.today || 0} downloads hoje</div></div>
    <div className="stat-grid">{stats.map(({ label, value, icon: Icon }) => <div className="stat-card" key={label}><span><Icon size={18} /></span><strong>{isLoading ? '…' : value}</strong><small>{label}</small></div>)}</div>
    <div className="admin-grid">
      <section className="panel"><div className="panel-title"><h3>Arquivos mais baixados</h3></div>{data?.top.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Arquivo</th><th>Downloads</th></tr></thead><tbody>{data.top.map((item: any) => <tr key={item.id}><td><strong>{item.title}</strong></td><td>{item.download_count || 0}</td></tr>)}</tbody></table></div> : <AdminEmpty text="Ainda não há arquivos publicados." />}</section>
      <section className="panel"><div className="panel-title"><h3>Atividade recente</h3></div>{data?.recent.length ? <div className="list-stack">{data.recent.map((row: any) => <div className="manage-row" key={row.id}><span className="row-icon"><Download size={16} /></span><div className="row-main"><strong>{row.lilkank_items?.title || 'Arquivo removido'}</strong><small>{formatDate(row.downloaded_at, true)}</small></div></div>)}</div> : <AdminEmpty text="Nenhum download registrado ainda." />}</section>
    </div>
  </>
}

export function AdminEmpty({ text }: { text: string }) {
  return <div className="empty compact"><p>{text}</p></div>
}

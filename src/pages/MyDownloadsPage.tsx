import { useQuery } from '@tanstack/react-query'
import { Download, FileText, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { db } from '../lib/supabase'
import { formatBytes, formatDate } from '../lib/utils'

export function MyDownloadsPage() {
  const { user } = useAuth()
  const { data = [], isLoading } = useQuery({ queryKey: ['my-downloads', user?.id], queryFn: async () => {
    const { data, error } = await db.from('lilkank_downloads').select('id,downloaded_at,lilkank_items(id,title,slug,file_name,size_bytes,version)').eq('user_id', user!.id).order('downloaded_at', { ascending: false }).limit(200)
    if (error) throw error
    return data || []
  } })
  return <main className="container page"><div className="page-head"><div><small>Histórico</small><h1>Meus downloads</h1><p>Arquivos que você baixou usando esta conta.</p></div><span className="big-icon"><Download size={22} /></span></div><div className="table-card">{isLoading ? <div className="center-pad"><LoaderCircle className="spin" /></div> : data.length ? <div className="download-list">{data.map((row: any) => { const item = row.lilkank_items; return <div className="download-row" key={row.id}><span className="file-icon"><FileText size={18} /></span><div className="grow"><strong>{item?.title || 'Arquivo removido'}</strong><small>{formatDate(row.downloaded_at, true)} · {formatBytes(item?.size_bytes)} {item?.version ? `· v${item.version}` : ''}</small></div>{item?.slug && <Link className="btn btn-outline btn-small" to={`/item/${item.slug}`}>Abrir</Link>}</div> })}</div> : <div className="empty compact"><h3>Seu histórico está vazio</h3><p>Os próximos downloads aparecerão aqui.</p></div>}</div></main>
}

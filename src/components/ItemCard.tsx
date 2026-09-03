import { Download, ExternalLink, FileText, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Item } from '../lib/types'
import { formatBytes, getPreviewUrl } from '../lib/utils'

export function ItemCard({ item }: { item: Item }) {
  const preview = getPreviewUrl(item.preview_path)
  return (
    <Link className="item-card" to={`/item/${item.slug}`}>
      <div className="item-cover">
        {preview ? <img src={preview} alt="" loading="lazy" /> : <div className="item-placeholder">{item.item_type === 'file' ? <FileText size={30} /> : <Link2 size={30} />}</div>}
        <span className="chip cover-chip">{item.item_type === 'file' ? 'Arquivo' : 'Link'}</span>
      </div>
      <div className="item-body">
        <div className="item-title-row"><h3>{item.title}</h3>{item.item_type === 'file' ? <Download size={16} /> : <ExternalLink size={16} />}</div>
        <p>{item.description || 'Sem descrição.'}</p>
        <div className="item-meta"><span>{item.lilkank_categories?.name || (item.item_type === 'file' ? formatBytes(item.size_bytes) : 'Link externo')}</span><span>{item.item_type === 'file' ? `${item.download_count || 0} downloads` : `${item.click_count || 0} acessos`}</span></div>
      </div>
    </Link>
  )
}

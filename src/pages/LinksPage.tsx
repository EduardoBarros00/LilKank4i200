import { useQuery } from '@tanstack/react-query'
import { Link2 } from 'lucide-react'
import { ItemCard } from '../components/ItemCard'
import { Empty } from './HomePage'
import { db } from '../lib/supabase'
import type { Item } from '../lib/types'

export function LinksPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['public-links'], queryFn: async () => {
    const { data } = await db.from('lilkank_items').select('*, lilkank_categories(name,slug)').eq('item_type', 'link').eq('status', 'published').in('visibility', ['public', 'members']).order('published_at', { ascending: false })
    return (data || []) as Item[]
  } })
  return <main className="container page"><div className="page-head"><div><small>Curadoria</small><h1>Links publicados</h1><p>Sites, páginas e recursos externos organizados em um só lugar.</p></div><span className="big-icon"><Link2 size={22} /></span></div><div className="section-tight">{isLoading ? <div className="item-grid">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-card"><div /><span /><span /></div>)}</div> : data.length ? <div className="item-grid">{data.map((item) => <ItemCard key={item.id} item={item} />)}</div> : <Empty title="Nenhum link publicado" text="Os links públicos aparecerão aqui quando forem adicionados." />}</div></main>
}

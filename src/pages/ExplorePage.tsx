import { useQuery } from '@tanstack/react-query'
import { Grid2X2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ItemCard } from '../components/ItemCard'
import { Empty } from './HomePage'
import { db } from '../lib/supabase'
import type { Category, Item } from '../lib/types'

export function ExplorePage() {
  const [params] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')
  const [type, setType] = useState(params.get('tipo') || 'todos')
  const [category, setCategory] = useState(params.get('categoria') || 'todas')
  const [order, setOrder] = useState('recentes')
  const { data, isLoading } = useQuery({ queryKey: ['explore'], queryFn: async () => {
    const [items, categories] = await Promise.all([
      db.from('lilkank_items').select('*, lilkank_categories(name,slug)').eq('status', 'published').in('visibility', ['public', 'members']).order('published_at', { ascending: false }),
      db.from('lilkank_categories').select('*').eq('active', true).order('sort_order'),
    ])
    return { items: (items.data || []) as Item[], categories: (categories.data || []) as Category[] }
  } })
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...(data?.items || [])].filter((item) => type === 'todos' || item.item_type === type).filter((item) => category === 'todas' || item.lilkank_categories?.slug === category).filter((item) => !q || `${item.title} ${item.description || ''} ${item.file_name || ''}`.toLowerCase().includes(q)).sort((a, b) => {
      if (order === 'baixados') return (b.download_count || 0) - (a.download_count || 0)
      if (order === 'acessos') return (b.click_count || 0) - (a.click_count || 0)
      return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
    })
  }, [data, search, type, category, order])
  return <main className="container page"><div className="page-head"><div><small>Biblioteca pública</small><h1>Explorar conteúdos</h1><p>Pesquise arquivos e links publicados no LilKank.</p></div><span className="count"><Grid2X2 size={16} />{filtered.length} resultado{filtered.length === 1 ? '' : 's'}</span></div>
    <div className="filter-bar"><label className="search-field"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar..." /></label><select value={type} onChange={(e) => setType(e.target.value)}><option value="todos">Todos os tipos</option><option value="file">Arquivos</option><option value="link">Links</option></select><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="todas">Todas as categorias</option>{(data?.categories || []).map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select><select value={order} onChange={(e) => setOrder(e.target.value)}><option value="recentes">Mais recentes</option><option value="baixados">Mais baixados</option><option value="acessos">Mais acessados</option></select></div>
    <div className="section-tight">{isLoading ? <div className="item-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-card"><div /><span /><span /></div>)}</div> : filtered.length ? <div className="item-grid">{filtered.map((item) => <ItemCard key={item.id} item={item} />)}</div> : <Empty title="Nenhum resultado encontrado" text="Tente trocar os filtros ou pesquisar por outro termo." />}</div>
  </main>
}

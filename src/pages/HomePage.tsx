import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Download, Link2, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ItemCard } from '../components/ItemCard'
import { db } from '../lib/supabase'
import type { Category, Item, Settings } from '../lib/types'

export function HomePage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: async () => {
      const [recent, popular, categories, settings] = await Promise.all([
        db.from('lilkank_items').select('*, lilkank_categories(name,slug)').eq('status', 'published').in('visibility', ['public', 'members']).order('published_at', { ascending: false }).limit(8),
        db.from('lilkank_items').select('*, lilkank_categories(name,slug)').eq('status', 'published').eq('item_type', 'file').in('visibility', ['public', 'members']).order('download_count', { ascending: false }).limit(4),
        db.from('lilkank_categories').select('*').eq('active', true).order('sort_order'),
        db.from('lilkank_settings').select('*').eq('id', 1).maybeSingle(),
      ])
      return { recent: (recent.data || []) as Item[], popular: (popular.data || []) as Item[], categories: (categories.data || []) as Category[], settings: settings.data as Settings | null }
    },
  })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const q = search.trim()
    navigate(q ? `/explorar?q=${encodeURIComponent(q)}` : '/explorar')
  }
  return <main>
    <section className="hero"><div className="hero-glow glow-a" /><div className="hero-glow glow-b" /><div className="container hero-inner">
      <span className="eyebrow-pill"><Sparkles size={14} />Biblioteca digital organizada</span>
      <h1>Arquivos e links úteis, <em>em um só lugar.</em></h1>
      <p>{data?.settings?.site_tagline || 'Meu espaço digital'}. Explore conteúdos publicados, salve favoritos e mantenha seu histórico de downloads.</p>
      <form className="hero-search" onSubmit={submit}><Search size={20} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar arquivos, links e conteúdos..." /><button className="btn btn-primary" type="submit">Pesquisar</button></form>
      <div className="trust-row"><span><ShieldCheck size={15} />Downloads protegidos</span><span><Download size={15} />Histórico na sua conta</span><span><Link2 size={15} />Links selecionados</span></div>
    </div></section>

    <section className="container section"><div className="section-head"><div><small>Categorias</small><h2>Encontre mais rápido</h2><p>Navegue pelos principais tipos de conteúdo da biblioteca.</p></div></div><div className="category-grid">{(data?.categories || []).map((category) => <Link key={category.id} to={`/explorar?categoria=${encodeURIComponent(category.slug)}`} className="category-card"><span className="category-icon"><ArrowRight size={17} /></span><strong>{category.name}</strong></Link>)}</div></section>

    <section className="container section"><div className="section-head"><div><h2>Adicionados recentemente</h2><p>Os conteúdos públicos mais novos do LilKank.</p></div><Link className="btn btn-outline hide-mobile" to="/explorar">Ver tudo <ArrowRight size={16} /></Link></div>{isLoading ? <LoadingCards count={4} /> : data?.recent.length ? <div className="item-grid">{data.recent.map((item) => <ItemCard key={item.id} item={item} />)}</div> : <Empty title="A biblioteca está sendo preparada" text="Quando conteúdos forem publicados, eles aparecerão aqui automaticamente." />}</section>

    {!!data?.popular.length && <section className="container section"><div className="section-head"><div><small>Populares</small><h2>Mais baixados</h2><p>Arquivos que mais chamaram a atenção dos usuários.</p></div></div><div className="item-grid">{data.popular.map((item) => <ItemCard key={item.id} item={item} />)}</div></section>}
  </main>
}

export function Empty({ title, text }: { title: string; text: string }) {
  return <div className="empty"><div className="empty-icon"><Download size={22} /></div><h3>{title}</h3><p>{text}</p></div>
}

function LoadingCards({ count }: { count: number }) {
  return <div className="item-grid">{Array.from({ length: count }).map((_, index) => <div className="skeleton-card" key={index}><div /><span /><span /></div>)}</div>
}

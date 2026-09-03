import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, ExternalLink, FileText, Heart, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { notify } from '../lib/notify'
import { db, supabase } from '../lib/supabase'
import type { Item, Settings } from '../lib/types'
import { formatBytes, formatDate, getPreviewUrl, safeExternalUrl } from '../lib/utils'

export function ItemPage() {
  const { slug = '' } = useParams()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const { data, isLoading } = useQuery({ queryKey: ['item', slug], queryFn: async () => {
    const [item, settings] = await Promise.all([
      db.from('lilkank_items').select('*, lilkank_categories(name,slug)').eq('slug', slug).maybeSingle(),
      db.from('lilkank_settings').select('*').eq('id', 1).maybeSingle(),
    ])
    return { item: item.data as Item | null, settings: settings.data as Settings | null }
  } })
  const item = data?.item
  const { data: favorite = false } = useQuery({ queryKey: ['favorite', user?.id, item?.id], enabled: !!user && !!item, queryFn: async () => {
    const { data } = await db.from('lilkank_favorites').select('item_id').eq('user_id', user!.id).eq('item_id', item!.id).maybeSingle()
    return !!data
  } })
  const favMutation = useMutation({ mutationFn: async () => {
    if (!user || !item) throw new Error('Faça login para favoritar.')
    if (favorite) {
      const { error } = await db.from('lilkank_favorites').delete().eq('user_id', user.id).eq('item_id', item.id)
      if (error) throw error
    } else {
      const { error } = await db.from('lilkank_favorites').insert({ user_id: user.id, item_id: item.id })
      if (error) throw error
    }
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ['favorite'] }), onError: (error: Error) => notify(error.message, 'error') })

  if (isLoading) return <div className="center-box"><LoaderCircle className="spin" size={28} /></div>
  if (!item) return <main className="container page center-copy"><h1>Conteúdo não encontrado</h1><p>Este item não existe ou não está disponível para sua conta.</p><Link className="btn btn-primary" to="/explorar">Voltar para Explorar</Link></main>
  const mustLogin = Boolean(data?.settings?.require_auth_for_downloads || item.download_requires_auth)
  const preview = getPreviewUrl(item.preview_path)

  const download = async () => {
    if (!item.storage_path) return notify('Arquivo indisponível.', 'error')
    if (mustLogin && !user) {
      window.location.assign(`/login?next=${encodeURIComponent(`/item/${item.slug}`)}`)
      return
    }
    setBusy(true)
    try {
      const { data: signed, error } = await supabase.storage.from('lilkank-files').createSignedUrl(item.storage_path, 60, { download: item.file_name || true })
      if (error || !signed?.signedUrl) throw error || new Error('Não foi possível gerar o link temporário.')
      const { error: logError } = await db.from('lilkank_downloads').insert({ item_id: item.id, user_id: user?.id || null })
      if (logError) throw logError
      qc.invalidateQueries({ queryKey: ['item', slug] })
      window.location.assign(signed.signedUrl)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Não foi possível iniciar o download.', 'error')
    } finally { setBusy(false) }
  }
  const openExternal = async () => {
    const url = safeExternalUrl(item.external_url)
    if (!url) return notify('Link inválido ou indisponível.', 'error')
    if (user) await db.from('lilkank_link_clicks').insert({ item_id: item.id, user_id: user.id })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return <main className="container page"><div className="detail-grid"><section className="detail-card"><div className="detail-cover">{preview ? <img src={preview} alt="" /> : <div className="detail-placeholder"><FileText size={42} /></div>}</div><div className="detail-body"><div className="chip-row"><span className="chip chip-primary">{item.item_type === 'file' ? 'Arquivo' : 'Link'}</span>{item.lilkank_categories?.name && <span className="chip">{item.lilkank_categories.name}</span>}{item.version && <span className="chip">v{item.version}</span>}</div><h1>{item.title}</h1><p>{item.description || 'Este conteúdo ainda não possui uma descrição detalhada.'}</p></div></section><aside className="detail-aside"><div className="panel"><h3>Acessar conteúdo</h3>{item.item_type === 'file' ? <><button className="btn btn-primary btn-large btn-block" onClick={download} disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <Download size={18} />}Baixar agora</button>{mustLogin && !user && <div className="hint"><LockKeyhole size={16} />É necessário criar uma conta ou entrar para fazer o download.</div>}{user && <div className="hint"><ShieldCheck size={16} />O link de download expira em 60 segundos.</div>}</> : <button className="btn btn-primary btn-large btn-block" onClick={openExternal}><ExternalLink size={18} />Abrir link</button>}{user && <button className="btn btn-outline btn-block" onClick={() => favMutation.mutate()} disabled={favMutation.isPending}><Heart size={17} className={favorite ? 'fill-heart' : ''} />{favorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}</button>}</div><div className="panel"><dl className="meta-list"><div><dt>Publicado</dt><dd>{formatDate(item.published_at || item.created_at)}</dd></div>{item.item_type === 'file' && <div><dt>Tamanho</dt><dd>{formatBytes(item.size_bytes)}</dd></div>}{item.file_name && <div><dt>Arquivo</dt><dd title={item.file_name}>{item.file_name}</dd></div>}<div><dt>{item.item_type === 'file' ? 'Downloads' : 'Acessos'}</dt><dd>{item.item_type === 'file' ? item.download_count || 0 : item.click_count || 0}</dd></div></dl></div></aside></div></main>
}

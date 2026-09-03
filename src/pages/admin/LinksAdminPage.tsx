import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Image, Link2, Trash2 } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../lib/notify'
import { db, supabase } from '../../lib/supabase'
import type { Category, Folder, Item, ItemStatus, Visibility } from '../../lib/types'
import { safeExternalUrl, sanitizeFileName, uniqueSlug } from '../../lib/utils'
import { AdminEmpty } from './AdminDashboard'

export function LinksAdminPage() {
  const { user } = useAuth(); const qc = useQueryClient(); const [url, setUrl] = useState(''); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [category, setCategory] = useState(''); const [folder, setFolder] = useState(''); const [visibility, setVisibility] = useState<Visibility>('private'); const [status, setStatus] = useState<ItemStatus>('draft'); const [preview, setPreview] = useState<File | null>(null)
  const { data } = useQuery({ queryKey: ['link-admin', user?.id], queryFn: async () => {
    const [categories, folders, items] = await Promise.all([
      db.from('lilkank_categories').select('*').eq('active', true).order('sort_order'),
      db.from('lilkank_folders').select('*').eq('owner_id', user!.id).order('name'),
      db.from('lilkank_items').select('*, lilkank_categories(name,slug)').eq('owner_id', user!.id).eq('item_type', 'link').order('created_at', { ascending: false }),
    ])
    return { categories: (categories.data || []) as Category[], folders: (folders.data || []) as Folder[], items: (items.data || []) as Item[] }
  } })
  const create = useMutation({ mutationFn: async () => {
    const clean = safeExternalUrl(url); if (!clean) throw new Error('Informe um link http/https válido.'); if (!title.trim()) throw new Error('Digite um título.')
    let previewPath: string | null = null
    if (preview) {
      previewPath = `${user!.id}/${Date.now()}-${sanitizeFileName(preview.name)}`
      const uploaded = await supabase.storage.from('lilkank-previews').upload(previewPath, preview, { upsert: false, contentType: preview.type || undefined })
      if (uploaded.error) throw uploaded.error
    }
    const { error } = await db.from('lilkank_items').insert({ owner_id: user!.id, folder_id: folder || null, category_id: category || null, item_type: 'link', title: title.trim(), slug: uniqueSlug(title), description: description.trim() || null, visibility, status, download_requires_auth: false, external_url: clean, preview_path: previewPath, published_at: status === 'published' ? new Date().toISOString() : null })
    if (error) { if (previewPath) await supabase.storage.from('lilkank-previews').remove([previewPath]); throw error }
  }, onSuccess: () => { setUrl(''); setTitle(''); setDescription(''); setCategory(''); setFolder(''); setVisibility('private'); setStatus('draft'); setPreview(null); qc.invalidateQueries({ queryKey: ['link-admin'] }); qc.invalidateQueries({ queryKey: ['public-links'] }); notify('Link salvo.') }, onError: (e: Error) => notify(e.message, 'error') })
  const remove = async (item: Item) => { if (!window.confirm(`Excluir “${item.title}”?`)) return; if (item.preview_path) await supabase.storage.from('lilkank-previews').remove([item.preview_path]); const { error } = await db.from('lilkank_items').delete().eq('id', item.id); if (error) return notify(error.message, 'error'); qc.invalidateQueries({ queryKey: ['link-admin'] }); notify('Link excluído.') }
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate() }
  return <>
    <div className="admin-page-head"><div><small>Curadoria</small><h1>Links</h1><p>Guarde links privados ou publique recursos para visitantes e usuários cadastrados.</p></div></div>
    <section className="panel"><div className="panel-title"><h3>Novo link</h3></div><form className="form-grid" onSubmit={submit}><label className="full">URL<input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required /></label><label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label><label>Categoria<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Sem categoria</option>{(data?.categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="full">Descrição<textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label><label>Pasta<select value={folder} onChange={(e) => setFolder(e.target.value)}><option value="">Sem pasta</option>{(data?.folders || []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label><label>Visibilidade<select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}><option value="private">Privado</option><option value="public">Público</option><option value="members">Somente cadastrados</option><option value="unlisted">Não listado</option></select></label><label>Status<select value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label><label><span>Capa opcional</span><div className="dropzone"><Image size={20} /><input type="file" accept="image/*" onChange={(e) => setPreview(e.target.files?.[0] || null)} /></div></label><div className="full"><button className="btn btn-primary" disabled={create.isPending}><Link2 size={17} />Salvar link</button></div></form></section>
    <section className="panel" style={{ marginTop: 16 }}><div className="panel-title"><h3>Links cadastrados</h3><span className="chip">{data?.items.length || 0}</span></div>{data?.items.length ? <div className="list-stack">{data.items.map((item) => <div className="manage-row" key={item.id}><span className="row-icon"><Link2 size={17} /></span><div className="row-main"><strong>{item.title}</strong><small>{item.external_url} · {item.status} · {item.visibility}</small></div><div className="row-actions"><a className="btn btn-outline btn-small" href={safeExternalUrl(item.external_url) || '#'} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />Abrir</a><button className="btn btn-outline btn-small" onClick={() => remove(item)}><Trash2 size={14} />Excluir</button></div></div>)}</div> : <AdminEmpty text="Nenhum link cadastrado ainda." />}</section>
  </>
}

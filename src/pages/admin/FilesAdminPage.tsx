import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Image, LoaderCircle, Trash2, UploadCloud } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../lib/notify'
import { db, supabase } from '../../lib/supabase'
import type { Category, Folder, Item, ItemStatus, Visibility } from '../../lib/types'
import { formatBytes, formatDate, sanitizeFileName, uniqueSlug } from '../../lib/utils'
import { AdminEmpty } from './AdminDashboard'

export function FilesAdminPage() {
  const { user } = useAuth(); const qc = useQueryClient()
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState<File | null>(null); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [version, setVersion] = useState(''); const [category, setCategory] = useState(''); const [folder, setFolder] = useState(''); const [visibility, setVisibility] = useState<Visibility>('private'); const [status, setStatus] = useState<ItemStatus>('draft'); const [requiresAuth, setRequiresAuth] = useState(true)
  const { data } = useQuery({ queryKey: ['file-admin', user?.id], queryFn: async () => {
    const [categories, folders, items] = await Promise.all([
      db.from('lilkank_categories').select('*').eq('active', true).order('sort_order'),
      db.from('lilkank_folders').select('*').eq('owner_id', user!.id).order('name'),
      db.from('lilkank_items').select('*, lilkank_categories(name,slug)').eq('owner_id', user!.id).eq('item_type', 'file').order('created_at', { ascending: false }),
    ])
    return { categories: (categories.data || []) as Category[], folders: (folders.data || []) as Folder[], items: (items.data || []) as Item[] }
  } })

  const uploadMutation = useMutation({ mutationFn: async () => {
    if (!file) throw new Error('Selecione um arquivo.')
    if (!title.trim()) throw new Error('Digite um título.')
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const storagePath = `${user!.id}/${nonce}-${sanitizeFileName(file.name)}`
    let previewPath: string | null = null
    const uploaded = await supabase.storage.from('lilkank-files').upload(storagePath, file, { upsert: false, contentType: file.type || undefined })
    if (uploaded.error) throw uploaded.error
    try {
      if (preview) {
        previewPath = `${user!.id}/${nonce}-${sanitizeFileName(preview.name)}`
        const imageUpload = await supabase.storage.from('lilkank-previews').upload(previewPath, preview, { upsert: false, contentType: preview.type || undefined })
        if (imageUpload.error) throw imageUpload.error
      }
      const now = new Date().toISOString()
      const { error } = await db.from('lilkank_items').insert({ owner_id: user!.id, folder_id: folder || null, category_id: category || null, item_type: 'file', title: title.trim(), slug: uniqueSlug(title), description: description.trim() || null, visibility, status, download_requires_auth: requiresAuth, storage_path: storagePath, preview_path: previewPath, file_name: file.name, mime_type: file.type || null, size_bytes: file.size, version: version.trim() || null, published_at: status === 'published' ? now : null })
      if (error) throw error
    } catch (error) {
      await supabase.storage.from('lilkank-files').remove([storagePath])
      if (previewPath) await supabase.storage.from('lilkank-previews').remove([previewPath])
      throw error
    }
  }, onSuccess: () => { setFile(null); setPreview(null); setTitle(''); setDescription(''); setVersion(''); setCategory(''); setFolder(''); setVisibility('private'); setStatus('draft'); setRequiresAuth(true); qc.invalidateQueries({ queryKey: ['file-admin'] }); qc.invalidateQueries({ queryKey: ['home'] }); notify('Arquivo enviado com sucesso.') }, onError: (e: Error) => notify(e.message, 'error') })

  const removeItem = async (item: Item) => {
    if (!window.confirm(`Excluir “${item.title}”?`)) return
    if (item.storage_path) await supabase.storage.from('lilkank-files').remove([item.storage_path])
    if (item.preview_path) await supabase.storage.from('lilkank-previews').remove([item.preview_path])
    const { error } = await db.from('lilkank_items').delete().eq('id', item.id)
    if (error) return notify(error.message, 'error')
    qc.invalidateQueries({ queryKey: ['file-admin'] }); notify('Arquivo excluído.')
  }
  const submit = (event: FormEvent) => { event.preventDefault(); uploadMutation.mutate() }
  return <>
    <div className="admin-page-head"><div><small>Gerenciamento</small><h1>Arquivos</h1><p>Envie arquivos privados e escolha quando eles devem aparecer na biblioteca pública.</p></div></div>
    <section className="panel"><div className="panel-title"><h3>Novo arquivo</h3>{uploadMutation.isPending && <span className="chip chip-primary"><LoaderCircle className="spin" size={12} />Enviando</span>}</div><form className="form-grid" onSubmit={submit}>
      <label className="full"><span>Arquivo</span><div className="dropzone"><UploadCloud size={25} /><p>Selecione o arquivo que será armazenado no bucket privado.</p><input type="file" required onChange={(e) => { const next = e.target.files?.[0] || null; setFile(next); if (next && !title) setTitle(next.name.replace(/\.[^.]+$/, '')) }} />{file && <p className="file-picked">{file.name} · {formatBytes(file.size)}</p>}</div></label>
      <label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label><label>Versão<input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="ex.: 2.1" /></label>
      <label className="full">Descrição<textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <label>Categoria<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Sem categoria</option>{(data?.categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Pasta<select value={folder} onChange={(e) => setFolder(e.target.value)}><option value="">Sem pasta</option>{(data?.folders || []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
      <label>Visibilidade<select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}><option value="private">Privado</option><option value="public">Público</option><option value="members">Somente cadastrados</option><option value="unlisted">Não listado</option></select></label><label>Status<select value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
      <label className="full"><span>Capa / preview opcional</span><div className="dropzone"><Image size={22} /><input type="file" accept="image/*" onChange={(e) => setPreview(e.target.files?.[0] || null)} />{preview && <p className="file-picked">{preview.name}</p>}</div></label>
      <label className="switch-line full"><input type="checkbox" checked={requiresAuth} onChange={(e) => setRequiresAuth(e.target.checked)} /><span>Exigir cadastro/login para download deste arquivo</span></label>
      <div className="full"><button className="btn btn-primary" disabled={uploadMutation.isPending}>{uploadMutation.isPending ? <LoaderCircle className="spin" size={17} /> : <UploadCloud size={17} />}Enviar arquivo</button></div>
    </form></section>
    <section className="panel" style={{ marginTop: 16 }}><div className="panel-title"><h3>Arquivos cadastrados</h3><span className="chip">{data?.items.length || 0}</span></div>{data?.items.length ? <div className="list-stack">{data.items.map((item) => <div className="manage-row" key={item.id}><span className="row-icon"><FileText size={17} /></span><div className="row-main"><strong>{item.title}</strong><small>{formatBytes(item.size_bytes)} · {item.status} · {item.visibility} · {formatDate(item.created_at)}</small></div><div className="row-actions"><button className="btn btn-outline btn-small" onClick={() => removeItem(item)}><Trash2 size={14} />Excluir</button></div></div>)}</div> : <AdminEmpty text="Nenhum arquivo cadastrado ainda." />}</section>
  </>
}

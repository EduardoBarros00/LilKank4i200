import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Folder, FolderPlus, Link2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../lib/notify'
import { db } from '../../lib/supabase'
import type { Folder as FolderType, Item } from '../../lib/types'
import { formatDate } from '../../lib/utils'
import { AdminEmpty } from './AdminDashboard'

export function VaultPage() {
  const { user } = useAuth(); const qc = useQueryClient(); const [folderName, setFolderName] = useState(''); const [folder, setFolder] = useState('todos'); const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({ queryKey: ['vault', user?.id], queryFn: async () => {
    const [folders, items] = await Promise.all([
      db.from('lilkank_folders').select('*').eq('owner_id', user!.id).order('name'),
      db.from('lilkank_items').select('*, lilkank_folders(name)').eq('owner_id', user!.id).order('updated_at', { ascending: false }),
    ])
    return { folders: (folders.data || []) as FolderType[], items: (items.data || []) as Item[] }
  } })
  const createFolder = useMutation({ mutationFn: async () => {
    const name = folderName.trim(); if (!name) throw new Error('Digite o nome da pasta.')
    const { error } = await db.from('lilkank_folders').insert({ owner_id: user!.id, name }); if (error) throw error
  }, onSuccess: () => { setFolderName(''); qc.invalidateQueries({ queryKey: ['vault'] }); notify('Pasta criada.') }, onError: (e: Error) => notify(e.message, 'error') })
  const filtered = useMemo(() => (data?.items || []).filter((item) => folder === 'todos' || (folder === 'sem-pasta' ? !item.folder_id : item.folder_id === folder)).filter((item) => !search.trim() || `${item.title} ${item.description || ''}`.toLowerCase().includes(search.toLowerCase())), [data, folder, search])
  return <>
    <div className="admin-page-head"><div><small>Privado</small><h1>Meu Cofre</h1><p>Organize seus arquivos e links em pastas. Itens privados nunca aparecem no site público.</p></div></div>
    <section className="panel"><div className="panel-title"><h3>Pastas</h3><div className="toolbar"><input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Nova pasta" /><button className="btn btn-primary btn-small" onClick={() => createFolder.mutate()}><FolderPlus size={15} />Criar</button></div></div><div className="folder-grid"><button className="folder-card" onClick={() => setFolder('todos')}><Folder size={20} /><strong>Todos</strong><small>{data?.items.length || 0} itens</small></button><button className="folder-card" onClick={() => setFolder('sem-pasta')}><Folder size={20} /><strong>Sem pasta</strong><small>Raiz do cofre</small></button>{(data?.folders || []).map((f) => <button className="folder-card" key={f.id} onClick={() => setFolder(f.id)}><Folder size={20} /><strong>{f.name}</strong><small>Ver conteúdo</small></button>)}</div></section>
    <section className="panel" style={{ marginTop: 16 }}><div className="panel-title"><h3>Conteúdo</h3><label className="search-field" style={{ width: 260 }}><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar no cofre" /></label></div>{isLoading ? <AdminEmpty text="Carregando…" /> : filtered.length ? <div className="list-stack">{filtered.map((item) => <div className="manage-row" key={item.id}><span className="row-icon">{item.item_type === 'file' ? <FileText size={17} /> : <Link2 size={17} />}</span><div className="row-main"><strong>{item.title}</strong><small>{item.lilkank_folders?.name || 'Sem pasta'} · {item.visibility} · {item.status} · atualizado {formatDate(item.updated_at)}</small></div></div>)}</div> : <AdminEmpty text="Nenhum item encontrado neste local." />}</section>
  </>
}

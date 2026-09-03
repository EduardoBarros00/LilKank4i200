import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image as ImageIcon, Plus, RotateCcw, Settings, Trash2, Upload } from 'lucide-react'
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { DEFAULT_BACKGROUND } from '../../assets/defaultBackground'
import { notify } from '../../lib/notify'
import { db, supabase } from '../../lib/supabase'
import type { Category, Settings as SettingsType, Visibility } from '../../lib/types'
import { slugify } from '../../lib/utils'
import { AdminEmpty } from './AdminDashboard'

export function SettingsAdminPage() {
  const qc = useQueryClient()
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const [siteName, setSiteName] = useState('LilKank')
  const [tagline, setTagline] = useState('Meu espaço digital')
  const [allowRegistration, setAllowRegistration] = useState(true)
  const [requireAuth, setRequireAuth] = useState(true)
  const [defaultVisibility, setDefaultVisibility] = useState<Visibility>('private')
  const [backgroundUrl, setBackgroundUrl] = useState('')
  const [backgroundOverlay, setBackgroundOverlay] = useState(46)
  const [backgroundPosition, setBackgroundPosition] = useState('center')
  const [uploadingBackground, setUploadingBackground] = useState(false)
  const [categoryName, setCategoryName] = useState('')

  const { data } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const [settings, categories] = await Promise.all([
        db.from('lilkank_settings').select('*').eq('id', 1).maybeSingle(),
        db.from('lilkank_categories').select('*').order('sort_order'),
      ])
      return {
        settings: settings.data as SettingsType | null,
        categories: (categories.data || []) as Category[],
      }
    },
  })

  useEffect(() => {
    if (!data?.settings) return
    setSiteName(data.settings.site_name)
    setTagline(data.settings.site_tagline)
    setAllowRegistration(data.settings.allow_registration)
    setRequireAuth(data.settings.require_auth_for_downloads)
    setDefaultVisibility(data.settings.default_visibility)
    setBackgroundUrl(data.settings.background_image_url || '')
    setBackgroundOverlay(data.settings.background_overlay ?? 46)
    setBackgroundPosition(data.settings.background_position || 'center')
  }, [data?.settings])

  const refreshAppearance = () => {
    qc.invalidateQueries({ queryKey: ['admin-settings'] })
    qc.invalidateQueries({ queryKey: ['site-settings'] })
    qc.invalidateQueries({ queryKey: ['home'] })
  }

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await db.from('lilkank_settings').update({
        site_name: siteName.trim() || 'LilKank',
        site_tagline: tagline.trim() || 'Meu espaço digital',
        allow_registration: allowRegistration,
        require_auth_for_downloads: requireAuth,
        default_visibility: defaultVisibility,
        background_image_url: backgroundUrl.trim() || null,
        background_overlay: backgroundOverlay,
        background_position: backgroundPosition,
      }).eq('id', 1)
      if (error) throw error
    },
    onSuccess: () => {
      refreshAppearance()
      notify('Configurações salvas.')
    },
    onError: (e: Error) => notify(e.message, 'error'),
  })

  const uploadBackground = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return notify('Escolha um arquivo de imagem.', 'error')
    if (file.size > 12 * 1024 * 1024) return notify('A imagem deve ter no máximo 12 MB.', 'error')

    setUploadingBackground(true)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const path = `site/background-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('lilkank-previews').upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      })
      if (error) throw error

      const { data: publicData } = supabase.storage.from('lilkank-previews').getPublicUrl(path)
      const publicUrl = publicData.publicUrl
      const { error: updateError } = await db.from('lilkank_settings').update({ background_image_url: publicUrl }).eq('id', 1)
      if (updateError) throw updateError

      setBackgroundUrl(publicUrl)
      refreshAppearance()
      notify('Nova imagem de fundo aplicada.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Não foi possível trocar a imagem.', 'error')
    } finally {
      setUploadingBackground(false)
    }
  }

  const restoreDefaultBackground = async () => {
    if (!window.confirm('Voltar para a imagem LilKank padrão?')) return
    const { error } = await db.from('lilkank_settings').update({ background_image_url: null }).eq('id', 1)
    if (error) return notify(error.message, 'error')
    setBackgroundUrl('')
    refreshAppearance()
    notify('Imagem padrão restaurada.')
  }

  const createCategory = async (event: FormEvent) => {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) return
    const slug = slugify(name)
    if (!slug) return
    const max = Math.max(0, ...(data?.categories || []).map((c) => c.sort_order))
    const { error } = await db.from('lilkank_categories').insert({ name, slug, sort_order: max + 10, active: true })
    if (error) return notify(error.message, 'error')
    setCategoryName('')
    qc.invalidateQueries({ queryKey: ['admin-settings'] })
    notify('Categoria criada.')
  }

  const toggleCategory = async (category: Category) => {
    const { error } = await db.from('lilkank_categories').update({ active: !category.active }).eq('id', category.id)
    if (error) return notify(error.message, 'error')
    qc.invalidateQueries({ queryKey: ['admin-settings'] })
  }

  const removeCategory = async (category: Category) => {
    if (!window.confirm(`Excluir a categoria “${category.name}”? Os itens ficarão sem categoria.`)) return
    const { error } = await db.from('lilkank_categories').delete().eq('id', category.id)
    if (error) return notify(error.message, 'error')
    qc.invalidateQueries({ queryKey: ['admin-settings'] })
    notify('Categoria removida.')
  }

  const previewImage = backgroundUrl.trim() || DEFAULT_BACKGROUND

  return <>
    <div className="admin-page-head">
      <div><small>Sistema</small><h1>Configurações</h1><p>Preferências globais, aparência, cadastro e regras padrão de download.</p></div>
      <span className="big-icon"><Settings size={21} /></span>
    </div>

    <div className="admin-grid">
      <section className="panel">
        <div className="panel-title"><h3>Configurações gerais</h3></div>
        <div className="form-grid">
          <label>Nome do site<input value={siteName} onChange={(e) => setSiteName(e.target.value)} /></label>
          <label>Frase principal<input value={tagline} onChange={(e) => setTagline(e.target.value)} /></label>
          <label>Visibilidade padrão<select value={defaultVisibility} onChange={(e) => setDefaultVisibility(e.target.value as Visibility)}><option value="private">Privado</option><option value="public">Público</option><option value="members">Cadastrados</option><option value="unlisted">Não listado</option></select></label>
          <div />
          <label className="switch-line full"><input type="checkbox" checked={allowRegistration} onChange={(e) => setAllowRegistration(e.target.checked)} /><span>Permitir novos cadastros</span></label>
          <label className="switch-line full"><input type="checkbox" checked={requireAuth} onChange={(e) => setRequireAuth(e.target.checked)} /><span>Exigir login globalmente para downloads</span></label>
          <div className="full"><button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>Salvar configurações</button></div>
        </div>
      </section>

      <section className="panel appearance-panel">
        <div className="panel-title"><div><h3>Aparência do site</h3><p>Troque o fundo quando quiser. A arte LilKank enviada fica como padrão.</p></div><ImageIcon size={19} /></div>
        <div className="background-preview" style={{ backgroundImage: `linear-gradient(rgba(9,16,15,${backgroundOverlay / 100}),rgba(9,16,15,${backgroundOverlay / 100})), url("${previewImage}")`, backgroundPosition }}>
          <span>LilKank</span>
          <small>Prévia do fundo</small>
        </div>
        <input ref={backgroundInputRef} className="hidden-file-input" type="file" accept="image/*" onChange={uploadBackground} />
        <div className="background-actions">
          <button className="btn btn-primary" type="button" disabled={uploadingBackground} onClick={() => backgroundInputRef.current?.click()}><Upload size={15} />{uploadingBackground ? 'Enviando...' : 'Trocar imagem'}</button>
          <button className="btn btn-outline" type="button" onClick={restoreDefaultBackground}><RotateCcw size={15} />Usar padrão</button>
        </div>
        <label className="appearance-field">Ou use uma URL de imagem<input value={backgroundUrl} onChange={(e) => setBackgroundUrl(e.target.value)} placeholder="https://..." /></label>
        <label className="appearance-field">Escurecimento do fundo <strong>{backgroundOverlay}%</strong><input type="range" min="0" max="85" value={backgroundOverlay} onChange={(e) => setBackgroundOverlay(Number(e.target.value))} /></label>
        <label className="appearance-field">Posição da imagem<select value={backgroundPosition} onChange={(e) => setBackgroundPosition(e.target.value)}><option value="center">Centro</option><option value="top">Topo</option><option value="bottom">Base</option><option value="left center">Esquerda</option><option value="right center">Direita</option></select></label>
        <button className="btn btn-primary" type="button" onClick={() => save.mutate()} disabled={save.isPending}>Salvar aparência</button>
      </section>

      <section className="panel">
        <div className="panel-title"><h3>Categorias</h3></div>
        <form className="toolbar" onSubmit={createCategory}><input style={{ flex: 1 }} value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Nova categoria" /><button className="btn btn-primary btn-small"><Plus size={14} />Adicionar</button></form>
        <div className="list-stack" style={{ marginTop: 14 }}>
          {data?.categories.length ? data.categories.map((category) => <div className="manage-row" key={category.id}><div className="row-main"><strong>{category.name}</strong><small>{category.slug} · {category.active ? 'ativa' : 'oculta'}</small></div><div className="row-actions"><button className="btn btn-outline btn-small" onClick={() => toggleCategory(category)}>{category.active ? 'Ocultar' : 'Ativar'}</button><button className="btn btn-outline btn-small" onClick={() => removeCategory(category)}><Trash2 size={13} /></button></div></div>) : <AdminEmpty text="Nenhuma categoria cadastrada." />}
        </div>
      </section>
    </div>
  </>
}

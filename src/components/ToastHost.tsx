import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { NoticeType } from '../lib/notify'

type Notice = { id: number; message: string; type: NoticeType }

export function ToastHost() {
  const [items, setItems] = useState<Notice[]>([])
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; type: NoticeType }>).detail
      const id = Date.now() + Math.random()
      setItems((old) => [...old, { id, ...detail }])
      window.setTimeout(() => setItems((old) => old.filter((item) => item.id !== id)), 4200)
    }
    window.addEventListener('lilkank-notice', handler)
    return () => window.removeEventListener('lilkank-notice', handler)
  }, [])
  if (!items.length) return null
  return <div className="toast-host">{items.map((item) => {
    const Icon = item.type === 'success' ? CheckCircle2 : item.type === 'error' ? CircleAlert : Info
    return <div className={`toast toast-${item.type}`} key={item.id}><Icon size={18} /><span>{item.message}</span><button onClick={() => setItems((old) => old.filter((row) => row.id !== item.id))}><X size={14} /></button></div>
  })}</div>
}

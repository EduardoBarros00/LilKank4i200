import Hls from 'hls.js'
import { Radio, Tv } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Channel = {
  name: string
  url: string
}

const channels: Channel[] = [
  { name: 'TV Câmara', url: 'https://streaming.camera.leg.br/ws/cmr/stream1.m3u8' },
  { name: 'TV Senado', url: 'https://streaming.senado.leg.br/live/tv-senado.m3u8' },
]

export function LiveTV() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const activeChannel = channels[activeIndex]

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let hls: Hls | null = null
    let disposed = false

    const resetVideo = () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }

    setError('')
    resetVideo()

    if (Hls.isSupported()) {
      hls = new Hls()
      hls.loadSource(activeChannel.url)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal || disposed) return

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setError('O sinal deste canal está temporariamente indisponível. Tentando reconectar…')
          hls?.startLoad()
          return
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          setError('O player encontrou um problema de mídia. Tentando recuperar o sinal…')
          hls?.recoverMediaError()
          return
        }

        setError('Não foi possível reproduzir este canal agora.')
        hls?.destroy()
        hls = null
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = activeChannel.url
    } else {
      setError('Este navegador não oferece suporte à reprodução HLS.')
    }

    return () => {
      disposed = true
      hls?.destroy()
      resetVideo()
    }
  }, [activeChannel.url])

  return (
    <section className="entertainment-panel" aria-label="TV ao vivo">
      <aside className="media-sidebar">
        <div className="media-sidebar-title">
          <Tv size={18} />
          <div>
            <strong>TV ao vivo</strong>
            <small>Canais públicos</small>
          </div>
        </div>

        <div className="media-list" role="list">
          {channels.map((channel, index) => (
            <button
              key={channel.url}
              type="button"
              className={`media-list-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-pressed={index === activeIndex}
            >
              <Radio size={15} />
              <span>{channel.name}</span>
              {index === activeIndex && <b className="live-dot" aria-label="Canal ativo" />}
            </button>
          ))}
        </div>
      </aside>

      <div className="media-stage">
        <div className="media-stage-head">
          <div>
            <small>AO VIVO</small>
            <h2>{activeChannel.name}</h2>
          </div>
          <span className="live-badge"><b /> AO VIVO</span>
        </div>

        <div className="responsive-player video-player">
          <video ref={videoRef} controls playsInline preload="metadata" aria-label={`Transmissão ao vivo da ${activeChannel.name}`} />
        </div>

        {error && <div className="stream-message" role="status">{error}</div>}
      </div>
    </section>
  )
}

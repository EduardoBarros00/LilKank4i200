import { Clapperboard, Film, Tv } from 'lucide-react'
import { useState } from 'react'
import { LiveTV } from '../components/LiveTV'
import { MovieEmbed } from '../components/MovieEmbed'
import '../entertainment.css'

type EntertainmentTab = 'movies' | 'live'

export function EntertainmentPage() {
  const [tab, setTab] = useState<EntertainmentTab>('movies')

  return (
    <main className="page entertainment-page">
      <div className="container">
        <div className="page-head entertainment-head">
          <div>
            <small>ENTRETENIMENTO</small>
            <h1>Filmes e TV ao vivo</h1>
            <p>Assista a filmes gratuitos do Internet Archive e canais públicos diretamente no LilKank.</p>
          </div>
          <div className="big-icon"><Clapperboard size={24} /></div>
        </div>

        <div className="entertainment-tabs" role="tablist" aria-label="Tipos de entretenimento">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'movies'}
            className={tab === 'movies' ? 'active' : ''}
            onClick={() => setTab('movies')}
          >
            <Film size={17} />
            Filmes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'live'}
            className={tab === 'live' ? 'active' : ''}
            onClick={() => setTab('live')}
          >
            <Tv size={17} />
            TV ao vivo
          </button>
        </div>

        <div role="tabpanel">
          {tab === 'movies' ? <MovieEmbed /> : <LiveTV />}
        </div>
      </div>
    </main>
  )
}

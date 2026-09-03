import { Film } from 'lucide-react'
import { useState } from 'react'

type Movie = {
  title: string
  embedUrl: string
}

const movies: Movie[] = [
  { title: 'A Noite dos Mortos-Vivos', embedUrl: 'https://archive.org/embed/night_of_the_living_dead' },
  { title: 'O Gabinete do Dr. Caligari', embedUrl: 'https://archive.org/embed/DasKabinettdesDoktorCaligari' },
  { title: 'Viagem à Lua', embedUrl: 'https://archive.org/embed/Levoyagedanslalune' },
]

export function MovieEmbed() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeMovie = movies[activeIndex]

  return (
    <section className="entertainment-panel" aria-label="Filmes gratuitos">
      <aside className="media-sidebar">
        <div className="media-sidebar-title">
          <Film size={18} />
          <div>
            <strong>Filmes gratuitos</strong>
            <small>Internet Archive</small>
          </div>
        </div>

        <div className="media-list" role="list">
          {movies.map((movie, index) => (
            <button
              key={movie.embedUrl}
              type="button"
              className={`media-list-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-pressed={index === activeIndex}
            >
              <span className="media-list-number">{String(index + 1).padStart(2, '0')}</span>
              <span>{movie.title}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="media-stage">
        <div className="media-stage-head">
          <div>
            <small>AGORA REPRODUZINDO</small>
            <h2>{activeMovie.title}</h2>
          </div>
          <span className="media-source-badge">Archive.org</span>
        </div>

        <div className="responsive-player iframe-player">
          <iframe
            key={activeMovie.embedUrl}
            src={activeMovie.embedUrl}
            title={`Reproduzir ${activeMovie.title}`}
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}

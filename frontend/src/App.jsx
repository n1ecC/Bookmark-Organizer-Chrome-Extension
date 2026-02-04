import Organizer from './components/Organizer'
import { X } from 'lucide-react'

function App() {
  return (
    <div className="app-container">
      <header style={{ marginBottom: '3rem', position: 'relative' }}>
        <button
          onClick={() => window.close()}
          style={{
            position: 'absolute',
            top: '-1rem',
            right: '-1rem',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          title="Close Extension"
        >
          <X size={24} />
        </button>

        <h1 style={{ fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          AI Bookmark Organizer
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginTop: '0.5rem' }}>
          Transform your chaos into a curated library
        </p>
      </header>

      <main>
        <Organizer />
      </main>
    </div>
  )
}

export default App

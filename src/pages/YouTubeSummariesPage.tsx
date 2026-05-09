import React, { useState, useEffect } from 'react'

interface VideoItem {
  video_id: string
  title: string
  index: number
  duration: number
  thumbnail: string
  short_summary: string
  updated_at: string
}

interface VideoDetail {
  video_id: string
  title: string
  duration: number
  transcript: string
  short_summary: string
  detailed_summary: string
  key_points: string
  thumbnail: string
}

interface Stats {
  total_videos: number
  with_summary: number
  playlist_id: string
}

const API_BASE = '/api/youtube'

export default function YouTubeSummariesPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    loadVideos()
  }, [])

  async function loadVideos() {
    setLoading(true)
    try {
      const r = await fetch(`${API_BASE}/list`)
      const data = await r.json()
      setVideos(data.videos || [])
      setStats(data.stats || null)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function refresh() {
    setRefreshing(true)
    try {
      await fetch(`${API_BASE}/refresh`, { method: 'POST' })
      // Wait a moment for processing to start
      setTimeout(loadVideos, 2000)
    } catch { /* ignore */ }
    setRefreshing(false)
  }

  async function showDetail(videoId: string) {
    setDetailLoading(true)
    try {
      const r = await fetch(`${API_BASE}/detail/${videoId}`)
      const data = await r.json()
      setSelectedVideo(data)
    } catch { /* ignore */ }
    setDetailLoading(false)
  }

  async function doSearch() {
    const q = searchQuery.trim()
    if (!q) {
      setSearchResults(null)
      return
    }
    setSearching(true)
    try {
      const r = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`)
      const data = await r.json()
      setSearchResults(data.results || [])
    } catch {
      setSearchResults([])
    }
    setSearching(false)
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') doSearch()
  }

  function clearSearch() {
    setSearchQuery('')
    setSearchResults(null)
  }

  function formatDuration(seconds: number): string {
    if (!seconds) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m >= 60) {
      const h = Math.floor(m / 60)
      return `${h}h ${m % 60}m`
    }
    return `${m}m ${s}s`
  }

  function getYouTubeUrl(videoId: string): string {
    return `https://youtube.com/watch?v=${videoId}`
  }

  return (
    <div className="youtube-summaries-page">
      <div className="section-top">
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>🎬 YouTube Összefoglalók</span>
            {stats && <span className="stats-badge">{stats.total_videos} videó</span>}
          </h1>
          <p className="section-sub">AI playlist · automatikus összefoglalók minden videóhoz</p>
        </div>
        <div className="header-actions">
          <div className="sync-badge" onClick={refresh} style={{ cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? 0.6 : 1 }}>
            {refreshing ? '⏳ Frissítés...' : '🔄 Frissítés'}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="yt-search-bar">
        <div className="yt-search-input-wrap">
          <span className="yt-search-icon">🔍</span>
          <input
            type="text"
            className="yt-search-input"
            placeholder="Keresés a videók között... (pl. n8n, AI SEO, trading)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchQuery && (
            <button className="yt-search-clear" onClick={clearSearch}>✕</button>
          )}
        </div>
        <button className="yt-search-btn" onClick={doSearch} disabled={searching || !searchQuery.trim()}>
          {searching ? '⏳' : '🔍 Keresés'}
        </button>
      </div>

      {/* Search Results */}
      {searchResults !== null ? (
        <div className="yt-search-results">
          <div className="yt-search-header">
            <h3>🔍 Keresési találatok: "{searchQuery}"</h3>
            <span className="yt-search-count">{searchResults.length} videó</span>
            <button className="yt-search-back" onClick={clearSearch}>✕ Bezárás</button>
          </div>
          {searchResults.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>Nincs találat</h3>
              <p>Próbálj más keresőszavakat.</p>
            </div>
          ) : (
            <div className="video-grid">
              {searchResults.map((video) => (
                <div key={video.video_id} className="video-card">
                  <div className="video-thumbnail">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" fill="%23333"><rect width="320" height="180"/><text x="160" y="95" text-anchor="middle" fill="%23666" font-size="40">🎬</text></svg>' }}
                    />
                    <span className="video-duration-badge">{formatDuration(video.duration)}</span>
                    <span className="video-relevance-badge">{(video.relevance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="video-info">
                    <h3 className="video-title" title={video.title}>
                      <a href={getYouTubeUrl(video.video_id)} target="_blank" rel="noopener noreferrer">
                        {video.title}
                      </a>
                    </h3>
                    {video.short_summary && (
                      <div className="video-summary" onClick={() => showDetail(video.video_id)}>
                        {video.short_summary.slice(0, 200)}{video.short_summary.length > 200 ? '...' : ''}
                      </div>
                    )}
                    <div className="video-click-hint">
                      📖 Kattints az összefoglalóra a részletes elemzésért
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Videók betöltése...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <h3>Még nincsenek videók</h3>
          <p>Az AI playlist üres vagy még feldolgozás alatt. Kattints a Frissítés gombra.</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <div key={video.video_id} className="video-card">
              <div className="video-thumbnail">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" fill="%23333"><rect width="320" height="180"/><text x="160" y="95" text-anchor="middle" fill="%23666" font-size="40">🎬</text></svg>' }}
                />
                <span className="video-duration-badge">{formatDuration(video.duration)}</span>
              </div>
              <div className="video-info">
                <h3 className="video-title" title={video.title}>
                  <a href={getYouTubeUrl(video.video_id)} target="_blank" rel="noopener noreferrer">
                    {video.title}
                  </a>
                </h3>
                <div
                  className={`video-summary ${video.short_summary?.startsWith('❌') ? 'error' : ''}`}
                  onClick={() => showDetail(video.video_id)}
                >
                  {video.short_summary?.startsWith('❌')
                    ? video.short_summary
                    : video.short_summary
                      ? video.short_summary.slice(0, 200) + (video.short_summary.length > 200 ? '...' : '')
                      : '⏳ Összefoglaló generálás alatt...'}
                </div>
                <div className="video-click-hint">
                  📖 Kattints az összefoglalóra a részletes elemzésért
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="modal video-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedVideo.title}</h2>
              <button className="modal-close" onClick={() => setSelectedVideo(null)}>✕</button>
            </div>
            <div className="modal-body video-modal-body">
              <div className="video-modal-meta">
                <span>⏱️ {formatDuration(selectedVideo.duration)}</span>
                <a href={getYouTubeUrl(selectedVideo.video_id)} target="_blank" rel="noopener noreferrer" className="video-modal-link">
                  ▶️ Megnyitás YouTube-on
                </a>
              </div>

              {selectedVideo.detailed_summary ? (
                <div className="video-detailed-summary">
                  {selectedVideo.detailed_summary.split('\n').map((line, i) => {
                    if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
                      return <h4 key={i} className="summary-section-title">{line}</h4>
                    }
                    if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
                      return <li key={i} className="summary-bullet">{line.replace(/^[-•*]\s*/, '')}</li>
                    }
                    if (line.trim() === '') return <br key={i} />
                    return <p key={i} className="summary-text">{line}</p>
                  })}
                </div>
              ) : selectedVideo.short_summary ? (
                <div className="video-short-summary-only">
                  <p>{selectedVideo.short_summary}</p>
                </div>
              ) : (
                <p className="video-no-summary">⏳ Összefoglaló generálás alatt...</p>
              )}

              {selectedVideo.transcript && (
                <div className="video-transcript-section">
                  <details>
                    <summary>📝 Teljes átirat megjelenítése</summary>
                    <pre className="video-transcript-text">{selectedVideo.transcript.slice(0, 5000)}{selectedVideo.transcript.length > 5000 ? '\n... (tovább rövidítve)' : ''}</pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .youtube-summaries-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .section-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .stats-badge {
          background: #8b5cf622;
          color: #a78bfa;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }
        .header-actions {
          display: flex;
          gap: 8px;
        }
        .loading-container {
          text-align: center;
          padding: 60px 20px;
          color: #9ca3af;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #333;
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }
        .empty-icon { font-size: 48px; margin-bottom: 12px; }
        .empty-state h3 { color: #d1d5db; margin: 0 0 8px; }
        .empty-state p { margin: 0; font-size: 14px; }
        .video-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .video-card {
          background: #1a1a2e;
          border: 1px solid #2a2a4a;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          gap: 16px;
          transition: border-color 0.2s;
        }
        .video-card:hover {
          border-color: #8b5cf644;
        }
        .video-thumbnail {
          position: relative;
          flex-shrink: 0;
          width: 240px;
          height: 135px;
        }
        .video-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .video-duration-badge {
          position: absolute;
          bottom: 6px;
          right: 6px;
          background: rgba(0,0,0,0.8);
          color: #fff;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .video-info {
          flex: 1;
          padding: 12px 12px 12px 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .video-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #e5e7eb;
          line-height: 1.3;
        }
        .video-title a {
          color: #e5e7eb;
          text-decoration: none;
        }
        .video-title a:hover {
          color: #8b5cf6;
        }
        .video-summary {
          font-size: 13px;
          color: #9ca3af;
          line-height: 1.5;
          cursor: pointer;
          padding: 6px 10px;
          background: #16213e;
          border-radius: 8px;
          border: 1px solid #2a2a4a;
          transition: all 0.2s;
        }
        .video-summary:hover {
          background: #1a2744;
          border-color: #8b5cf644;
        }
        .video-summary.error {
          color: #f87171;
        }
        .video-click-hint {
          font-size: 11px;
          color: #6b7280;
        }
        .video-modal {
          max-width: 700px;
          width: 90%;
        }
        .video-modal-body {
          max-height: 70vh;
          overflow-y: auto;
        }
        .video-modal-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          color: #9ca3af;
          font-size: 13px;
        }
        .video-modal-link {
          color: #8b5cf6;
          text-decoration: none;
          font-weight: 600;
        }
        .video-modal-link:hover {
          text-decoration: underline;
        }
        .video-detailed-summary {
          line-height: 1.7;
          color: #d1d5db;
        }
        .summary-section-title {
          color: #a78bfa;
          margin: 16px 0 8px;
          font-size: 14px;
          font-weight: 600;
        }
        .summary-bullet {
          color: #9ca3af;
          margin: 4px 0 4px 16px;
          font-size: 13px;
        }
        .summary-text {
          color: #d1d5db;
          font-size: 13px;
          margin: 4px 0;
        }
        .video-short-summary-only {
          color: #d1d5db;
          font-size: 14px;
          line-height: 1.6;
        }
        .video-no-summary {
          color: #f59e0b;
          font-size: 14px;
        }
        .video-transcript-section {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #2a2a4a;
        }
        .video-transcript-section details summary {
          color: #8b5cf6;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }
        .video-transcript-text {
          margin-top: 12px;
          background: #0d0d1a;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.5;
          max-height: 300px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        /* Search Bar */
        .yt-search-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        .yt-search-input-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          background: #1a1a2e;
          border: 1px solid #2a2a4a;
          border-radius: 10px;
          padding: 0 12px;
          transition: border-color 0.2s;
        }
        .yt-search-input-wrap:focus-within {
          border-color: #8b5cf6;
        }
        .yt-search-icon {
          font-size: 16px;
          margin-right: 8px;
          opacity: 0.5;
        }
        .yt-search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #e5e7eb;
          font-size: 14px;
          padding: 10px 0;
          font-family: inherit;
        }
        .yt-search-input::placeholder {
          color: #6b7280;
        }
        .yt-search-clear {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
        }
        .yt-search-clear:hover {
          color: #e5e7eb;
        }
        .yt-search-btn {
          background: #8b5cf6;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .yt-search-btn:hover:not(:disabled) {
          background: #7c3aed;
        }
        .yt-search-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .yt-search-results {
          margin-bottom: 20px;
        }
        .yt-search-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding: 12px 16px;
          background: #1a1a2e;
          border-radius: 10px;
          border: 1px solid #2a2a4a;
        }
        .yt-search-header h3 {
          margin: 0;
          font-size: 14px;
          color: #e5e7eb;
          flex: 1;
        }
        .yt-search-count {
          font-size: 12px;
          color: #9ca3af;
          background: #2a2a4a;
          padding: 2px 10px;
          border-radius: 12px;
        }
        .yt-search-back {
          background: none;
          border: 1px solid #2a2a4a;
          color: #9ca3af;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        .yt-search-back:hover {
          border-color: #6b7280;
          color: #e5e7eb;
        }
        .video-relevance-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background: #8b5cf6cc;
          color: #fff;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .video-card {
            flex-direction: column;
          }
          .video-thumbnail {
            width: 100%;
            height: auto;
            aspect-ratio: 16/9;
          }
          .video-info {
            padding: 0 12px 12px;
          }
        }
      `}</style>
    </div>
  )
}

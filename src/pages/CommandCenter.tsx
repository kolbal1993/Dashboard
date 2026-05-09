import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'

// ── Types ──
interface Project {
  id: string; name: string; description: string; category: string
  date: string; rank: number; revenue: string; mvp_time: string
  stack: string; market_demand: string; competition: string
  first_step: string; description_detailed: string; what_needed_from_user: string
  build_cost: string; monthly_ops_cost: string; _score?: number
}

interface YTVideo {
  id: string; title: string; summary?: string; date?: string
  url?: string; keywords?: string; _score?: number
}

interface Pm2Process {
  name: string; status: string; cpu: string; mem: string; uptime: string
}

const CAT_COLORS: Record<string, string> = {
  'AI Products': '#8b5cf6', 'AI Agents': '#3b82f6', 'Quick Wins': '#10b981',
  'SaaS': '#06b6d4', 'Content': '#14b8a6', 'Local Market': '#ec4899',
  'Web3': '#f97316', 'No-Code': '#f59e0b', 'General': '#6b7280',
}
const CAT_ICONS: Record<string, string> = {
  'AI Products': '🤖', 'AI Agents': '🧠', 'Quick Wins': '⚡',
  'SaaS': '☁️', 'Content': '📝', 'Local Market': '📍',
  'Web3': '🔗', 'No-Code': '🪄', 'General': '💡',
}

// ── Helpers ──
async function fetchJSON(url: string, signal?: AbortSignal) {
  try { const r = await fetch(url, { signal }); return await r.json() }
  catch { return null }
}

function mapYT(v: any): YTVideo {
  return {
    id: v.video_id || v.id || '',
    title: v.title || '',
    summary: v.short_summary || v.summary || '',
    date: v.date || v.published_at || '',
    url: v.url || (v.video_id ? `https://youtube.com/watch?v=${v.video_id}` : ''),
    _score: v.relevance || v._score,
  }
}

// ── Main Component ──
export default function CommandCenter() {
  // State
  const [ideas, setIdeas] = useState<Project[]>([])
  const [videos, setVideos] = useState<YTVideo[]>([])
  const [pm2, setPm2] = useState<Pm2Process[]>([])
  const [healthLog, setHealthLog] = useState<string[]>([])
  const [cost, setCost] = useState('$0.00')
  const [loading, setLoading] = useState(true)

  // Search
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<{ ideas: Project[]; videos: YTVideo[]; knowledge: any[] } | null>(null)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Modal
  const [selectedIdea, setSelectedIdea] = useState<Project | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<YTVideo | null>(null)

  // PM2 data from the system endpoint
  const [systemInfo, setSystemInfo] = useState<{ cpu?: string; mem?: string; uptime?: string }>({})

  // ── Load initial data ──
  useEffect(() => {
    const load = async () => {
      const [ideasData, videosData] = await Promise.all([
        fetchJSON('/ideas-api/api/daily-ideas/projects'),
        fetchJSON('/api/youtube/list'),
      ])
      if (ideasData) setIdeas(ideasData.filter((p: Project) => p.rank > 0).slice(0, 10))
      if (videosData) {
        if (Array.isArray(videosData)) setVideos(videosData.map(mapYT));
        else if (videosData.videos) setVideos(videosData.videos.map(mapYT));
      }

      // PM2 status via n8n or static
      try {
        const h = await fetchJSON('/api/hermes/system')
        if (h?.pm2_services) setPm2(h.pm2_services)
        if (h?.cpu) setSystemInfo({ cpu: String(h.cpu.load_1m), mem: `${Math.round(h.memory?.used_bytes / 1024 / 1024)}MB`, uptime: h.uptime })
      } catch {}

      try {
        const c = await fetchJSON('/costs/today')
        if (c?.cost) setCost(`$${c.cost.toFixed(2)}`)
      } catch {}

      setLoading(false)
    }
    load()
  }, [])

  // ── Unified Search ──
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults(null); return }
    setSearching(true)
    const [ideaResults, videoResults, knowledgeResults] = await Promise.all([
      fetchJSON(`/ideas-api/api/daily-ideas/search?q=${encodeURIComponent(q)}`),
      fetchJSON(`/api/youtube/search?q=${encodeURIComponent(q)}`),
      fetchJSON(`/api/knowledge/search?q=${encodeURIComponent(q)}`),
    ])
    setSearchResults({
      ideas: Array.isArray(ideaResults) ? ideaResults.slice(0, 5) : [],
      videos: Array.isArray(videoResults) ? videoResults.slice(0, 5).map(mapYT)
        : videoResults?.results ? videoResults.results.slice(0, 5).map(mapYT)
        : [],
      knowledge: knowledgeResults?.results?.slice(0, 5) || [],
    })
    setSearching(false)
  }, [])

  const handleSearch = useCallback((val: string) => {
    setSearchQ(val)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => doSearch(val), 300)
  }, [doSearch])

  // ── Top 3 ideas ──
  const topIdeas = useMemo(() => ideas.filter(p => p.rank >= 1 && p.rank <= 3 && p.date === (ideas[0]?.date || '')), [ideas])

  // ── Latest videos ──
  const latestVideos = useMemo(() => videos.slice(0, 5), [videos])

  // ── Render ──
  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>
        <div className="ideas-spinner" style={{ margin: '0 auto 12px' }} />
        Command Center betöltése...
      </div>
    )
  }

  return (
    <div className="cc">
      {/* ═══ HEADER ═══ */}
      <div className="cc-header">
        <div>
          <h1 className="cc-title">🏆 Clawdius Command Center</h1>
          <p className="cc-sub">Mindennap AI ügynökség · Unified Operations Dashboard</p>
        </div>
        <div className="cc-status-badge">
          <span className="cc-dot online" />
          <span>System Online</span>
          <span className="cc-time">{new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* ═══ SEARCH ═══ */}
      <div className="cc-search">
        <span className="cc-search-icon">{searching ? '⏳' : '🔍'}</span>
        <input
          className="cc-search-input"
          placeholder="Keresés ötletekben és videókban..."
          value={searchQ}
          onChange={e => handleSearch(e.target.value)}
        />
        {searchQ && (
          <button className="cc-search-clear" onClick={() => { setSearchQ(''); setSearchResults(null) }}>✕</button>
        )}
      </div>

      {/* ═══ SEARCH RESULTS ═══ */}
      {searchResults && (
        <div className="cc-search-results">
          <div className="cc-search-title">
            <span>Találatok: <strong>{searchResults.ideas.length + searchResults.videos.length + searchResults.knowledge.length}</strong></span>
            <button className="cc-search-close" onClick={() => { setSearchQ(''); setSearchResults(null) }}>Összecsuk ✕</button>
          </div>
          <div className="cc-search-grid">
            {searchResults.ideas.length > 0 && (
              <div className="cc-search-column">
                <div className="cc-search-col-title">💡 Ötletek</div>
                {searchResults.ideas.map(p => (
                  <div key={p.id} className="cc-search-item" onClick={() => setSelectedIdea(p)}>
                    <span className="cc-search-score">{p._score ? `${(1 - (p._score || 0)).toFixed(1)}` : ''}</span>
                    <span className="cc-search-name">{p.name}</span>
                    <span className="cc-search-tag" style={{ color: CAT_COLORS[p.category] || '#6b7280' }}>
                      {CAT_ICONS[p.category] || '💡'} {p.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {searchResults.videos.length > 0 && (
              <div className="cc-search-column">
                <div className="cc-search-col-title">🎬 Videók</div>
                {searchResults.videos.map(v => (
                  <div key={v.id} className="cc-search-item" onClick={() => setSelectedVideo(v)}>
                    <span className="cc-search-name">{v.title?.slice(0, 60)}</span>
                    {v.date && <span className="cc-search-date">{v.date}</span>}
                  </div>
                ))}
              </div>
            )}
            {searchResults.knowledge.length > 0 && (
              <div className="cc-search-column">
                <div className="cc-search-col-title" style={{ color: '#8b5cf6' }}>🧠 Tudásbázis</div>
                {searchResults.knowledge.map((k, i) => (
                  <div key={i} className="cc-search-item" onClick={() => window.open('/?tab=knowledge', '_self')}>
                    <span className="cc-search-name">{k.title?.slice(0, 60)}</span>
                    {k.date && <span className="cc-search-date">{k.date}</span>}
                    {k.collection && <span className="cc-search-tag" style={{ color: '#8b5cf6' }}>{k.collection}</span>}
                  </div>
                ))}
              </div>
            )}
            {searchResults.ideas.length === 0 && searchResults.videos.length === 0 && searchResults.knowledge.length === 0 && (
              <div className="cc-search-empty">Nincs találat</div>
            )}
          </div>
        </div>
      )}

      {/* ═══ 3-COLUMN GRID ═══ */}
      <div className="cc-grid">
        {/* ── Panel 1: Idea Engine ── */}
        <div className="cc-panel">
          <div className="cc-panel-header">
            <span>🧠 Idea Engine</span>
            <span className="cc-panel-badge">{ideas.length} projekt</span>
          </div>
          <div className="cc-panel-body">
            {topIdeas.length > 0 ? (
              <div className="cc-top-ideas">
                {topIdeas.map(p => (
                  <div key={p.id} className="cc-idea-card" onClick={() => setSelectedIdea(p)}>
                    <div className="cc-idea-rank">
                      {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}
                    </div>
                    <div className="cc-idea-info">
                      <div className="cc-idea-name">{p.name}</div>
                      <div className="cc-idea-meta">
                        {p.revenue && <span className="cc-tag rev">💰 {p.revenue.replace(/\s*\(.*?\)/, '').slice(0, 22)}</span>}
                        {p.mvp_time && <span className="cc-tag mvp">⚡ {p.mvp_time}</span>}
                        {p.category && (
                          <span className="cc-tag cat" style={{ color: CAT_COLORS[p.category], background: (CAT_COLORS[p.category] || '#666') + '18' }}>
                            {CAT_ICONS[p.category] || ''}
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <div className="cc-idea-desc">{p.description.slice(0, 80)}</div>
                      )}
                      {p.stack && (
                        <div className="cc-idea-stack">
                          {p.stack.split(',').slice(0, 2).map((s, i) => (
                            <span key={i} className="cc-chip">{s.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cc-empty">Nincs mai ötlet</div>
            )}
            <div className="cc-footer-link" onClick={() => {
              const btn = document.querySelector('button');
              const btns = document.querySelectorAll('.nav-tab');
              for (const b of btns) {
                if (b.textContent?.includes('IDEAS')) { (b as HTMLButtonElement).click(); break; }
              }
            }}>
              Összes ötlet megtekintése →
            </div>
          </div>
        </div>

        {/* ── Panel 2: Content Pipeline ── */}
        <div className="cc-panel">
          <div className="cc-panel-header">
            <span>🎬 Content Pipeline</span>
            <span className="cc-panel-badge">{videos.length} videó</span>
          </div>
          <div className="cc-panel-body">
            <div className="cc-yt-search-inline">
              <input
                className="cc-yt-input"
                placeholder="Keresés a videókban..."
                value={searchQ && !searchResults ? '' : ''}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
            {latestVideos.length > 0 ? (
              <div className="cc-video-list">
                {latestVideos.map(v => (
                  <div key={v.id} className="cc-video-item" onClick={() => setSelectedVideo(v)}>
                    <span className="cc-video-icon">🎬</span>
                    <div className="cc-video-info">
                      <span className="cc-video-title">{v.title?.slice(0, 55) || 'N/A'}</span>
                      {v.date && <span className="cc-video-date">{v.date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cc-empty">Nincs betöltött videó</div>
            )}
            <div className="cc-footer-link" onClick={() => {
              const btns = document.querySelectorAll('.nav-tab');
              for (const b of btns) {
                if (b.textContent?.includes('YT')) { (b as HTMLButtonElement).click(); break; }
              }
            }}>
              Összes videó megtekintése →
            </div>
          </div>
        </div>

        {/* ── Panel 3: Systems ── */}
        <div className="cc-panel">
          <div className="cc-panel-header">
            <span>📊 Systems</span>
            <span className="cc-panel-badge">
              {pm2.filter(p => p.status === 'online').length}/{pm2.length} online
            </span>
          </div>
          <div className="cc-panel-body">
            {/* Mini stats */}
            <div className="cc-sys-stats">
              <div className="cc-sys-stat">
                <span className="cc-sys-val">{pm2.filter(p => p.status === 'online').length}</span>
                <span className="cc-sys-lbl">Online</span>
              </div>
              <div className="cc-sys-stat">
                <span className="cc-sys-val">{cost}</span>
                <span className="cc-sys-lbl">Költség ma</span>
              </div>
              <div className="cc-sys-stat">
                <span className="cc-sys-val">{ideas.length}</span>
                <span className="cc-sys-lbl">Ötlet</span>
              </div>
              <div className="cc-sys-stat">
                <span className="cc-sys-val">{videos.length}</span>
                <span className="cc-sys-lbl">Videó</span>
              </div>
            </div>

            {/* PM2 services */}
            {pm2.length > 0 && (
              <div className="cc-pm2-list">
                <div className="cc-pm2-title">📡 Szolgáltatások</div>
                {pm2.slice(0, 5).map(p => (
                  <div key={p.name} className="cc-pm2-row">
                    <span className={`cc-pm2-dot ${p.status}`} />
                    <span className="cc-pm2-name">{p.name}</span>
                    <span className="cc-pm2-meta">{p.cpu} · {p.mem}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick activity */}
            <div className="cc-footer-link" onClick={() => {
              const btns = document.querySelectorAll('.nav-tab');
              for (const b of btns) {
                if (b.textContent?.includes('TASKS') || b.textContent?.includes('MONITOR')) { (b as HTMLButtonElement).click(); break; }
              }
            }}>
              Teljes monitor nézet →
            </div>
          </div>
        </div>
      </div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <div className="cc-actions">
        <div className="cc-actions-title">⚡ Gyorsműveletek</div>
        <div className="cc-actions-row">
          {topIdeas[0] && (
            <button className="cc-action-btn primary" onClick={() => setSelectedIdea(topIdeas[0])}>
              💰 Építsd #{topIdeas[0].rank}: {topIdeas[0].name.slice(0, 30)}
            </button>
          )}
          <button className="cc-action-btn" onClick={() => {
            const btns = document.querySelectorAll('.nav-tab');
            for (const b of btns) {
              if (b.textContent?.includes('IDEAS')) { (b as HTMLButtonElement).click(); break; }
            }
          }}>
            🔍 Új kutatás
          </button>
          <button className="cc-action-btn" onClick={() => {
            const btns = document.querySelectorAll('.nav-tab');
            for (const b of btns) {
              if (b.textContent?.includes('YT')) { (b as HTMLButtonElement).click(); break; }
            }
          }}>
            🎬 Új YT videó hozzáadása
          </button>
          <button className="cc-action-btn" onClick={() => {
            window.open('/mission-control', '_blank')
          }}>
            🏢 Mission Control
          </button>
        </div>
      </div>

      {/* ═══ IDEA MODAL ═══ */}
      {selectedIdea && (
        <div className="cc-modal-overlay" onClick={() => setSelectedIdea(null)}>
          <div className="cc-modal" onClick={e => e.stopPropagation()}>
            <button className="cc-modal-close" onClick={() => setSelectedIdea(null)}>✕</button>
            <div className="cc-modal-header">
              <span className="cc-modal-badge" style={{ color: CAT_COLORS[selectedIdea.category], background: (CAT_COLORS[selectedIdea.category] || '#666') + '18' }}>
                {CAT_ICONS[selectedIdea.category]} {selectedIdea.category}
              </span>
              <span className="cc-modal-date">📅 {selectedIdea.date}</span>
              {selectedIdea.rank > 0 && <span className="cc-modal-rank">#{selectedIdea.rank}</span>}
            </div>
            <h2 className="cc-modal-title">{selectedIdea.name}</h2>
            <div className="cc-modal-body">
              {selectedIdea.description_detailed && (
                <div className="cc-modal-section"><div className="cc-modal-label">📝 Leírás</div><div>{selectedIdea.description_detailed}</div></div>
              )}
              {selectedIdea.revenue && (
                <div className="cc-modal-section accent-green"><div className="cc-modal-label">💰 Bevételi potenciál</div><div>{selectedIdea.revenue}</div></div>
              )}
              {selectedIdea.mvp_time && (
                <div className="cc-modal-section accent-amber"><div className="cc-modal-label">⏱ MVP idő</div><div>{selectedIdea.mvp_time}</div></div>
              )}
              <div className={`cc-modal-section ${selectedIdea.what_needed_from_user ? 'accent-purple' : 'empty'}`}>
                <div className="cc-modal-label">🔧 Mit kérek Tőled</div>
                <div>{selectedIdea.what_needed_from_user || <span className="cc-placeholder">Még nincs megadva — a napi cron tölti</span>}</div>
              </div>
              <div className={`cc-modal-section ${selectedIdea.build_cost ? 'accent-red' : 'empty'}`}>
                <div className="cc-modal-label">💰 Build költség</div>
                <div>{selectedIdea.build_cost || <span className="cc-placeholder">Még nincs</span>}</div>
              </div>
              <div className={`cc-modal-section ${selectedIdea.monthly_ops_cost ? 'accent-red' : 'empty'}`}>
                <div className="cc-modal-label">📊 Havi ops költség</div>
                <div>{selectedIdea.monthly_ops_cost || <span className="cc-placeholder">Még nincs</span>}</div>
              </div>
              {selectedIdea.market_demand && (
                <div className="cc-modal-section accent-indigo"><div className="cc-modal-label">📈 Piaci kereslet</div><div>{selectedIdea.market_demand}</div></div>
              )}
              {selectedIdea.competition && (
                <div className="cc-modal-section accent-pink"><div className="cc-modal-label">🏆 Verseny</div><div>{selectedIdea.competition}</div></div>
              )}
              {selectedIdea.first_step && (
                <div className="cc-modal-section accent-amber"><div className="cc-modal-label">🎯 Első lépés</div><div>{selectedIdea.first_step}</div></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ VIDEO MODAL ═══ */}
      {selectedVideo && (
        <div className="cc-modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="cc-modal" onClick={e => e.stopPropagation()}>
            <button className="cc-modal-close" onClick={() => setSelectedVideo(null)}>✕</button>
            <div className="cc-modal-header">
              <span className="cc-modal-badge">🎬 YouTube</span>
              <span className="cc-modal-date">📅 {selectedVideo.date || 'N/A'}</span>
            </div>
            <h2 className="cc-modal-title">{selectedVideo.title}</h2>
            <div className="cc-modal-body">
              {selectedVideo.summary && (
                <div className="cc-modal-section"><div className="cc-modal-label">📝 Összefoglaló</div><div>{selectedVideo.summary}</div></div>
              )}
              {selectedVideo.keywords && (
                <div className="cc-modal-section"><div className="cc-modal-label">🏷️ Kulcsszavak</div><div>{selectedVideo.keywords}</div></div>
              )}
              {selectedVideo.url && (
                <div style={{ marginTop: 12 }}>
                  <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: 14 }}>▶ Megnyitás YouTube-on</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════ STYLES ═══════════════════════════ */}
      <style>{`
        .cc {
          padding: 20px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ── Spinner ── */
        .ideas-spinner {
          width: 24px; height: 24px;
          border: 2px solid var(--border);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: cc-spin .6s linear infinite;
        }
        @keyframes cc-spin { to { transform: rotate(360deg) } }

        /* ── Header ── */
        .cc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          gap: 16px;
        }
        .cc-title {
          font-size: 22px; font-weight: 700; margin: 0;
          color: var(--text); letter-spacing: -0.3px;
        }
        .cc-sub { font-size: 12px; color: var(--text3); margin: 4px 0 0; }
        .cc-status-badge {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg2); border: 1px solid var(--border);
          padding: 6px 14px; border-radius: 20px;
          font-size: 12px; color: var(--text2);
        }
        .cc-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.4);
        }
        .cc-time { color: var(--text3); font-family: var(--font-mono, monospace); font-size: 11px; }

        /* ── Search ── */
        .cc-search {
          display: flex; align-items: center;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 12px; padding: 0 16px;
          margin-bottom: 16px;
          transition: border-color .2s, box-shadow .2s;
        }
        .cc-search:focus-within {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }
        .cc-search-icon { font-size: 16px; color: var(--text3); margin-right: 10px; }
        .cc-search-input {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text); font-size: 14px; padding: 12px 0;
          font-family: inherit;
        }
        .cc-search-input::placeholder { color: var(--text4); }
        .cc-search-clear {
          background: none; border: none; color: var(--text3);
          cursor: pointer; font-size: 16px; padding: 4px 6px;
          border-radius: 4px; transition: all .15s;
        }
        .cc-search-clear:hover { background: var(--bg3); color: var(--text); }

        /* ── Search Results ── */
        .cc-search-results {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px 18px;
          margin-bottom: 16px;
        }
        .cc-search-title {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 13px; color: var(--text2); margin-bottom: 12px;
        }
        .cc-search-close {
          background: none; border: 1px solid var(--border); border-radius: 6px;
          color: var(--text3); cursor: pointer; font-size: 11px;
          padding: 3px 10px; font-family: inherit;
        }
        .cc-search-close:hover { border-color: #8b5cf6; color: #8b5cf6; }
        .cc-search-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .cc-search-col-title {
          font-size: 12px; font-weight: 600; color: var(--text3);
          text-transform: uppercase; letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .cc-search-item {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 8px; border-radius: 6px;
          cursor: pointer; transition: background .15s;
          font-size: 13px;
        }
        .cc-search-item:hover { background: var(--bg3); }
        .cc-search-score { font-size: 10px; color: var(--text4); width: 28px; }
        .cc-search-name { flex: 1; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cc-search-tag { font-size: 10px; font-weight: 600; white-space: nowrap; }
        .cc-search-date { font-size: 11px; color: var(--text4); white-space: nowrap; }
        .cc-search-empty {
          grid-column: 1 / -1; text-align: center;
          padding: 20px; color: var(--text3); font-size: 13px;
        }
        @media (max-width: 768px) { .cc-search-grid { grid-template-columns: 1fr; } }

        /* ── 3-Column Grid ── */
        .cc-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 900px) { .cc-grid { grid-template-columns: 1fr; } }

        /* ── Panel ── */
        .cc-panel {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 12px; overflow: hidden;
          display: flex; flex-direction: column;
        }
        .cc-panel-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 16px; border-bottom: 1px solid var(--border);
          font-size: 14px; font-weight: 600; color: var(--text);
        }
        .cc-panel-badge {
          font-size: 11px; color: var(--text3); font-weight: 400;
          background: var(--bg3); padding: 2px 10px; border-radius: 10px;
        }
        .cc-panel-body { padding: 14px 16px; flex: 1; }

        /* ── Idea Cards ── */
        .cc-top-ideas { display: flex; flex-direction: column; gap: 8px; }
        .cc-idea-card {
          display: flex; gap: 10px; padding: 10px 12px;
          background: var(--bg3); border-radius: 10px;
          cursor: pointer; transition: all .15s;
        }
        .cc-idea-card:hover { background: var(--bg4); }
        .cc-idea-rank { font-size: 20px; line-height: 1; }
        .cc-idea-info { flex: 1; min-width: 0; }
        .cc-idea-name {
          font-size: 13px; font-weight: 600; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .cc-idea-meta {
          display: flex; flex-wrap: wrap; gap: 4px;
          margin: 4px 0;
        }
        .cc-tag {
          font-size: 10px; font-weight: 500;
          padding: 1px 6px; border-radius: 3px;
          white-space: nowrap;
        }
        .cc-tag.rev { background: #10b98115; color: #34d399; }
        .cc-tag.mvp { background: #f59e0b15; color: #fbbf24; }
        .cc-tag.cat { font-size: 9px; padding: 1px 5px; }
        .cc-idea-desc {
          font-size: 11px; color: var(--text2); margin: 2px 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .cc-idea-stack {
          display: flex; flex-wrap: wrap; gap: 3px; margin-top: 2px;
        }
        .cc-chip {
          font-size: 9px; background: var(--bg4); color: var(--text3);
          padding: 1px 6px; border-radius: 3px;
        }
        .cc-empty {
          padding: 24px 0; text-align: center; color: var(--text3); font-size: 13px;
        }
        .cc-footer-link {
          font-size: 11px; color: #8b5cf6; cursor: pointer;
          margin-top: 10px; padding: 6px 0; text-align: center;
          border-top: 1px solid var(--border);
          transition: color .15s;
        }
        .cc-footer-link:hover { color: #a78bfa; }

        /* ── YT List ── */
        .cc-yt-search-inline { margin-bottom: 8px; }
        .cc-yt-input {
          width: 100%; background: var(--bg3); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 12px; color: var(--text);
          font-size: 12px; font-family: inherit; outline: none;
        }
        .cc-yt-input:focus { border-color: #8b5cf6; }
        .cc-video-list { display: flex; flex-direction: column; gap: 4px; }
        .cc-video-item {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 8px; border-radius: 6px;
          cursor: pointer; transition: background .15s;
        }
        .cc-video-item:hover { background: var(--bg3); }
        .cc-video-icon { font-size: 14px; }
        .cc-video-info { flex: 1; min-width: 0; }
        .cc-video-title {
          font-size: 12px; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .cc-video-date { font-size: 10px; color: var(--text4); }

        /* ── Systems Panel ── */
        .cc-sys-stats {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
          margin-bottom: 12px;
        }
        .cc-sys-stat {
          text-align: center; padding: 8px;
          background: var(--bg3); border-radius: 8px;
        }
        .cc-sys-val { display: block; font-size: 18px; font-weight: 700; color: #8b5cf6; }
        .cc-sys-lbl { font-size: 10px; color: var(--text3); }
        .cc-pm2-title { font-size: 11px; font-weight: 600; color: var(--text3); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .cc-pm2-list { margin-top: 4px; }
        .cc-pm2-row {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 0; font-size: 11px;
        }
        .cc-pm2-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #ef4444;
        }
        .cc-pm2-dot.online { background: #10b981; }
        .cc-pm2-name { flex: 1; color: var(--text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cc-pm2-meta { color: var(--text4); font-family: var(--font-mono, monospace); font-size: 10px; }

        /* ── Quick Actions ── */
        .cc-actions {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px 18px;
          margin-bottom: 16px;
        }
        .cc-actions-title {
          font-size: 13px; font-weight: 600; color: var(--text2);
          margin-bottom: 10px;
        }
        .cc-actions-row {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .cc-action-btn {
          display: flex; align-items: center; gap: 6px;
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 8px; color: var(--text); font-size: 12px;
          padding: 8px 14px; cursor: pointer; font-family: inherit;
          transition: all .15s; white-space: nowrap;
        }
        .cc-action-btn:hover { border-color: #8b5cf6; color: #8b5cf6; }
        .cc-action-btn.primary {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border-color: transparent; color: #fff;
          font-weight: 500;
        }
        .cc-action-btn.primary:hover {
          box-shadow: 0 4px 12px rgba(139,92,246,0.3);
          transform: translateY(-1px);
        }

        /* ── Modals ── */
        .cc-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          z-index: 1000; display: flex; align-items: flex-start;
          justify-content: center; padding: 40px 16px; overflow-y: auto;
        }
        .cc-modal {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 16px; width: 100%; max-width: 600px;
          padding: 28px 28px 32px; position: relative;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
          animation: cc-modal-in .25s ease-out;
        }
        @keyframes cc-modal-in {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cc-modal-close {
          position: absolute; top: 14px; right: 14px;
          background: var(--bg3); border: none; color: var(--text3);
          width: 32px; height: 32px; border-radius: 50%;
          cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s; z-index: 1;
        }
        .cc-modal-close:hover { background: var(--bg4); color: var(--text); }
        .cc-modal-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px; flex-wrap: wrap;
        }
        .cc-modal-badge {
          font-size: 11px; font-weight: 600; padding: 3px 10px;
          border-radius: 20px;
        }
        .cc-modal-date { font-size: 12px; color: var(--text3); }
        .cc-modal-rank { font-size: 12px; font-weight: 600; color: #f59e0b; background: #f59e0b18; padding: 2px 8px; border-radius: 4px; }
        .cc-modal-title {
          font-size: 19px; font-weight: 700; color: var(--text);
          margin: 0 0 16px; line-height: 1.35; padding-right: 32px;
        }
        .cc-modal-body { display: flex; flex-direction: column; gap: 8px; }
        .cc-modal-section {
          padding: 10px 12px; background: var(--bg2); border-radius: 8px;
          border-left: 3px solid var(--border); font-size: 13px;
          line-height: 1.5;
        }
        .cc-modal-section.accent-green { border-left-color: #10b981; }
        .cc-modal-section.accent-amber { border-left-color: #f59e0b; }
        .cc-modal-section.accent-purple { border-left-color: #8b5cf6; }
        .cc-modal-section.accent-red { border-left-color: #ef4444; }
        .cc-modal-section.accent-indigo { border-left-color: #6366f1; }
        .cc-modal-section.accent-pink { border-left-color: #ec4899; }
        .cc-modal-section.empty { border-left-color: var(--border); }
        .cc-modal-label {
          font-size: 10px; font-weight: 600; color: var(--text3);
          text-transform: uppercase; letter-spacing: 0.4px;
          margin-bottom: 4px;
        }
        .cc-placeholder { font-size: 12px; color: var(--text4); font-style: italic; }

        @media (max-width: 768px) {
          .cc { padding: 12px; }
          .cc-actions-row { flex-direction: column; }
          .cc-action-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  )
}

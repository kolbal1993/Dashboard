import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'

// ── Types ──
interface Project {
  id: string
  name: string
  description: string
  category: string
  date: string
  rank: number
  revenue: string
  mvp_time: string
  stack: string
  market_demand: string
  competition: string
  first_step: string
  description_detailed: string
  sources: string
  tldr: string
  details_raw: string
  what_needed_from_user: string
  build_cost: string
  monthly_ops_cost: string
  _score?: number
}

const CATEGORY_COLORS: Record<string, string> = {
  'AI Products': '#8b5cf6',
  'Quick Wins': '#10b981',
  'AI Agents': '#3b82f6',
  'No-Code': '#f59e0b',
  'SaaS': '#06b6d4',
  'Local Market': '#ec4899',
  'Web3': '#f97316',
  'Content': '#14b8a6',
  'Marketing': '#e11d48',
  'DevTools': '#6366f1',
  'Education': '#a855f7',
  'General': '#6b7280',
}

const CATEGORY_ICONS: Record<string, string> = {
  'AI Products': '🤖',
  'Quick Wins': '⚡',
  'AI Agents': '🧠',
  'No-Code': '🪄',
  'SaaS': '☁️',
  'Local Market': '📍',
  'Web3': '🔗',
  'Content': '📝',
  'Marketing': '📢',
  'DevTools': '🔧',
  'Education': '🎓',
  'General': '💡',
}

function getStackList(stack: string): string[] {
  if (!stack) return []
  return stack.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5)
}

// ── Main Component ──
export default function IdeasPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchResults, setSearchResults] = useState<Project[] | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // ── Load projects ──
  useEffect(() => {
    fetch('/ideas-api/api/daily-ideas/projects')
      .then(r => r.json())
      .then(d => { setProjects(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // ── Deferred search ──
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults(null)
      return
    }
    setSearching(true)
    try {
      const r = await fetch(`/ideas-api/api/daily-ideas/search?q=${encodeURIComponent(q)}`)
      const d = await r.json()
      setSearchResults(Array.isArray(d) ? d : [])
    } catch {
      setSearchResults(null)
    }
    setSearching(false)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => doSearch(value), 300)
  }, [doSearch])

  // ── Categories ──
  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const p of projects) cats.add(p.category || 'General')
    return ['all', ...Array.from(cats).sort()]
  }, [projects])

  // ── Display list ──
  const displayList = useMemo(() => {
    let list = searchResults ?? projects

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter(p => p.category === categoryFilter)
    }

    // If no search results and showing all, sort by date desc then rank
    if (!searchResults) {
      list = [...list].sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date)
        return (a.rank || 99) - (b.rank || 99)
      })
    } else {
      // Sort by relevance score
      list = [...list].sort((a, b) => (b._score || 0) - (a._score || 0))
    }

    return list
  }, [projects, searchResults, categoryFilter])

  // ── Stats ──
  const stats = useMemo(() => {
    const uniqDates = new Set(projects.map(p => p.date))
    return {
      total: projects.length,
      days: uniqDates.size,
      categories: categories.length - 1,
      latest: [...uniqDates].sort().pop() || '—',
    }
  }, [projects, categories])

  // ── Render ──
  if (loading) {
    return (
      <div className="ideas-container">
        <div className="ideas-loading">
          <div className="ideas-spinner" />
          <span>Projektek betöltése...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="ideas-container">
      {/* ═══ HERO ═══ */}
      <div className="ideas-hero">
        <div className="ideas-hero-left">
          <h1 className="ideas-title">💡 Projektek</h1>
          <p className="ideas-subtitle">Napi AI-ötletek · Építésre készen</p>
        </div>
        <div className="ideas-hero-stats">
          <div className="ideas-stat">
            <span className="ideas-stat-val">{stats.total}</span>
            <span className="ideas-stat-lbl">Projekt</span>
          </div>
          <div className="ideas-stat">
            <span className="ideas-stat-val">{stats.categories}</span>
            <span className="ideas-stat-lbl">Kategória</span>
          </div>
          <div className="ideas-stat">
            <span className="ideas-stat-val">{stats.days}</span>
            <span className="ideas-stat-lbl">Kutatási nap</span>
          </div>
          <div className="ideas-stat">
            <span className="ideas-stat-val">{stats.latest}</span>
            <span className="ideas-stat-lbl">Utolsó</span>
          </div>
        </div>
      </div>

      {/* ═══ SEARCH + FILTERS ═══ */}
      <div className="ideas-controls">
        <div className="ideas-search">
          <span className="ideas-search-icon">
            {searching ? '⏳' : '🔍'}
          </span>
          <input
            className="ideas-search-input"
            type="text"
            placeholder="Keresés az összes projektben (vektoros)..."
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="ideas-search-clear" onClick={() => { setSearchQuery(''); setSearchResults(null) }}>✕</button>
          )}
        </div>

        <div className="ideas-controls-right">
          <select className="ideas-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            {categories.map(c => (
              <option key={c} value={c}>
                {c === 'all' ? '🏷️ Minden' : `${CATEGORY_ICONS[c] || '💡'} ${c}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result info */}
      {searchQuery && (
        <div className="ideas-result-count">
          {displayList.length} találat a(z) <strong>"{searchQuery}"</strong> keresésre
          {searchResults !== null ? ' (vektoros keresés)' : ' (szűrés)'}
          <button className="ideas-result-clear" onClick={() => { setSearchQuery(''); setSearchResults(null) }}>
            Összes mutatása
          </button>
        </div>
      )}

      {/* ═══ GRID ═══ */}
      {displayList.length > 0 ? (
        <div className="ideas-grid">
          {displayList.map(project => {
            const catColor = CATEGORY_COLORS[project.category] || '#6b7280'
            return (
              <div
                key={project.id}
                className="idea-card"
                onClick={() => setSelectedProject(project)}
              >
                {/* Top row */}
                <div className="idea-card-top">
                  <span
                    className="idea-card-category"
                    style={{ background: catColor + '18', color: catColor }}
                  >
                    {CATEGORY_ICONS[project.category] || '💡'} {project.category}
                  </span>
                  {project.rank > 0 && project.rank <= 3 && (
                    <span className={`idea-rank-badge rank-${project.rank}`}>
                      {project.rank === 1 ? '🥇' : project.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="idea-card-title">{project.name}</h3>

                {/* Description */}
                {(project.description || project.description_detailed) && (
                  <p className="idea-card-desc">
                    {(project.description_detailed || project.description || '').slice(0, 120)}
                    {(project.description_detailed || project.description || '').length > 120 ? '…' : ''}
                  </p>
                )}

                {/* Tags */}
                <div className="idea-card-tags">
                  {project.revenue && (
                    <span className="idea-tag revenue">💰 {project.revenue.replace(/\s*\(.*?\)/, '').slice(0, 28)}</span>
                  )}
                  {project.mvp_time && (
                    <span className="idea-tag mvp">⚡ {project.mvp_time}</span>
                  )}
                  {(project.build_cost || project.monthly_ops_cost) && (
                    <span className="idea-tag cost">💸 Költségigényes</span>
                  )}
                </div>

                {/* Stack */}
                {getStackList(project.stack).length > 0 && (
                  <div className="idea-card-stack">
                    {getStackList(project.stack).map((tag, i) => (
                      <span key={i} className="idea-stack-chip">{tag}</span>
                    ))}
                  </div>
                )}

                {/* Date and hint */}
                <div className="idea-card-footer">
                  <span className="idea-card-date">📅 {project.date}</span>
                  <span className="idea-card-hint">Részletek →</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="ideas-empty">
          <div className="ideas-empty-icon">🔍</div>
          <div className="ideas-empty-text">Nincs találat</div>
          <button className="ideas-empty-btn" onClick={() => { setSearchQuery(''); setSearchResults(null); setCategoryFilter('all') }}>
            Szűrők törlése
          </button>
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      {selectedProject && (
        <div className="ideas-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="ideas-modal" onClick={e => e.stopPropagation()}>
            <button className="ideas-modal-close" onClick={() => setSelectedProject(null)}>✕</button>

            {/* Header */}
            <div className="ideas-modal-header">
              <span
                className="idea-card-category"
                style={{
                  background: (CATEGORY_COLORS[selectedProject.category] || '#6b7280') + '18',
                  color: CATEGORY_COLORS[selectedProject.category] || '#6b7280',
                }}
              >
                {CATEGORY_ICONS[selectedProject.category] || '💡'} {selectedProject.category}
              </span>
              <span className="ideas-modal-date">📅 {selectedProject.date}</span>
              {selectedProject.rank > 0 && (
                <span className={`idea-rank-badge rank-${selectedProject.rank}`}>
                  #{selectedProject.rank}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="ideas-modal-title">{selectedProject.name}</h2>

            {/* Sections */}
            <div className="ideas-modal-sections">
              {/* Description */}
              {(selectedProject.description_detailed || selectedProject.description) && (
                <div className="ideas-modal-section">
                  <div className="ideas-modal-section-label">📝 Leírás</div>
                  <div className="ideas-modal-section-body">
                    {selectedProject.description_detailed || selectedProject.description}
                  </div>
                </div>
              )}

              {/* MVP Time */}
              {selectedProject.mvp_time && (
                <div className="ideas-modal-section accent-amber">
                  <div className="ideas-modal-section-label">⏱ MVP idő</div>
                  <div className="ideas-modal-section-body">{selectedProject.mvp_time}</div>
                </div>
              )}

              {/* What I need from you */}
              <div className={`ideas-modal-section ${selectedProject.what_needed_from_user ? 'accent-purple' : 'empty'}`}>
                <div className="ideas-modal-section-label">🔧 Mit kérek Tőled</div>
                <div className="ideas-modal-section-body">
                  {selectedProject.what_needed_from_user || (
                    <span className="field-placeholder">Még nincs megadva — a napi ötlet cron job automatikusan kitölti</span>
                  )}
                </div>
              </div>

              {/* Build Cost */}
              <div className={`ideas-modal-section ${selectedProject.build_cost ? 'accent-red' : 'empty'}`}>
                <div className="ideas-modal-section-label">💰 Build költség (működőképesre)</div>
                <div className="ideas-modal-section-body">
                  {selectedProject.build_cost || (
                    <span className="field-placeholder">Még nincs megadva</span>
                  )}
                </div>
              </div>

              {/* Monthly Ops Cost */}
              <div className={`ideas-modal-section ${selectedProject.monthly_ops_cost ? 'accent-red' : 'empty'}`}>
                <div className="ideas-modal-section-label">📊 Havi üzemeltetési költség</div>
                <div className="ideas-modal-section-body">
                  {selectedProject.monthly_ops_cost || (
                    <span className="field-placeholder">Még nincs megadva</span>
                  )}
                </div>
              </div>

              {/* Revenue */}
              {selectedProject.revenue && (
                <div className="ideas-modal-section accent-green">
                  <div className="ideas-modal-section-label">💵 Bevételi potenciál</div>
                  <div className="ideas-modal-section-body">{selectedProject.revenue}</div>
                </div>
              )}

              {/* Stack */}
              {selectedProject.stack && (
                <div className="ideas-modal-section accent-blue">
                  <div className="ideas-modal-section-label">🛠️ Technológiai stack</div>
                  <div className="ideas-modal-section-body">{selectedProject.stack}</div>
                </div>
              )}

              {/* Market Demand */}
              {selectedProject.market_demand && (
                <div className="ideas-modal-section accent-indigo">
                  <div className="ideas-modal-section-label">📈 Piaci kereslet</div>
                  <div className="ideas-modal-section-body">{selectedProject.market_demand}</div>
                </div>
              )}

              {/* Competition */}
              {selectedProject.competition && (
                <div className="ideas-modal-section accent-pink">
                  <div className="ideas-modal-section-label">🏆 Versenytársak</div>
                  <div className="ideas-modal-section-body">{selectedProject.competition}</div>
                </div>
              )}

              {/* First Step */}
              {selectedProject.first_step && (
                <div className="ideas-modal-section accent-amber">
                  <div className="ideas-modal-section-label">🎯 Első lépés</div>
                  <div className="ideas-modal-section-body">{selectedProject.first_step}</div>
                </div>
              )}

              {/* Sources */}
              {selectedProject.sources && (
                <details className="ideas-modal-raw">
                  <summary>📚 Források</summary>
                  <pre>{selectedProject.sources}</pre>
                </details>
              )}

              {/* Raw details */}
              {selectedProject.details_raw && (
                <details className="ideas-modal-raw">
                  <summary>📋 Nyers adatok</summary>
                  <pre>{selectedProject.details_raw}</pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════ STYLES ═══════════════════════════ */}
      <style>{`
        .ideas-container {
          padding: 24px 28px;
          max-width: 1200px;
          margin: 0 auto;
          min-height: 60vh;
        }

        /* Loading */
        .ideas-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 0;
          color: var(--text3);
          font-size: 15px;
        }
        .ideas-spinner {
          width: 20px; height: 20px;
          border: 2px solid var(--border);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: ideas-spin .6s linear infinite;
        }
        @keyframes ideas-spin { to { transform: rotate(360deg) } }

        /* Hero */
        .ideas-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          gap: 20px;
          flex-wrap: wrap;
        }
        .ideas-title {
          font-size: 26px;
          font-weight: 700;
          margin: 0;
          color: var(--text);
          letter-spacing: -0.3px;
        }
        .ideas-subtitle {
          font-size: 13px;
          color: var(--text3);
          margin: 4px 0 0;
        }
        .ideas-hero-stats {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ideas-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 16px;
          min-width: 70px;
        }
        .ideas-stat-val {
          font-size: 18px;
          font-weight: 700;
          color: #8b5cf6;
        }
        .ideas-stat-lbl {
          font-size: 11px;
          color: var(--text3);
          margin-top: 2px;
          white-space: nowrap;
        }

        /* Controls */
        .ideas-controls {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .ideas-search {
          flex: 1;
          min-width: 200px;
          position: relative;
          display: flex;
          align-items: center;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0 14px;
          transition: border-color .2s, box-shadow .2s;
        }
        .ideas-search:focus-within {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }
        .ideas-search-icon { font-size: 15px; color: var(--text3); margin-right: 10px; }
        .ideas-search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 14px;
          padding: 11px 0;
          font-family: inherit;
        }
        .ideas-search-input::placeholder { color: var(--text4); }
        .ideas-search-clear {
          background: none;
          border: none;
          color: var(--text3);
          cursor: pointer;
          font-size: 16px;
          padding: 4px 6px;
          border-radius: 4px;
          transition: all .15s;
        }
        .ideas-search-clear:hover { background: var(--bg3); color: var(--text); }
        .ideas-controls-right { display: flex; gap: 8px; }
        .ideas-select {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 13px;
          padding: 10px 14px;
          cursor: pointer;
          font-family: inherit;
          outline: none;
          transition: border-color .2s;
        }
        .ideas-select:focus { border-color: #8b5cf6; }

        /* Result count */
        .ideas-result-count {
          font-size: 13px;
          color: var(--text3);
          margin-bottom: 16px;
          padding: 8px 14px;
          background: var(--bg2);
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .ideas-result-clear {
          background: none;
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text2);
          cursor: pointer;
          font-size: 12px;
          padding: 3px 10px;
          font-family: inherit;
          transition: all .15s;
        }
        .ideas-result-clear:hover { border-color: #8b5cf6; color: #8b5cf6; }

        /* Grid */
        .ideas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 14px;
        }

        /* Card */
        .idea-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all .2s;
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        .idea-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 3px;
          background: linear-gradient(90deg, #8b5cf6, #6366f1);
          opacity: 0;
          transition: opacity .2s;
        }
        .idea-card:hover::before { opacity: 1; }
        .idea-card:hover {
          border-color: #8b5cf644;
          box-shadow: 0 6px 24px rgba(139,92,246,0.1);
          transform: translateY(-2px);
        }
        .idea-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .idea-card-category {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
          letter-spacing: 0.2px;
        }
        .idea-rank-badge {
          font-size: 14px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
        }
        .idea-card-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .idea-card-desc {
          font-size: 12.5px;
          color: var(--text2);
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .idea-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .idea-tag {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .idea-tag.revenue { background: #10b98115; color: #34d399; }
        .idea-tag.mvp { background: #f59e0b15; color: #fbbf24; }
        .idea-tag.cost { background: #ef444415; color: #f87171; }
        .idea-card-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .idea-stack-chip {
          font-size: 10px;
          background: var(--bg3);
          color: var(--text3);
          padding: 2px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .idea-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 6px;
        }
        .idea-card-date { font-size: 11px; color: var(--text4); }
        .idea-card-hint {
          font-size: 11px;
          color: #8b5cf6;
          opacity: 0;
          transition: opacity .2s;
          font-weight: 500;
        }
        .idea-card:hover .idea-card-hint { opacity: 1; }

        /* Empty */
        .ideas-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--text3);
        }
        .ideas-empty-icon { font-size: 48px; margin-bottom: 12px; }
        .ideas-empty-text { font-size: 16px; margin-bottom: 16px; }
        .ideas-empty-btn {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          padding: 8px 20px;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          transition: all .15s;
        }
        .ideas-empty-btn:hover { border-color: #8b5cf6; color: #8b5cf6; }

        /* ── MODAL ── */
        .ideas-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 16px;
          overflow-y: auto;
        }
        .ideas-modal {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          width: 100%;
          max-width: 640px;
          padding: 28px 32px 32px;
          position: relative;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
          animation: ideas-modal-in .25s ease-out;
        }
        @keyframes ideas-modal-in {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ideas-modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
          background: var(--bg3);
          border: none;
          color: var(--text3);
          width: 32px; height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all .15s;
          z-index: 1;
        }
        .ideas-modal-close:hover { background: var(--bg4); color: var(--text); }
        .ideas-modal-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .ideas-modal-date { font-size: 12px; color: var(--text3); }
        .ideas-modal-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 20px;
          line-height: 1.35;
          padding-right: 32px;
        }
        .ideas-modal-sections {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ideas-modal-section {
          padding: 12px 14px;
          background: var(--bg2);
          border-radius: 10px;
          border-left: 3px solid var(--border);
          transition: border-color .2s;
        }
        .ideas-modal-section.accent-amber { border-left-color: #f59e0b; }
        .ideas-modal-section.accent-purple { border-left-color: #8b5cf6; }
        .ideas-modal-section.accent-red { border-left-color: #ef4444; }
        .ideas-modal-section.accent-green { border-left-color: #10b981; }
        .ideas-modal-section.accent-blue { border-left-color: #3b82f6; }
        .ideas-modal-section.accent-indigo { border-left-color: #6366f1; }
        .ideas-modal-section.accent-pink { border-left-color: #ec4899; }
        .ideas-modal-section.empty { border-left-color: var(--border); opacity: 0.8; }
        .ideas-modal-section-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text3);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 6px;
        }
        .ideas-modal-section-body {
          font-size: 14px;
          color: var(--text);
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .field-placeholder {
          font-size: 12px;
          color: var(--text4);
          font-style: italic;
        }
        .ideas-modal-raw {
          margin-top: 8px;
          font-size: 12px;
        }
        .ideas-modal-raw summary {
          cursor: pointer;
          color: var(--text2);
          padding: 6px 0;
          font-weight: 500;
        }
        .ideas-modal-raw summary:hover { color: var(--text); }
        .ideas-modal-raw pre {
          font-size: 12px;
          color: var(--text2);
          white-space: pre-wrap;
          background: var(--bg2);
          padding: 14px;
          border-radius: 8px;
          max-height: 250px;
          overflow-y: auto;
          margin-top: 6px;
          font-family: var(--font-mono, 'SF Mono', 'Fira Code', monospace);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .ideas-container { padding: 16px; }
          .ideas-hero { flex-direction: column; }
          .ideas-hero-stats { width: 100%; justify-content: space-between; }
          .ideas-stat { min-width: 60px; padding: 8px 12px; }
          .ideas-stat-val { font-size: 15px; }
          .ideas-grid { grid-template-columns: 1fr; }
          .ideas-controls { flex-direction: column; }
          .ideas-controls-right { width: 100%; }
          .ideas-select { flex: 1; }
          .ideas-modal { padding: 20px; }
        }
      `}</style>
    </div>
  )
}

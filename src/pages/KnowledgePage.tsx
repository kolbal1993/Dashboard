import React, { useState, useEffect, useRef } from 'react'

interface Decision {
  id: string; title: string; date: string; decision: string; topic: string
}

interface PredictResult {
  prediction: string; confidence: number; reasoning: string
  related_decisions: { title: string; date: string; decision: string; score: number }[]
}

interface Profile {
  total_decisions: number; dominant_style: string
  topics: Record<string, { count: number }>
  impacts: Record<string, number>
  preferences: Record<string, number>
}

interface ModeInfo {
  mode: string; available_modes: string[]; auto_detect: boolean
}

const TOPIC_COLORS: Record<string, string> = {
  fejlesztés: '#3b82f6', workflow: '#8b5cf6', irányelv: '#10b981',
  üzlet: '#f59e0b', 'social-media': '#ec4899', devops: '#06b4d6',
}

async function fetchJSON(url: string) {
  try { const r = await fetch(url); return await r.json() }
  catch { return null }
}

export default function KnowledgePage() {
  const [tab, setTab] = useState<'search' | 'decisions' | 'predictor' | 'profile' | 'stats'>('search')
  const [searchQ, setSearchQ] = useState('')
  const [results, setResults] = useState<any[] | null>(null)
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mode, setMode] = useState<ModeInfo | null>(null)
  const [predictQ, setPredictQ] = useState('')
  const [predictResult, setPredictResult] = useState<PredictResult | null>(null)
  const [predicting, setPredicting] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [alerts, setAlerts] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const searchRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Load initial data
  useEffect(() => {
    const load = async () => {
      const [dec, ana, modeData, statsData, alertsData] = await Promise.all([
        fetchJSON('/api/knowledge/decisions'),
        fetchJSON('/api/predict/analyze'),
        fetchJSON('/api/predict/mode'),
        fetchJSON('/api/predict/stats'),
        fetchJSON('/api/predict/alerts'),
      ])
      if (dec?.decisions) setDecisions(dec.decisions.slice(0, 30))
      if (ana) setProfile({
        total_decisions: (ana as any).total_decisions,
        dominant_style: (Object.entries((ana as any).preferences || {}).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'Vegyes') as string,
        topics: (ana as any).topics || {},
        impacts: (ana as any).impacts || {},
        preferences: (ana as any).preferences || {},
      })
      if (modeData) setMode(modeData as ModeInfo)
      if (statsData && !statsData.error) setStats(statsData)
      if (alertsData) setAlerts(alertsData)
      setLoading(false)
    }
    load()
  }, [])

  // Search with debounce
  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults(null); return }
    const data = await fetchJSON(`/api/knowledge/search?q=${encodeURIComponent(q)}`)
    if (data?.results) setResults(data.results)
  }

  const handleSearch = (val: string) => {
    setSearchQ(val)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => doSearch(val), 300)
  }

  const doPredict = async () => {
    if (!predictQ.trim()) return
    setPredicting(true)
    const data = await fetchJSON(`/api/predict/predict?q=${encodeURIComponent(predictQ)}`)
    if (data) setPredictResult(data as PredictResult)
    setPredicting(false)
  }

  if (loading) {
    return (
      <div className="knowledge-page">
        <div className="section-top">
          <div>
            <h1 className="section-title">🧠 Knowledge Base</h1>
            <p className="section-sub">Döntések · Elemzés · Előrejelzés</p>
          </div>
        </div>
        <div className="empty-state" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🔄</div>
          <div style={{ marginTop: 8 }}>Betöltés...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="knowledge-page">
      {/* HEADER */}
      <div className="section-top">
        <div>
          <h1 className="section-title">🧠 Knowledge Base</h1>
          <p className="section-sub">
            {profile ? `${profile.total_decisions} döntés rögzítve` : 'Döntési tudásbázis'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Mode indicator */}
          {mode && (
            <div className="mode-selector">
              <span className="mode-label">🎭</span>
              {mode.available_modes.map(m => (
                <button
                  key={m}
                  className={`mode-btn ${mode.mode === m ? 'active' : ''}`}
                  style={mode.mode === m ? {
                    background: m === 'CEO' ? '#3b82f6' : m === 'Barát' ? '#10b981' : '#f59e0b',
                    color: '#fff',
                  } : {}}
                  onClick={async () => {
                    await fetch(`/api/predict/mode?set=${m}`)
                    setMode({ ...mode, mode: m, auto_detect: false })
                  }}
                >
                  {m === 'CEO' ? '👔' : m === 'Barát' ? '☕' : '⚡'} {m}
                </button>
              ))}
            </div>
          )}
          <span className="status-dot online" style={{ width: 8, height: 8 }} />
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Knowledge API Online</span>
        </div>
      </div>

      {/* TABS */}
      <div className="k-tabs">
        {[
          { key: 'search' as const, icon: '🔍', label: 'Keresés' },
          { key: 'decisions' as const, icon: '📋', label: 'Döntések' },
          { key: 'predictor' as const, icon: '🔮', label: 'Predictor' },
          { key: 'profile' as const, icon: '🧠', label: 'Profil' },
          { key: 'stats' as const, icon: '📊', label: 'Statika' },
        ].map(t => (
          <button
            key={t.key}
            className={`k-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >{t.icon} {t.label}</button>
        ))}
      </div>

      {/* ═══ TAB 1: SEARCH ═══ */}
      {tab === 'search' && (
        <div className="k-tab-content">
          <div className="k-search-bar">
            <span className="k-search-icon">🔍</span>
            <input
              className="k-search-input"
              placeholder="Keresés döntésekben, session-ökben..."
              value={searchQ}
              onChange={e => handleSearch(e.target.value)}
              autoFocus
            />
            {searchQ && (
              <button className="k-search-clear" onClick={() => { setSearchQ(''); setResults(null) }}>✕</button>
            )}
          </div>

          {results && (
            <div className="k-results">
              {results.length === 0 ? (
                <div className="k-empty">Nincs találat</div>
              ) : (
                results.map((r, i) => (
                  <div key={i} className="k-result-card">
                    <div className="k-result-header">
                      <span className="k-result-type">{r.type === 'decision' ? '🧠' : '📓'} {r.collection}</span>
                      <span className="k-result-score">{(1 - r.score).toFixed(1)}</span>
                    </div>
                    <div className="k-result-title">{r.title}</div>
                    {r.date && <div className="k-result-date">📅 {r.date}</div>}
                  </div>
                ))
              )}
            </div>
          )}

          {!results && !searchQ && (
            <div className="k-hints">
              <div className="k-hint-title">Keresési tippek</div>
              <div className="k-hint-chips">
                {['deploy', 'Vercel', 'chatbot', 'workflow', 'biztonság', 'árazás'].map(h => (
                  <button key={h} className="k-hint-chip" onClick={() => handleSearch(h)}>{h}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 2: DECISIONS ═══ */}
      {tab === 'decisions' && (
        <div className="k-tab-content">
          <div className="k-section-title">
            📋 Összes döntés ({decisions.length})
          </div>
          <div className="k-decision-list">
            {decisions.map((d, i) => (
              <div key={i} className="k-decision-card" style={{
                borderLeftColor: d.topic && TOPIC_COLORS[d.topic] ? TOPIC_COLORS[d.topic] : '#6b7280'
              }}>
                <div className="k-decision-title">{d.title}</div>
                <div className="k-decision-decision">→ {d.decision}</div>
                <div className="k-decision-meta">
                  <span>📅 {d.date}</span>
                  {d.topic && (
                    <span className="k-decision-topic" style={{ color: TOPIC_COLORS[d.topic] || '#6b7280' }}>
                      {d.topic}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB 3: PREDICTOR ═══ */}
      {tab === 'predictor' && (
        <div className="k-tab-content">
          <div className="k-section-title">🔮 Balázs Predictor</div>
          <p className="k-section-sub">Írj le egy javaslatot, és megtippeltem mit fogsz válaszolni</p>

          <div className="k-predict-input-row">
            <input
              className="k-predict-input"
              placeholder="Pl. Csináljunk egy új dashboard tab-ot..."
              value={predictQ}
              onChange={e => setPredictQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doPredict()}
            />
            <button className="k-predict-btn" onClick={doPredict} disabled={predicting || !predictQ.trim()}>
              {predicting ? '⏳' : '🔮'} Predict
            </button>
          </div>

          {predictResult && (
            <div className="k-predict-result">
              <div className="k-predict-header">
                <span style={{ fontWeight: 700, fontSize: 16 }}>{predictResult.prediction}</span>
                <span className={`k-confidence ${predictResult.confidence > 70 ? 'high' : predictResult.confidence > 40 ? 'mid' : 'low'}`}>
                  {predictResult.confidence}%
                </span>
              </div>
              <div className="k-predict-reason">{predictResult.reasoning}</div>

              {predictResult.related_decisions.length > 0 && (
                <div className="k-related-section">
                  <div className="k-related-title">Kapcsolódó döntések:</div>
                  {predictResult.related_decisions.map((d, i) => (
                    <div key={i} className="k-related-item">
                      <span className="k-related-name">{d.title}</span>
                      <span className="k-related-decision">→ {d.decision}</span>
                      <span className="k-related-date">{d.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!predictResult && !predictQ && (
            <div className="k-hints">
              <div className="k-hint-title">Mit próbálj ki?</div>
              <div className="k-hint-chips">
                {['építsünk egy új API-t', 'adjunk el chatbotot', 'csináljunk landing page-t', 'új feature a dashboardon'].map(h => (
                  <button key={h} className="k-hint-chip" onClick={() => { setPredictQ(h); setTimeout(doPredict, 100) }}>{h}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 4: PROFILE ═══ */}
      {tab === 'profile' && profile && (
        <div className="k-tab-content">
          <div className="k-section-title">🧠 Balázs döntési profil</div>
          <p className="k-section-sub">Automatikusan generálva {profile.total_decisions} döntés alapján</p>

          <div className="k-profile-grid">
            <div className="k-profile-card" style={{ borderTopColor: '#8b5cf6' }}>
              <div className="k-profile-val" style={{ color: '#8b5cf6' }}>{profile.dominant_style}</div>
              <div className="k-profile-lbl">Domináns stílus</div>
            </div>
            <div className="k-profile-card" style={{ borderTopColor: '#3b82f6' }}>
              <div className="k-profile-val" style={{ color: '#3b82f6' }}>{profile.total_decisions}</div>
              <div className="k-profile-lbl">Összes döntés</div>
            </div>
            <div className="k-profile-card" style={{ borderTopColor: '#f59e0b' }}>
              <div className="k-profile-val" style={{ color: '#f59e0b' }}>7</div>
              <div className="k-profile-lbl">Magas hatású</div>
            </div>
            <div className="k-profile-card" style={{ borderTopColor: '#10b981' }}>
              <div className="k-profile-val" style={{ color: '#10b981' }}>{Object.keys(profile.topics).length}</div>
              <div className="k-profile-lbl">Témák száma</div>
            </div>
          </div>

          {/* Preference bars */}
          <div className="k-pref-section">
            <div className="k-section-title">Előrejelzési súlyok</div>
            {Object.entries(profile.preferences).map(([key, val]) => (
              <div key={key} className="k-pref-row">
                <span className="k-pref-label">{key}</span>
                <div className="k-pref-track">
                  <div className="k-pref-fill" style={{ width: `${Math.min(val * 10, 100)}%`, background: key === 'tervezés' ? '#8b5cf6' : key === 'gyakorlati' ? '#3b82f6' : key === 'biztonság' ? '#10b981' : '#f59e0b' }} />
                </div>
                <span className="k-pref-val">{val}</span>
              </div>
            ))}
          </div>

          {/* Topics */}
          <div className="k-pref-section">
            <div className="k-section-title">Témák szerinti bontás</div>
            <div className="k-topics-grid">
              {Object.entries(profile.topics).map(([topic, info]) => (
                <div key={topic} className="k-topic-card" style={{ borderLeftColor: TOPIC_COLORS[topic] || '#6b7280' }}>
                  <span className="k-topic-name">{topic}</span>
                  <span className="k-topic-count">{info.count} döntés</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 5: STATS ═══ */}
      {tab === 'stats' && (
        <div className="k-tab-content">
          <div className="k-section-title">📊 Döntési statisztikák</div>
          {stats ? (
            <>
              {/* Overview cards */}
              <div className="k-profile-grid">
                <div className="k-profile-card" style={{ borderTopColor: '#8b5cf6' }}>
                  <div className="k-profile-val" style={{ color: '#8b5cf6' }}>{stats.total}</div>
                  <div className="k-profile-lbl">Összes döntés</div>
                </div>
                <div className="k-profile-card" style={{ borderTopColor: '#f59e0b' }}>
                  <div className="k-profile-val" style={{ color: '#f59e0b' }}>{stats.average_per_week}</div>
                  <div className="k-profile-lbl">Átlag/hét</div>
                </div>
                <div className="k-profile-card" style={{ borderTopColor: '#3b82f6' }}>
                  <div className="k-profile-val" style={{ color: '#3b82f6' }}>{stats.streak_days}</div>
                  <div className="k-profile-lbl">Döntési sorozat (nap)</div>
                </div>
                <div className="k-profile-card" style={{ borderTopColor: '#10b981' }}>
                  <div className="k-profile-val" style={{ color: '#10b981' }}>{stats.impacts?.magas || 0}</div>
                  <div className="k-profile-lbl">Magas hatású</div>
                </div>
              </div>

              {/* Weekly breakdown */}
              {stats.weekly_breakdown && Object.keys(stats.weekly_breakdown).length > 0 && (
                <div className="k-pref-section">
                  <div className="k-section-title">📅 Heti bontás</div>
                  <div className="k-weekly-list">
                    {Object.entries(stats.weekly_breakdown).reverse().map(([week, data]: [string, any]) => (
                      <div key={week} className="k-weekly-row">
                        <span className="k-weekly-label">{week.replace('W', ' — ').replace('2026-', '')}</span>
                        <div className="k-weekly-bar-track">
                          <div className="k-weekly-bar-fill" style={{ width: `${Math.min((data.count / 5) * 100, 100)}%` }} />
                        </div>
                        <span className="k-weekly-count">{data.count} db</span>
                        {data.high_impact > 0 && <span className="k-weekly-impact">⚠️{data.high_impact}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topic impact matrix */}
              {stats.topic_impact && Object.keys(stats.topic_impact).length > 0 && (
                <div className="k-pref-section">
                  <div className="k-section-title">🎯 Téma — Hatás mátrix</div>
                  <div className="k-impact-grid">
                    {Object.entries(stats.topic_impact).map(([topic, data]: [string, any]) => (
                      <div key={topic} className="k-impact-card" style={{ borderLeftColor: TOPIC_COLORS[topic] || '#6b7280' }}>
                        <div className="k-impact-name">{topic}</div>
                        <div className="k-impact-bars">
                          <div className="k-impact-bar-row">
                            <span className="k-impact-label">Magas</span>
                            <div className="k-impact-track">
                              <div className="k-impact-fill high" style={{ width: `${(data.magas / Math.max(data.total, 1)) * 100}%` }} />
                            </div>
                            <span className="k-impact-val">{data.magas}</span>
                          </div>
                          <div className="k-impact-bar-row">
                            <span className="k-impact-label">Közepes</span>
                            <div className="k-impact-track">
                              <div className="k-impact-fill mid" style={{ width: `${(data.közepes / Math.max(data.total, 1)) * 100}%` }} />
                            </div>
                            <span className="k-impact-val">{data.közepes}</span>
                          </div>
                          <div className="k-impact-bar-row">
                            <span className="k-impact-label">Alacsony</span>
                            <div className="k-impact-track">
                              <div className="k-impact-fill low" style={{ width: `${(data.alacsony / Math.max(data.total, 1)) * 100}%` }} />
                            </div>
                            <span className="k-impact-val">{data.alacsony}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="k-empty">Nincs elég adat a statisztikákhoz</div>
          )}

          {/* Alerts section */}
          {alerts && alerts.alerts && alerts.alerts.length > 0 && (
            <div className="k-pref-section">
              <div className={`k-section-title ${alerts.critical_count > 0 ? 'k-section-warn' : ''}`}>
                🔔 Aktuális értesítések ({alerts.alert_count})
              </div>
              <div className="k-alerts-list">
                {alerts.alerts.map((a: any, i: number) => (
                  <div key={i} className={`k-alert-card ${a.severity}`}>
                    <div className="k-alert-icon">
                      {a.severity === 'important' ? '⚠️' : a.severity === 'info' ? 'ℹ️' : '💡'}
                    </div>
                    <div className="k-alert-content">
                      <div className="k-alert-title">{a.title}</div>
                      <div className="k-alert-message">{a.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STYLES */}
      <style>{`
        .knowledge-page { max-width: 900px; animation: fadeIn 0.2s; }

        .k-tabs {
          display: flex; gap: 4px; margin-bottom: 16px;
          background: var(--bg2); border-radius: 10px; padding: 4px;
        }
        .k-tab {
          flex: 1; padding: 8px 12px; border: none; border-radius: 8px;
          background: transparent; color: var(--text2); font-size: 12px;
          font-weight: 600; cursor: pointer; transition: all 0.15s;
        }
        .k-tab:hover { color: var(--text); background: rgba(255,255,255,0.05); }
        .k-tab.active { background: var(--card); color: var(--text); box-shadow: 0 1px 3px rgba(0,0,0,0.3); }

        .k-tab-content { }

        /* Search */
        .k-search-bar {
          display: flex; align-items: center; gap: 8px;
          background: var(--card); border: 1px solid var(--border);
          border-radius: 10px; padding: 10px 14px; margin-bottom: 16px;
        }
        .k-search-icon { font-size: 16px; }
        .k-search-input {
          flex: 1; background: none; border: none; color: var(--text);
          font-size: 14px; outline: none;
        }
        .k-search-input::placeholder { color: var(--text3); }
        .k-search-clear {
          background: none; border: none; color: var(--text3);
          cursor: pointer; font-size: 14px;
        }
        .k-results { display: flex; flex-direction: column; gap: 6px; }
        .k-result-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 8px; padding: 10px 14px;
        }
        .k-result-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;
        }
        .k-result-type { font-size: 10px; color: var(--text3); }
        .k-result-score { font-size: 10px; color: var(--text3); }
        .k-result-title { font-size: 13px; font-weight: 600; }
        .k-result-date { font-size: 11px; color: var(--text2); margin-top: 2px; }
        .k-empty { padding: 30px; text-align: center; color: var(--text3); font-size: 13px; }
        .k-hints { margin-top: 20px; }
        .k-hint-title { font-size: 12px; color: var(--text2); margin-bottom: 8px; }
        .k-hint-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .k-hint-chip {
          background: var(--bg3); border: 1px solid var(--border);
          color: var(--text2); padding: 5px 12px; border-radius: 20px;
          font-size: 12px; cursor: pointer;
        }
        .k-hint-chip:hover { border-color: var(--blue); color: var(--text); }

        /* Section */
        .k-section-title { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
        .k-section-sub { font-size: 12px; color: var(--text2); margin-bottom: 14px; }

        /* Decisions list */
        .k-decision-list { display: flex; flex-direction: column; gap: 6px; }
        .k-decision-card {
          background: var(--card); border: 1px solid var(--border);
          border-left: 3px solid #6b7280; border-radius: 8px; padding: 10px 14px;
        }
        .k-decision-title { font-size: 13px; font-weight: 600; }
        .k-decision-decision { font-size: 12px; color: var(--text2); margin: 3px 0; }
        .k-decision-meta { display: flex; gap: 8px; font-size: 10px; color: var(--text3); }
        .k-decision-topic { font-weight: 600; }

        /* Predictor */
        .k-predict-input-row { display: flex; gap: 8px; margin-bottom: 14px; }
        .k-predict-input {
          flex: 1; background: var(--card); border: 1px solid var(--border);
          border-radius: 8px; padding: 10px 12px; color: var(--text);
          font-size: 13px; outline: none;
        }
        .k-predict-input:focus { border-color: var(--blue); }
        .k-predict-btn {
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: white; border: none; border-radius: 8px;
          padding: 8px 16px; font-size: 13px; font-weight: 600;
          cursor: pointer; white-space: nowrap;
        }
        .k-predict-btn:disabled { opacity: 0.4; cursor: default; }
        .k-predict-result {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 10px; padding: 16px; margin-bottom: 14px;
        }
        .k-predict-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .k-confidence {
          padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;
        }
        .k-confidence.high { background: #10b98122; color: #10b981; }
        .k-confidence.mid { background: #f59e0b22; color: #f59e0b; }
        .k-confidence.low { background: #6b728022; color: #6b7280; }
        .k-predict-reason { font-size: 13px; color: var(--text2); margin-bottom: 10px; line-height: 1.4; }

        .k-related-section { border-top: 1px solid var(--border); padding-top: 10px; }
        .k-related-title { font-size: 11px; color: var(--text3); margin-bottom: 6px; }
        .k-related-item { display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; gap: 8px; }
        .k-related-name { font-weight: 600; flex: 1; }
        .k-related-decision { color: var(--text2); }
        .k-related-date { color: var(--text3); font-size: 10px; }

        /* Profile */
        .k-profile-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
        .k-profile-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 8px; padding: 12px; border-top: 2px solid transparent;
        }
        .k-profile-val { font-size: 14px; font-weight: 700; word-break: break-word; }
        .k-profile-lbl { font-size: 10px; color: var(--text2); margin-top: 4px; }

        .k-pref-section { margin-bottom: 16px; }
        .k-pref-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .k-pref-label { width: 90px; font-size: 11px; color: var(--text2); }
        .k-pref-track { flex: 1; height: 8px; background: var(--bg3); border-radius: 4px; overflow: hidden; }
        .k-pref-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
        .k-pref-val { width: 24px; font-size: 11px; color: var(--text3); text-align: right; }

        .k-topics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
        .k-topic-card {
          display: flex; justify-content: space-between; align-items: center;
          background: var(--card); border: 1px solid var(--border);
          border-left: 3px solid; border-radius: 6px; padding: 8px 12px;
        }
        .k-topic-name { font-size: 12px; font-weight: 600; }
        .k-topic-count { font-size: 10px; color: var(--text3); }

        /* Mode selector */
        .mode-selector { display: flex; gap: 2px; background: var(--bg3); border-radius: 8px; padding: 2px; }
        .mode-label { font-size: 14px; padding: 2px 4px; }
        .mode-btn {
          background: none; border: none; color: var(--text2); font-size: 11px;
          padding: 4px 8px; border-radius: 6px; cursor: pointer; font-weight: 600;
          transition: all 0.15s; white-space: nowrap;
        }
        .mode-btn:hover { color: var(--text); background: var(--bg); }
        .mode-btn.active { color: #fff; }

        /* ── Stats tab ── */
        .k-weekly-list { display: flex; flex-direction: column; gap: 6px; }
        .k-weekly-row {
          display: flex; align-items: center; gap: 8px;
          background: var(--card); border: 1px solid var(--border);
          border-radius: 6px; padding: 8px 12px;
        }
        .k-weekly-label { width: 80px; font-size: 11px; color: var(--text2); font-weight: 600; }
        .k-weekly-bar-track { flex: 1; height: 8px; background: var(--bg3); border-radius: 4px; overflow: hidden; }
        .k-weekly-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 4px; transition: width 0.3s; }
        .k-weekly-count { font-size: 11px; color: var(--text); font-weight: 700; width: 32px; text-align: right; }
        .k-weekly-impact { font-size: 10px; }
        .k-section-warn { color: #f59e0b !important; }

        /* Impact matrix */
        .k-impact-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .k-impact-card {
          background: var(--card); border: 1px solid var(--border);
          border-left: 3px solid; border-radius: 8px; padding: 10px 12px;
        }
        .k-impact-name { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
        .k-impact-bars { display: flex; flex-direction: column; gap: 3px; }
        .k-impact-bar-row { display: flex; align-items: center; gap: 6px; }
        .k-impact-label { width: 56px; font-size: 10px; color: var(--text3); }
        .k-impact-track { flex: 1; height: 6px; background: var(--bg3); border-radius: 3px; overflow: hidden; }
        .k-impact-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
        .k-impact-fill.high { background: #ef4444; }
        .k-impact-fill.mid { background: #f59e0b; }
        .k-impact-fill.low { background: #6b7280; }
        .k-impact-val { font-size: 10px; color: var(--text3); width: 16px; text-align: right; }

        /* Alerts */
        .k-alerts-list { display: flex; flex-direction: column; gap: 6px; }
        .k-alert-card {
          display: flex; gap: 10px; align-items: flex-start;
          background: var(--card); border: 1px solid var(--border);
          border-radius: 8px; padding: 10px 14px;
        }
        .k-alert-card.important { border-left: 3px solid #ef4444; }
        .k-alert-card.info { border-left: 3px solid #3b82f6; }
        .k-alert-card.gentle { border-left: 3px solid #6b7280; }
        .k-alert-icon { font-size: 16px; }
        .k-alert-content { flex: 1; }
        .k-alert-title { font-size: 13px; font-weight: 600; }
        .k-alert-message { font-size: 11px; color: var(--text2); margin-top: 2px; }

        @media (max-width: 600px) {
          .k-profile-grid { grid-template-columns: repeat(2, 1fr); }
          .k-topics-grid { grid-template-columns: 1fr; }
          .k-predict-input-row { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}

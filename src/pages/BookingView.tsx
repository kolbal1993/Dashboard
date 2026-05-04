import { useState, useEffect, useCallback } from 'react'

const DAY_NAMES = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap']

// ── API helpers ──
async function bFetch(path: string, opts?: any): Promise<any> {
  try { const r = await fetch(`/api/booking/${path}`, { signal: AbortSignal.timeout(4000), ...opts }); return await r.json() }
  catch { return null }
}
async function bSave(path: string, data: any): Promise<boolean> {
  try { const r = await fetch(`/api/booking/${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const d = await r.json(); return d.success }
  catch { return false }
}

export default function BookingView() {
  const [tab, setTab] = useState<'overview' | 'list' | 'settings'>('overview')
  const [stats, setStats] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const company = settings?.company || {}
  const services = settings?.services || []
  const hours = settings?.opening_hours || []
  const questions = settings?.questions || []

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [s, set, bk] = await Promise.all([
      bFetch('stats'),
      bFetch('settings'),
      bFetch('bookings?limit=50'),
    ])
    if (s) setStats(s)
    if (set) setSettings(set)
    if (bk) setBookings(bk)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  function fmtPrice(p: number) { return p > 0 ? `${p.toLocaleString()} Ft` : 'Egyedi ár' }
  function fmtDate(d: string) {
    if (!d) return '—'
    const dt = new Date(d)
    return dt.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
  }
  function fmtTime(d: string) {
    if (!d) return '—'
    return new Date(d).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
  }
  function fmtDateTime(d: string) {
    if (!d) return '—'
    const dt = new Date(d)
    return `${dt.toLocaleDateString('hu-HU')} ${dt.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}`
  }

  // ─── SAVE HANDLER ───
  async function handleSaveCompany(field: string, value: any) {
    setSaving(true); setSaveMsg('')
    const ok = await bSave('company', { ...company, [field]: value })
    setSaveMsg(ok ? '✅ Mentve' : '❌ Hiba')
    if (ok) setSettings({ ...settings, company: { ...company, [field]: value } })
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 2000)
  }

  async function handleSaveService(id: string, field: string, value: any) {
    const svc = services.find((s: any) => s.id === id)
    if (!svc) return
    setSaving(true)
    const ok = await bSave(`services/${id}`, { ...svc, [field]: value })
    if (ok) {
      setSettings({
        ...settings,
        services: services.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
      })
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="dashboard-view">
      <div className="section-top"><h1 className="section-title">📅 Booking Admin</h1><p className="section-sub">Betöltés...</p></div>
      <div className="empty-state" style={{ padding: 60, textAlign: 'center' }}>🔄</div>
    </div>
  )

  return (
    <div className="dashboard-view">
      <div className="section-top">
        <h1 className="section-title" style={{ cursor: 'pointer' }} onClick={loadAll}>
          📅 {company.name || 'Booking'} Admin
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="nav-tabs" style={{ background: 'none', gap: 4 }}>
            {(['overview', 'list', 'settings'] as const).map(t => (
              <button key={t} className={`nav-tab ${tab === t ? 'active' : ''}`}
                style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => setTab(t)}>
                {t === 'overview' ? '📊 Áttekintés' : t === 'list' ? '📋 Foglalások' : '⚙️ Beállítások'}
              </button>
            ))}
          </div>
          <div className="sync-badge" onClick={loadAll}>🔄</div>
        </div>
      </div>

      {tab === 'overview' && <OverviewTab stats={stats} bookings={bookings} services={services} company={company} fmtPrice={fmtPrice} fmtDate={fmtDate} fmtTime={fmtTime} />}
      {tab === 'list' && <BookingsTab bookings={bookings} company={company} fmtDate={fmtDateTime} fmtPrice={fmtPrice} />}
      {tab === 'settings' && (
        <SettingsTab
          company={company} services={services} hours={hours} questions={questions}
          fmtPrice={fmtPrice} saveMsg={saveMsg} saving={saving}
          onSaveCompany={handleSaveCompany} onSaveService={handleSaveService}
          settings={settings} setSettings={setSettings}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════
function OverviewTab({ stats, bookings, services, company, fmtPrice, fmtDate, fmtTime }: any) {
  const upcoming = (bookings || []).filter((b: any) => new Date(b.start_time) > new Date()).slice(0, 8)
  const activeServices = (services || []).filter((s: any) => s.is_active !== 0)

  return (
    <>
      {/* Metric cards */}
      <div className="metrics-row">
        <div className="metric-card" style={{ borderTop: `2px solid ${company.brand_color || '#8b5cf6'}` }}>
          <div className="metric-val" style={{ color: company.brand_color || '#8b5cf6' }}>{stats?.today_bookings || 0}</div>
          <div className="metric-lbl">Mai Foglalások</div>
          <div className="metric-sub">{stats?.upcoming_bookings || 0} közelgő</div>
        </div>
        <div className="metric-card" style={{ borderTop: '2px solid #10b981' }}>
          <div className="metric-val" style={{ color: '#10b981' }}>{stats?.month_bookings || 0}</div>
          <div className="metric-lbl">Havi Foglalások</div>
          <div className="metric-sub">{stats?.revenue_this_month?.toLocaleString() || 0} Ft bevétel</div>
        </div>
        <div className="metric-card" style={{ borderTop: '2px solid #f59e0b' }}>
          <div className="metric-val" style={{ color: '#f59e0b' }}>{stats?.total_bookings || 0}</div>
          <div className="metric-lbl">Összes Foglalás</div>
          <div className="metric-sub">{activeServices.length} aktív szolgáltatás</div>
        </div>
        <div className="metric-card" style={{ borderTop: '2px solid #3b82f6' }}>
          <div className="metric-val" style={{ color: '#3b82f6' }}>{company.name?.split(' ')[0] || '?'}</div>
          <div className="metric-lbl">Cég</div>
          <div className="metric-sub">{company.phone || ''}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Upcoming bookings */}
        <div className="panel">
          <div className="panel-header"><h3>📅 Közelgő Foglalások</h3><span className="panel-badge">{upcoming.length} db</span></div>
          <div className="team-list">
            {upcoming.length > 0 ? upcoming.map((b: any) => (
              <div key={b.id} className="team-row" style={{ borderLeft: `3px solid ${company.brand_color || '#8b5cf6'}` }}>
                <div className="team-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="team-name">{b.customer_name}</div>
                  <div className="team-role">{b.service_name} · {b.car_brand} {b.car_type}</div>
                  <div className="team-role" style={{ fontSize: 11, color: '#6b7280' }}>
                    {fmtDate(b.start_time)} {fmtTime(b.start_time)} · {fmtPrice(b.price)}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: b.customer_phone ? '#10b981' : '#6b7280' }}>
                  {b.customer_phone ? '📞' : '—'}
                </span>
              </div>
            )) : <div className="empty-state">Még nincs közelgő foglalás</div>}
          </div>
        </div>

        {/* Popular services */}
        <div className="panel">
          <div className="panel-header"><h3>⭐ Népszerű Szolgáltatások</h3></div>
          <div className="team-list">
            {activeServices.slice(0, 8).map((s: any) => (
              <div key={s.id} className="team-row">
                <span className="team-icon" style={{ background: (company.brand_color || '#8b5cf6') + '22' }}>
                  {s.category === 'alap' ? '🔧' : s.category === 'komplex' ? '🛠️' : '📦'}
                </span>
                <div className="team-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="team-name">{s.name}</div>
                  <div className="team-role">{s.duration_minutes} perc · {fmtPrice(s.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════
// BOOKINGS LIST TAB
// ═══════════════════════════════════════════════════════
function BookingsTab({ bookings, company, fmtDate, fmtPrice }: any) {
  const [filter, setFilter] = useState('all')
  const sorted = filter === 'all' ? bookings : bookings.filter((b: any) => b.status === filter)

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', 'confirmed', 'cancelled', 'completed'].map(s => (
          <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`}
            style={filter === s ? { borderColor: company.brand_color || '#8b5cf6', color: company.brand_color || '#8b5cf6' } : {}}
            onClick={() => setFilter(s)}>
            {s === 'all' ? '📋 Mind' : s === 'confirmed' ? '✅' : s === 'cancelled' ? '❌' : '✔️'} {s}
          </button>
        ))}
        <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center', marginLeft: 'auto' }}>
          {sorted.length} foglalás
        </span>
      </div>

      <div className="team-list">
        {sorted.length > 0 ? sorted.map((b: any) => (
          <div key={b.id} className="team-row" style={{
            borderLeft: `3px solid ${b.status === 'confirmed' ? '#10b981' : b.status === 'cancelled' ? '#ef4444' : '#6b7280'}`
          }}>
            <div className="team-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="team-name">
                {b.customer_name}
                <span style={{ fontSize: 11, marginLeft: 8, color: '#6b7280' }}>
                  {b.status === 'confirmed' ? '✅' : b.status === 'cancelled' ? '❌' : '✔️'}
                </span>
              </div>
              <div className="team-role" style={{ fontSize: 12 }}>
                {b.service_name} · {b.car_brand} {b.car_type} · {b.license_plate || '—'}
              </div>
              <div className="team-role" style={{ fontSize: 11, color: '#6b7280' }}>
                {fmtDate(b.start_time)} · {fmtPrice(b.price)} · {b.customer_email || '—'} · {b.customer_phone || '—'}
              </div>
            </div>
          </div>
        )) : <div className="empty-state">Nincs találat</div>}
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════════════════════════════
function SettingsTab({ company, services, hours, questions, fmtPrice, saveMsg, saving, onSaveCompany, onSaveService, settings, setSettings }: any) {
  const [activeSection, setActiveSection] = useState<'company' | 'services' | 'hours' | 'questions'>('company')
  const [editService, setEditService] = useState<any>(null)

  function setCompany(field: string, value: any) {
    setSettings({ ...settings, company: { ...company, [field]: value } })
  }

  return (
    <>
      {/* Section nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['company', 'services', 'hours', 'questions'] as const).map(s => (
          <button key={s} className={`filter-btn ${activeSection === s ? 'active' : ''}`}
            style={activeSection === s ? { borderColor: company.brand_color || '#8b5cf6', color: company.brand_color || '#8b5cf6' } : {}}
            onClick={() => setActiveSection(s)}>
            {s === 'company' ? '🏢' : s === 'services' ? '🔧' : s === 'hours' ? '🕐' : '❓'} {s}
          </button>
        ))}
        {saveMsg && <span style={{ fontSize: 12, alignSelf: 'center', color: saveMsg.includes('✅') ? '#10b981' : '#ef4444' }}>{saveMsg}</span>}
      </div>

      {/* ─── COMPANY INFO ─── */}
      {activeSection === 'company' && (
        <div className="panel">
          <div className="panel-header"><h3>🏢 Cég Adatai</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
            {[
              { label: 'Cégnév', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Telefon', key: 'phone', type: 'text' },
              { label: 'Cím', key: 'address', type: 'text' },
              { label: 'Márkaszín', key: 'brand_color', type: 'color' },
              { label: 'Kommunikációs stílus', key: 'tone', type: 'select', opts: ['professional', 'friendly', 'casual'] },
            ].map(f => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ minWidth: 140, fontSize: 13, color: '#9ca3af' }}>{f.label}</label>
                {f.type === 'select' ? (
                  <select value={company[f.key] || ''} onChange={e => setCompany(f.key, e.target.value)}
                    onBlur={() => onSaveCompany(f.key, company[f.key])}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #374151', background: '#1f2937', color: '#fff', fontSize: 13 }}>
                    {f.opts?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'color' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="color" value={company[f.key] || '#8b5cf6'} onChange={e => setCompany(f.key, e.target.value)}
                      onBlur={() => onSaveCompany(f.key, company[f.key])} style={{ width: 40, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{company[f.key] || '#8b5cf6'}</span>
                  </div>
                ) : (
                  <input type={f.type} value={company[f.key] || ''} onChange={e => setCompany(f.key, e.target.value)}
                    onBlur={() => onSaveCompany(f.key, company[f.key])}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #374151', background: '#1f2937', color: '#fff', fontSize: 13 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SERVICES ─── */}
      {activeSection === 'services' && (
        <div className="panel">
          <div className="panel-header"><h3>🔧 Szolgáltatások</h3><span className="panel-badge">{services.length} db</span></div>
          <div className="team-list">
            {services.map((s: any) => (
              <div key={s.id} className="team-row" style={{ opacity: s.is_active === 0 ? 0.5 : 1 }}>
                <div className="team-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="team-name">
                    {s.name}
                    <span style={{ fontSize: 10, marginLeft: 8, color: '#6b7280', background: '#374151', padding: '1px 6px', borderRadius: 4 }}>
                      {s.category}
                    </span>
                  </div>
                  <div className="team-role">{s.description?.slice(0, 80)}</div>
                  <div className="team-role" style={{ fontSize: 11, color: '#6b7280' }}>
                    {fmtPrice(s.price)} · {s.duration_minutes} perc · Aktív: {s.is_active ? '✅' : '❌'}
                  </div>
                </div>
                <button className="task-btn" style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => setEditService(editService?.id === s.id ? null : s)}>
                  ✏️
                </button>
              </div>
            ))}
          </div>

          {editService && (
            <div style={{ padding: 16, borderTop: '1px solid #374151' }}>
              <h4 style={{ marginBottom: 12, color: '#d1d5db' }}>✏️ {editService.name} szerkesztése</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Név', key: 'name', type: 'text' },
                  { label: 'Leírás', key: 'description', type: 'text' },
                  { label: 'Ár (Ft)', key: 'price', type: 'number' },
                  { label: 'Időtartam (perc)', key: 'duration_minutes', type: 'number' },
                  { label: 'Kategória', key: 'category', type: 'select', opts: ['alap', 'komplex', 'kiegeszito'] },
                ].map(f => (
                  <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ minWidth: 110, fontSize: 12, color: '#9ca3af' }}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={editService[f.key] || ''} onChange={e => setEditService({ ...editService, [f.key]: e.target.value })}
                        style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #374151', background: '#1f2937', color: '#fff', fontSize: 12 }}>
                        {f.opts?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} value={editService[f.key] ?? ''} onChange={e => setEditService({ ...editService, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                        style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #374151', background: '#1f2937', color: '#fff', fontSize: 12 }} />
                    )}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9ca3af' }}>
                    <input type="checkbox" checked={editService.is_active !== 0} onChange={e => setEditService({ ...editService, is_active: e.target.checked ? 1 : 0 })} />
                    Aktív
                  </label>
                  <button className="task-btn" style={{ marginLeft: 'auto', background: company.brand_color || '#8b5cf6', color: '#fff' }}
                    onClick={async () => {
                      for (const [key, val] of Object.entries(editService)) {
                        if (key !== 'id' && key !== 'company_id') {
                          await onSaveService(editService.id, key, val)
                        }
                      }
                      setEditService(null)
                    }}>
                    💾 Mentés
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── OPENING HOURS ─── */}
      {activeSection === 'hours' && (
        <div className="panel">
          <div className="panel-header"><h3>🕐 Nyitvatartás</h3></div>
          <div style={{ padding: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Nap</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px' }}>Nyitás</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px' }}>Zárás</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px' }}>Szünet</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 7 }, (_, i) => i).map(dow => {
                  const h = hours.find((h: any) => h.day_of_week === dow)
                  const isClosed = !h?.open_time
                  return (
                    <tr key={dow} style={{ borderBottom: '1px solid #2d3748', opacity: isClosed ? 0.5 : 1 }}>
                      <td style={{ padding: '8px', fontWeight: isClosed ? 400 : 600 }}>{DAY_NAMES[dow]}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>{isClosed ? '—' : h.open_time?.slice(0, 5)}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>{isClosed ? '—' : h.close_time?.slice(0, 5)}</td>
                      <td style={{ textAlign: 'center', padding: '8px', fontSize: 11 }}>
                        {isClosed ? '—' : h.break_start ? `${h.break_start?.slice(0, 5)}-${h.break_end?.slice(0, 5)}` : '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        {isClosed ? '🔴 Zárva' : '🟢 Nyitva'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 12 }}>
              A nyitvatartás módosításához a config.json-t kell szerkeszteni a szerveren.
            </p>
          </div>
        </div>
      )}

      {/* ─── QUESTIONS ─── */}
      {activeSection === 'questions' && (
        <div className="panel">
          <div className="panel-header"><h3>❓ Foglalási Kérdések</h3></div>
          <div className="team-list">
            {Array.isArray(questions) && questions.length > 0 ? questions.map((q: any, i: number) => (
              <div key={i} className="team-row">
                <div className="team-info" style={{ flex: 1 }}>
                  <div className="team-name">{q.question}</div>
                  <div className="team-role">Kulcs: {q.key} · {q.required ? 'Kötelező' : 'Opcionális'}</div>
                </div>
              </div>
            )) : <div className="empty-state">Nincsenek egyéni kérdések beállítva</div>}
          </div>
        </div>
      )}
    </>
  )
}

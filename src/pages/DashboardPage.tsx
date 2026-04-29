import { Link } from 'react-router-dom'
import ActivityChart from '../components/ActivityChart'

const months = [
  { label: 'Jan', cost: 0.12, h: 12 },
  { label: 'Feb', cost: 0.08, h: 8 },
  { label: 'Már', cost: 0.25, h: 25 },
  { label: 'Ápr', cost: 1.20, h: 100, active: true },
  { label: 'Máj', cost: 0, h: 3 },
  { label: 'Jún', cost: 0, h: 3 },
]

const platforms = [
  { name: 'LinkedIn', icon: '💼', val: 12, color: '#0a66c2' },
  { name: 'YouTube', icon: '▶️', val: 8, color: '#ff0044' },
  { name: 'Facebook', icon: '📘', val: 5, color: '#1877f2' },
  { name: 'Instagram', icon: '📸', val: 3, color: '#e4405f' },
  { name: 'TikTok', icon: '🎵', val: 1, color: '#25f4ee' },
  { name: 'X/Twitter', icon: '🐦', val: 1, color: '#1da1f2' },
]

export default function DashboardPage() {
  const stats = [
    { v: '€0.04', lbl: 'Napi költség', s: 'Havi össz: €1.20', c: '#6366f1' },
    { v: '3', lbl: 'Folyamatban', s: '1 blokkolt rád vár', c: '#f59e0b' },
    { v: '13', lbl: 'Kész task-ok', s: 'Ma összesen', c: '#22c55e' },
    { v: '30', lbl: 'Összes task', s: '24 aktív', c: '#a855f7' },
  ]

  return (
    <div className="dash">
      {/* Stats */}
      <div className="dash-stats">
        {stats.map((s, i) => (
          <div key={i} className="dash-stat" style={{ borderTop: `3px solid ${s.c}` }}>
            <div className="dash-stat-lbl">{s.lbl}</div>
            <div className="dash-stat-val">{s.v}</div>
            <div className="dash-stat-sub">{s.s}</div>
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <div className="dash-nav">
        {[
          { to: '/whisper', icon: '🎤', lbl: 'Whisper Chat' },
          { to: '/notes', icon: '📋', lbl: 'Jegyzetek' },
          { to: '/my-tasks', icon: '👑', lbl: 'Saját task-ok' },
          { to: '/tasks', icon: '📌', lbl: 'Összes task' },
          { to: '/chat', icon: '💬', lbl: 'Agent Chat' },
          { to: '/analytics', icon: '📊', lbl: 'Analitika' },
          { to: '/landing', icon: '🌐', lbl: 'Landing' },
          { to: '/affiliate', icon: '📢', lbl: 'Affiliate' },
        ].map((n, i) => (
          <Link key={i} to={n.to} className="dash-nav-btn">
            <span style={{ fontSize: 16 }}>{n.icon}</span> {n.lbl}
          </Link>
        ))}
      </div>

      {/* Activity Chart */}
      <ActivityChart />

      {/* Két oszlop */}
      <div className="dash-grid2">
        {/* BAL: Költség */}
        <div className="dash-card">
          <div className="dash-card-title">💰 API Költség</div>
          <div className="dash-money">
            {[
              ['Ezen a héten', '€0.35'],
              ['Ebben a hónapban', '€1.20'],
              ['Tervezett', '€3.60'],
            ].map(([l, v], i) => (
              <div key={i} className="dash-money-item">
                <span>{l}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          {/* BAR CHART */}
          <div className="dash-chart-v">
            {months.map((m, i) => (
              <div key={i} className="dash-col-wrap">
                <div className="dash-col-val">{m.cost > 0 ? `€${m.cost.toFixed(2)}` : '-'}</div>
                <div className="dash-col-track">
                  <div className={`dash-col-fill${m.active ? ' active' : ''}`} style={{ height: `${m.h}%` }} />
                </div>
                <div className={`dash-col-label${m.active ? ' active' : ''}`}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* JOBB: Platformok */}
        <div className="dash-card">
          <div className="dash-card-title">📈 Követők</div>
          <div className="dash-platforms">
            {platforms.map((p, i) => (
              <div key={i} className="dash-plat-row">
                <span className="dash-plat-icon">{p.icon}</span>
                <span className="dash-plat-name">{p.name}</span>
                <div className="dash-plat-track">
                  <div className="dash-plat-fill" style={{ width: `${(p.val/12)*100}%`, background: p.color }} />
                </div>
                <span className="dash-plat-num">{p.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

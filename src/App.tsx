import { useState, useEffect } from 'react'

// ========== TYPES ==========
interface Task {
  id: string
  title: string
  status: 'plan' | 'progress' | 'review' | 'done'
  badge: string
  badgeType: 'idea' | 'dev' | 'done'
  assignee: string
  date: string
}

interface PlatformData {
  name: string
  icon: string
  color: string
  followers: number
  views: number
  posts: number
  change: number
}

interface CostData {
  month: string
  value: number
}

// ========== SAMPLE DATA ==========
const tasks: Task[] = [
  { id: '1', title: 'Webapp brand átírás', status: 'plan', badge: 'Design', badgeType: 'idea', assignee: 'Clawdius', date: 'Ápr 28' },
  { id: '2', title: 'Research elemzés', status: 'plan', badge: 'Research', badgeType: 'idea', assignee: 'Clawdius', date: 'Ápr 27' },
  { id: '3', title: 'Zapier login', status: 'plan', badge: 'DevOps', badgeType: 'dev', assignee: 'Balázs', date: 'Ápr 28' },
  { id: '4', title: 'Clawdius Contentus beállítás', status: 'progress', badge: 'Dev', badgeType: 'dev', assignee: 'Clawdius', date: 'Ápr 27' },
  { id: '5', title: 'Dashboard deploy', status: 'progress', badge: 'Dev', badgeType: 'dev', assignee: 'Clawdius', date: 'Ápr 27' },
  { id: '6', title: 'DNS konfiguráció', status: 'done', badge: 'Infra', badgeType: 'done', assignee: 'Balázs', date: 'Ápr 27' },
  { id: '7', title: 'GitHub SSH setup', status: 'done', badge: 'Infra', badgeType: 'done', assignee: 'Balázs', date: 'Ápr 27' },
  { id: '8', title: 'Morning Spark cron', status: 'done', badge: 'System', badgeType: 'done', assignee: 'Clawdius', date: 'Ápr 27' },
]

const platforms: PlatformData[] = [
  { name: 'LinkedIn', icon: '💼', color: '#0a66c2', followers: 12, views: 340, posts: 2, change: 12 },
  { name: 'Facebook', icon: '📘', color: '#1877f2', followers: 8, views: 180, posts: 1, change: 8 },
  { name: 'Instagram', icon: '📸', color: '#e4405f', followers: 5, views: 290, posts: 1, change: 5 },
  { name: 'TikTok', icon: '🎵', color: '#000000', followers: 0, views: 0, posts: 0, change: 0 },
  { name: 'YouTube', icon: '▶️', color: '#ff0000', followers: 3, views: 65, posts: 0, change: 3 },
  { name: 'X/Twitter', icon: '🐦', color: '#1da1f2', followers: 2, views: 45, posts: 0, change: 2 },
]

const costHistory: CostData[] = [
  { month: 'Jan', value: 0 }, { month: 'Feb', value: 0 },
  { month: 'Már', value: 0 }, { month: 'Ápr', value: 1.2 },
  { month: 'Máj', value: 0 }, { month: 'Jún', value: 0 },
]

// ========== COMPONENTS ==========
function Header() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">C</div>
        <div className="header-title">
          <span>Clawdius</span> Command Center
        </div>
      </div>
      <div className="header-time">
        {time.toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        {' · '}
        {time.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </header>
  )
}

function StatCard({ label, value, change, icon }: { label: string; value: string; change?: string; icon: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{icon} {label}</div>
      <div className="stat-value">{value}</div>
      {change && <div className={`stat-change ${change.startsWith('+') ? 'up' : 'down'}`}>{change}</div>}
    </div>
  )
}

function CostChart() {
  const max = Math.max(...costHistory.map(c => c.value), 0.01)
  return (
    <div className="chart-card">
      <div className="chart-title">💰 API Költség (EUR)</div>
      <div className="bar-chart">
        {costHistory.map(c => (
          <div key={c.month} className="bar-container">
            <div
              className="bar"
              style={{
                height: `${(c.value / max) * 100}%`,
                background: `var(--brand)`,
              }}
            >
              <div className="bar-tooltip">€{c.value.toFixed(2)}</div>
            </div>
            <div className="bar-label">{c.month}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 20, justifyContent: 'center', fontSize: 13, color: 'var(--text-dim)' }}>
        <span>Havi: <strong style={{ color: 'var(--text)' }}>€1.20</strong></span>
        <span>Éves: <strong style={{ color: 'var(--text)' }}>€~3.60</strong></span>
        <span>Összes: <strong style={{ color: 'var(--brand)' }}>€1.20</strong></span>
      </div>
    </div>
  )
}

function PlatformStats() {
  return (
    <div className="chart-card">
      <div className="chart-title">📊 Követők változása (heti)</div>
      <div className="bar-chart" style={{ height: 80 }}>
        {platforms.map(p => (
          <div key={p.name} className="bar-container">
            <div
              className="bar"
              style={{
                height: `${Math.max((p.change / Math.max(...platforms.map(x => x.change), 1)) * 100, 5)}%`,
                background: p.color,
              }}
            >
              <div className="bar-tooltip">+{p.change}</div>
            </div>
            <div className="bar-label">{p.name.slice(0, 3)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
        {platforms.map(p => (
          <div key={p.name} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dim)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{p.followers}</div>
            <div>{p.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function KanbanBoard() {
  const columns = [
    { key: 'plan', label: '📋 Tervezett', dot: 'var(--purple)' },
    { key: 'progress', label: '⚡ Folyamatban', dot: 'var(--brand)' },
    { key: 'review', label: '🔍 Ellenőrzés', dot: 'var(--yellow)' },
    { key: 'done', label: '✅ Kész', dot: 'var(--green)' },
  ] as const

  return (
    <section className="kanban-section">
      <div className="section-header">
        <div className="section-title">Feladatok <span>· {tasks.filter(t => t.status !== 'done').length} aktív · {tasks.length} összes</span></div>
      </div>
      <div className="kanban">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key)
          return (
            <div key={col.key} className="kanban-column">
              <div className="kanban-header">
                <div className="kanban-title">
                  <span className="kanban-dot" style={{ background: col.dot }} />
                  {col.label}
                </div>
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              {colTasks.length === 0 ? (
                <div className="empty-column">Nincs feladat</div>
              ) : (
                colTasks.map(t => (
                  <div key={t.id} className="kanban-card">
                    <div className="kanban-card-title">{t.title}</div>
                    <div className="kanban-card-meta">
                      <span className={`kanban-card-badge ${t.badgeType}`}>{t.badge}</span>
                      <span>{t.assignee} · {t.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function PlatformDetailCard({ p }: { p: PlatformData }) {
  return (
    <div className="platform-card">
      <div className="platform-header">
        <div className="platform-icon" style={{ background: `${p.color}20` }}>{p.icon}</div>
        <div className="platform-name">{p.name}</div>
      </div>
      <div className="platform-stats">
        <div className="platform-stat">
          <div className="platform-stat-value">{p.followers}</div>
          <div className="platform-stat-label">Követők</div>
        </div>
        <div className="platform-stat">
          <div className="platform-stat-value">{p.views}</div>
          <div className="platform-stat-label">Megtekintés</div>
        </div>
        <div className="platform-stat">
          <div className="platform-stat-value">{p.posts}</div>
          <div className="platform-stat-label">Posztok</div>
        </div>
      </div>
      <div className="platform-bar">
        <div className="platform-bar-fill" style={{ width: `${Math.min(p.views / 5, 100)}%`, background: p.color }} />
      </div>
    </div>
  )
}

// ========== MAIN APP ==========
export default function App() {
  return (
    <div className="dashboard">
      <Header />
      
      <div className="stats-grid">
        <StatCard icon="💰" label="API költség (ma)" value="€0.04" change="+€0.04" />
        <StatCard icon="📋" label="Aktív feladatok" value={`${tasks.filter(t => t.status !== 'done').length}`} />
        <StatCard icon="✅" label="Kész ma" value="3" change="+3" />
        <StatCard icon="📈" label="Össz. követő" value={`${platforms.reduce((s, p) => s + p.followers, 0)}`} change="+30" />
      </div>

      <div className="charts-row">
        <CostChart />
        <PlatformStats />
      </div>

      <KanbanBoard />

      <section>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div className="section-title">Közösségi platformok</div>
        </div>
        <div className="platforms-row">
          {platforms.slice(0, 4).map(p => (
            <PlatformDetailCard key={p.name} p={p} />
          ))}
        </div>
        <div className="platforms-row">
          {platforms.slice(4).map(p => (
            <PlatformDetailCard key={p.name} p={p} />
          ))}
        </div>
      </section>
    </div>
  )
}

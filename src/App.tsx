import React, { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import type { Task, ChatMessage, AgentName } from './types'
import { agents, defaultTasks, defaultChat, getAgent } from './data'
import DashboardPage from './pages/DashboardPage'
import ChatPage from './pages/ChatPage'
import TaskModal from './components/TaskModal'
import NotesPage from './pages/NotesPage'
import WhisperChat from './pages/WhisperChat'
import LandingPage from './pages/LandingPage'
import AffiliatePage from './pages/AffiliatePage'
import ResourcesPage from './pages/ResourcesPage'
import AssistensPage from './pages/AssistensPage'
import { SettingsPage } from './pages/SettingsPage'

// ========== CONTEXT ==========
interface AppContextType {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  chatMessages: ChatMessage[]
  addChat: (msg: ChatMessage) => void
  selectedTask: Task | null
  setSelectedTask: (t: Task | null) => void
}

const AppContext = createContext<AppContextType>(null!)

export function useApp() {
  return useContext(AppContext)
}

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
        <div className="header-title"><span>Clawdius</span> Command Center</div>
        <nav className="nav-links">
          <NavLink to="/" end className="nav-link">📊 Dashboard</NavLink>
          <NavLink to="/tasks" className="nav-link">📌 Task-ok</NavLink>
          <NavLink to="/my-tasks" className="nav-link">👑 Saját</NavLink>
          <NavLink to="/whisper" className="nav-link">🎤 Whisper</NavLink>
          <NavLink to="/notes" className="nav-link">📋 Notes</NavLink>
          <NavLink to="/chat" className="nav-link">💬 Chat</NavLink>
          <NavLink to="/analytics" className="nav-link">📊 Analytics</NavLink>
          <NavLink to="/affiliate" className="nav-link">📢 Affiliate</NavLink>
          <NavLink to="/landing" className="nav-link">🌐 Landing</NavLink>
          <NavLink to="/resources" className="nav-link">🔗 Linktár</NavLink>
          <NavLink to="/assistant" className="nav-link">👩 Assistens</NavLink>
          <NavLink to="/settings" className="nav-link">⚙️ Settings</NavLink>
        </nav>
      </div>
      <div className="header-time">
        {time.toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        {' · '}
        {time.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </header>
  )
}

function AgentBadge({ name }: { name: AgentName }) {
  const agent = getAgent(name)
  return (
    <span className="agent-badge" style={{ borderColor: agent.color, color: agent.color }}>
      <span className="agent-badge-icon">{agent.icon}</span>
      {agent.name}
    </span>
  )
}

// ========== PAGES ==========
function TasksPage() {
  const { tasks, setSelectedTask } = useApp()
  const [filter, setFilter] = useState<AgentName | 'all'>('all')
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.assignee === filter)

  const columns = [
    { key: 'plan' as const, label: '📋 Tervezett', dot: 'var(--purple)' },
    { key: 'progress' as const, label: '⚡ Folyamatban', dot: 'var(--brand)' },
    { key: 'review' as const, label: '🔍 Ellenőrzés', dot: 'var(--yellow)' },
    { key: 'done' as const, label: '✅ Kész', dot: 'var(--green)' },
  ]

  return (
    <section className="kanban-section">
      <div className="section-header">
        <div className="section-title">Feladatok <span>· {tasks.filter(t => t.status !== 'done').length} aktív · {tasks.length} összes</span></div>
      </div>
      <div className="agent-filter-bar">
        <span className="agent-filter-label">Szűrés:</span>
        <button className={`agent-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>🤖 Összes</button>
        {agents.map(a => (
          <button key={a.name} className={`agent-filter-btn ${filter === a.name ? 'active' : ''}`}
            style={filter === a.name ? { borderColor: a.color, color: a.color, background: `${a.color}10` } : {}}
            onClick={() => setFilter(a.name)}>{a.icon} {a.name}</button>
        ))}
      </div>
      <div className="kanban">
        {columns.map(col => {
          const colTasks = filtered.filter(t => t.status === col.key)
          return (
            <div key={col.key} className="kanban-column">
              <div className="kanban-header">
                <div className="kanban-title"><span className="kanban-dot" style={{ background: col.dot }} />{col.label}</div>
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              {colTasks.length === 0 ? (
                <div className="empty-column">Nincs feladat</div>
              ) : (
                colTasks.map(t => (
                  <div key={t.id} className="kanban-card" onClick={() => setSelectedTask(t)}>
                    <div className="kanban-card-header">
                      <div className="kanban-card-title">{t.title}</div>
                      <span className={`priority-dot ${t.priority}`} />
                    </div>
                    <div className="kanban-card-meta">
                      <span className={`kanban-card-badge ${t.badgeType}`}>{t.badge}</span>
                      <AgentBadge name={t.assignee} />
                    </div>
                    <div className="kanban-card-date">{t.date}{t.comments.length > 0 ? ` · 💬${t.comments.length}` : ''}</div>
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

function MyTasksPage() {
  const { tasks, setSelectedTask } = useApp()
  const myTasks = tasks.filter(t => t.assignee === 'Balázs' && t.status !== 'done')

  return (
    <section id="my-tasks" style={{ marginBottom: 24 }}>
      <div className="section-header">
        <div className="section-title">👑 Az én feladataim <span>· {myTasks.length} még elvégzendő</span></div>
      </div>
      {myTasks.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>🎉 Nincs elvégzendő feladatod!</div>
      ) : (
        <div className="my-tasks-list">
          {myTasks.map(t => (
            <div key={t.id} className="my-task-card" onClick={() => setSelectedTask(t)}>
              <div className="my-task-left">
                <span className={`priority-dot ${t.priority}`} style={{ width: 10, height: 10 }} />
                <div>
                  <div className="my-task-title">{t.title}</div>
                  <div className="my-task-desc">{t.description.slice(0, 100)}{t.description.length > 100 ? '...' : ''}</div>
                </div>
              </div>
              <div className="my-task-right">
                <span className={`status-badge ${t.status}`}>{t.status === 'plan' ? 'Tervezett' : t.status === 'progress' ? 'Folyamatban' : 'Ellenőrzés'}</span>
                <span className="my-task-date">📅 {t.date}</span>
                {t.comments.length > 0 && <span className="my-task-date">💬{t.comments.length}</span>}
                <AgentBadge name={t.assignee} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function AnalyticsPage() {
  const platforms = [
    { name: 'LinkedIn', icon: '💼', color: '#0a66c2', followers: 12, views: 340, posts: 2, engagement: 4.2 },
    { name: 'Facebook', icon: '📘', color: '#1877f2', followers: 8, views: 180, posts: 1, engagement: 2.1 },
    { name: 'Instagram', icon: '📸', color: '#e4405f', followers: 5, views: 290, posts: 1, engagement: 3.8 },
    { name: 'TikTok', icon: '🎵', color: '#000', followers: 0, views: 0, posts: 0, engagement: 0 },
    { name: 'YouTube', icon: '▶️', color: '#ff0000', followers: 3, views: 65, posts: 0, engagement: 1.5 },
    { name: 'X/Twitter', icon: '🐦', color: '#1da1f2', followers: 2, views: 45, posts: 0, engagement: 0.8 },
  ]

  const rows = [platforms.slice(0, 3), platforms.slice(3)]

  return (
    <section>
      <div className="section-header" style={{ marginBottom: 16 }}>
        <div className="section-title">📊 Közösségi analitika</div>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="platforms-row">
          {row.map(p => {
            const maxVal = Math.max(p.views, p.followers * 10)
            return (
              <div key={p.name} className="platform-card">
                <div className="platform-header">
                  <div className="platform-icon" style={{ background: `${p.color}20` }}>{p.icon}</div>
                  <div className="platform-name">{p.name}</div>
                </div>
                <div className="platform-stats">
                  <div className="platform-stat"><div className="platform-stat-value">{p.followers}</div><div className="platform-stat-label">Követők</div></div>
                  <div className="platform-stat"><div className="platform-stat-value">{p.views}</div><div className="platform-stat-label">Megtekintés</div></div>
                  <div className="platform-stat"><div className="platform-stat-value">{p.posts}</div><div className="platform-stat-label">Posztok</div></div>
                </div>
                <div className="platform-bar"><div className="platform-bar-fill" style={{ width: `${Math.min(maxVal / 10, 100)}%`, background: p.color }} /></div>
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-dim)' }}>Elköteleződés: <strong style={{ color: 'var(--text)' }}>{p.engagement}%</strong></div>
              </div>
            )
          })}
        </div>
      ))}
    </section>
  )
}

// ========== MAIN APP ==========
export default function App() {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(defaultChat)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  function handleAddComment(taskId: string, text: string) {
    const now = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      return {
        ...t,
        comments: [...t.comments, {
          id: `cmt${Date.now()}`,
          author: 'Balázs' as AgentName,
          text,
          time: now,
        }]
      }
    }))
  }

  function addChat(msg: ChatMessage) {
    setChatMessages(prev => [...prev, msg])
  }

  return (
    <AppContext.Provider value={{ tasks, setTasks, chatMessages, addChat, selectedTask, setSelectedTask }}>
      <div className="dashboard">
        <Header />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/my-tasks" element={<MyTasksPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/whisper" element={<WhisperChat />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/affiliate" element={<AffiliatePage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/assistant" element={<AssistensPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>

        {selectedTask && (
          <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} onAddComment={handleAddComment} />
        )}
      </div>
    </AppContext.Provider>
  )
}

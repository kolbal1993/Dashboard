import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react'
import type { Task, ChatMessage, AgentName } from './types'
import { agents, defaultTasks, defaultChat, getAgent } from './data'
import { SettingsPage } from './pages/SettingsPage'

interface ThemeState {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  chatMessages: ChatMessage[]
  addChat: (msg: ChatMessage) => void
  selectedTask: Task | null
  setSelectedTask: (t: Task | null) => void
}

type Tab = 'dashboard' | 'tasks' | 'chat' | 'org' | 'tools' | 'settings'
const Theme = createContext<ThemeState>(null!)
export function useApp() { return useContext(Theme) }

// ====== API HELPERS ======
const API_BASE = 'https://clawdius.mindennapai.eu/dashboard-api'

async function fetchCost(): Promise<{today: string, month: string}> {
  try {
    const r = await fetch(`${API_BASE}/costs/today`, { signal: AbortSignal.timeout(3000) })
    const d = await r.json()
    return { today: `$${d.cost?.toFixed(2) || '0.00'}`, month: `$${(d.total || 0).toFixed(2)}` }
  } catch { return { today: '$0.00', month: '$0.00' } }
}

async function fetchHealthLog(): Promise<any[]> {
  try {
    const r = await fetch(`${API_BASE}/health/log?limit=20`, { signal: AbortSignal.timeout(3000) })
    return await r.json()
  } catch { return [] }
}

async function fetchN8nWorkflows(): Promise<number> {
  try {
    const r = await fetch('https://n8n.mindennapai.eu/api/v1/workflows?active=true&limit=50', {
      signal: AbortSignal.timeout(3000),
      headers: { 'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NTY3MDQ3OS1kNjU2LTRhNWYtYjZmMi04OWUxZmY1NDg5MDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMGQwNmFjNWMtNWQ1Zi00YTNhLWI1MzctYjdlMzVlYmE3YzhlIiwiaWF0IjoxNzc3NjE4NDQxfQ.BRwcWD_JEmQCxepPyZ6Ffz2JqPhmThEZ95iNQ1fyJMU' }
    })
    const d = await r.json()
    return d.data?.length || 0
  } catch { return 0 }
}

async function fetchAgentOrg(): Promise<any> {
  try {
    const r = await fetch(`${API_BASE}/agents`, { signal: AbortSignal.timeout(3000) })
    return await r.json()
  } catch { return null }
}

async function fetchAgentStatuses(): Promise<any> {
  try {
    const r = await fetch(`${API_BASE}/agents/status`, { signal: AbortSignal.timeout(3000) })
    return await r.json()
  } catch { return null }
}

async function fetchN8nFailed(): Promise<number> {
  try {
    const r = await fetch('https://n8n.mindennapai.eu/api/v1/executions?status=error&limit=50', {
      signal: AbortSignal.timeout(3000),
      headers: { 'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NTY3MDQ3OS1kNjU2LTRhNWYtYjZmMi04OWUxZmY1NDg5MDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMGQwNmFjNWMtNWQ1Zi00YTNhLWI1MzctYjdlMzVlYmE3YzhlIiwiaWF0IjoxNzc3NjE4NDQxfQ.BRwcWD_JEmQCxepPyZ6Ffz2JqPhmThEZ95iNQ1fyJMU' }
    })
    const d = await r.json()
    return d.data?.length || 0
  } catch { return 0 }
}

// ====== CONSTANTS ======
const INFRA_METRICS = [
  { label: 'Agents Online', value: '6', sub: 'of 8', color: '#10b981' },
  { label: 'Workflows', value: '9', sub: 'active', color: '#8b5cf6' },
  { label: 'Cost', value: '$0.00', sub: 'today', color: '#f59e0b' },
  { label: 'Uptime', value: '99.9%', sub: '30d', color: '#3b82f6' },
]

const TEAM = [
  { name: 'Köles Balázs', role: 'CEO & Founder', icon: '👤', status: 'online' as const, color: '#3b82f6' },
  { name: 'Clawdius', role: 'Lead AI Agent', icon: '🏆', status: 'online' as const, color: '#8b5cf6' },
  { name: 'Supervision Agent', role: 'Monitoring', icon: '🦞', status: 'online' as const, color: '#10b981' },
  { name: 'Assistant Bot', role: 'Chat Support', icon: '🤖', status: 'online' as const, color: '#f59e0b' },
  { name: 'Content Engine', role: 'Content', icon: '📝', status: 'idle' as const, color: '#06b6d4' },
  { name: 'Jackie', role: 'RAG Agent', icon: '🧩', status: 'idle' as const, color: '#ef4444' },
  { name: 'Watchdog', role: 'System Watch', icon: '🐕', status: 'online' as const, color: '#6b7280' },
  { name: 'Kill Switch', role: 'Safety', icon: '🛑', status: 'online' as const, color: '#ef4444' },
]

const ORG_GROUPS = [
  { name: 'Vezetés', color: '#3b82f6', members: [{ name: 'Köles Balázs', role: 'CEO & Founder', icon: '👤', status: 'online' as const }] },
  { name: 'AI Agentek', color: '#8b5cf6', members: [
    { name: 'Clawdius', role: 'Lead AI Agent', icon: '🏆', status: 'online' as const },
    { name: 'Supervision Agent', role: 'Monitoring', icon: '🦞', status: 'online' as const },
    { name: 'Assistant Bot', role: 'Chat', icon: '🤖', status: 'online' as const },
    { name: 'Content Engine', role: 'Content', icon: '📝', status: 'idle' as const },
    { name: 'Jackie', role: 'RAG', icon: '🧩', status: 'idle' as const },
  ]},
  { name: 'Infra', color: '#10b981', members: [
    { name: 'Kill Switch', role: 'Safety', icon: '🛑', status: 'online' as const },
    { name: 'Watchdog', role: 'Monitor', icon: '🐕', status: 'online' as const },
    { name: 'Dashboard', role: 'Control', icon: '📊', status: 'online' as const },
    { name: 'n8n', role: 'Workflows', icon: '⚡', status: 'online' as const },
  ]},
]

const QUICK_SUGGESTIONS = [
  'Mutasd a task-okat', 'Kik vannak online?', 'Mi a legfontosabb?', 'Mac Mini ajánlat',
]

// ====== MAIN APP ======
export default function App() {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(defaultChat)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMsgs, setChatMsgs] = useState<{role:'user'|'assistant', content:string}[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs])

  function addChat(msg: ChatMessage) { setChatMessages(prev => [...prev, msg]) }
  function handleAddComment(taskId: string, text: string) {
    const now = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      return { ...t, comments: [...t.comments, { id: `c${Date.now()}`, author: 'Balázs' as AgentName, text, time: now }] }
    }))
  }

  async function sendChat(msg?: string) {
    const text = msg || chatInput
    if (!text.trim() || chatLoading) return
    setChatInput('')
    setChatMsgs(prev => [...prev, { role: 'user', content: text }])
    setChatLoading(true)
    try {
      const resp = await fetch('http://168.231.105.140:3008/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: { taskSummary: `${tasks.filter(t=>t.status==='done').length}/${tasks.length} done` }
        })
      })
      const data = await resp.json()
      setChatMsgs(prev => [...prev, { role: 'assistant', content: data.output || '⚠️ Hiba' }])
    } catch {
      setChatMsgs(prev => [...prev, { role: 'assistant', content: '⚠️ Hálózati hiba' }])
    }
    setChatLoading(false)
  }

  const count = (s: string) => tasks.filter(t => t.status === s).length

  function renderContent() {
    switch (tab) {
      case 'dashboard': return <DashboardView tasks={tasks} chatMsgs={chatMsgs} />
      case 'tasks': return <TasksView tasks={tasks} count={count} setSelectedTask={setSelectedTask} />
      case 'chat': return <ChatView input={chatInput} setInput={setChatInput} msgs={chatMsgs} loading={chatLoading} send={sendChat} bottomRef={bottomRef} />
      case 'org': return <OrgView />
      case 'tools': return <ToolsView />
      case 'settings': return <SettingsPage />
    }
  }

  return (
    <Theme.Provider value={{ tasks, setTasks, chatMessages, addChat, selectedTask, setSelectedTask }}>
      <div className="app">
        <nav className="top-nav">
          <div className="nav-brand" onClick={() => setTab('dashboard')}>
            <span className="nav-brand-icon">🏆</span>
            <span className="nav-brand-text">Clawdius</span>
          </div>
          <div className="nav-tabs">
            <button className={`nav-tab ${tab==='dashboard'?'active':''}`} onClick={() => setTab('dashboard')}>MISSION CONTROL</button>
            <button className={`nav-tab ${tab==='tasks'?'active':''}`} onClick={() => setTab('tasks')}>TASKS</button>
            <button className={`nav-tab ${tab==='chat'?'active':''}`} onClick={() => setTab('chat')}>CHAT</button>
            <button className={`nav-tab ${tab==='org'?'active':''}`} onClick={() => setTab('org')}>ORG</button>
            <button className={`nav-tab ${tab==='tools'?'active':''}`} onClick={() => setTab('tools')}>TOOLS</button>
            <button className={`nav-tab ${tab==='settings'?'active':''}`} onClick={() => setTab('settings')}>SETTINGS</button>
          </div>
          <div className="nav-status">
            <span className="status-dot online" />
            <span className="nav-status-text">System Online</span>
          </div>
        </nav>

        <main className="main-content">
          {renderContent()}
        </main>

        {selectedTask && (
          <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedTask.title}</h2>
                <button className="modal-close" onClick={() => setSelectedTask(null)}>✕</button>
              </div>
              <div className="modal-body">
                <p className="modal-desc">{selectedTask.description}</p>
                <div className="modal-meta">
                  <span className={`modal-status ${selectedTask.status}`}>{selectedTask.status}</span>
                  <span className={`modal-priority ${selectedTask.priority}`}>{selectedTask.priority}</span>
                  <span>{getAgent(selectedTask.assignee).icon} {selectedTask.assignee}</span>
                  <span>📅 {selectedTask.date}</span>
                </div>
                <div className="modal-comments">
                  <h3>Kommentek ({selectedTask.comments.length})</h3>
                  {selectedTask.comments.map(c => (
                    <div key={c.id} className="modal-comment">
                      <strong>{c.author}:</strong> {c.text} <span className="modal-comment-time">{c.time}</span>
                    </div>
                  ))}
                  <AddCommentForm taskId={selectedTask.id} onAdd={handleAddComment} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Theme.Provider>
  )
}

function AddCommentForm({ taskId, onAdd }: { taskId: string, onAdd: (id: string, text: string) => void }) {
  const [text, setText] = useState('')
  return (
    <div className="add-comment">
      <input className="add-comment-input" value={text} onChange={e => setText(e.target.value)} placeholder="Írj kommentet..." />
      <button className="add-comment-btn" onClick={() => { if (text.trim()) { onAdd(taskId, text); setText('') } }} disabled={!text.trim()}>Küldés</button>
    </div>
  )
}

// ====== DASHBOARD VIEW (LIVE DATA) ======
function DashboardView({ tasks, chatMsgs }: { tasks: Task[], chatMsgs: {role:string,content:string}[] }) {
  const [syncTime, setSyncTime] = useState('—')
  const [costToday, setCostToday] = useState('$0.00')
  const [costMonth, setCostMonth] = useState('$0.00')
  const [activeWorkflows, setActiveWorkflows] = useState(9)
  const [failedExecs, setFailedExecs] = useState(0)
  const [activityLog, setActivityLog] = useState<any[]>([])
  const [agentsOnline, setAgentsOnline] = useState(6)
  const [lastSync, setLastSync] = useState('')

  const loadData = useCallback(async () => {
    const now = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setSyncTime(now)
    setLastSync(now)

    const [cost, workflows, failed, log] = await Promise.all([
      fetchCost(),
      fetchN8nWorkflows(),
      fetchN8nFailed(),
      fetchHealthLog(),
    ])

    setCostToday(cost.today)
    setCostMonth(cost.month)
    setActiveWorkflows(workflows)
    setFailedExecs(failed)
    setActivityLog(log)
    setAgentsOnline(TEAM.filter(t => t.status === 'online').length + (workflows > 0 ? 0 : 0))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const done = tasks.filter(t => t.status === 'done').length
  const active = tasks.filter(t => t.status === 'progress').length
  const planned = tasks.filter(t => t.status === 'plan').length
  const total = tasks.length
  const highPrio = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length
  const blocked = tasks.filter(t => t.status === 'blocked').length

  return (
    <div className="dashboard-view">
      <div className="section-top">
        <div>
          <h1 className="section-title">Mission Control</h1>
          <p className="section-sub">Enterprise Operations Overview · {syncTime}{lastSync ? ` · last sync: ${lastSync}` : ''}</p>
        </div>
        <div className="sync-badge" onClick={loadData}>
          🔄 Sync
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-row">
        <div className="metric-card" style={{ borderTop: '2px solid #3b82f6' }}>
          <div className="metric-val" style={{ color: '#3b82f6' }}>{total}</div>
          <div className="metric-lbl">Total Tasks</div>
          <div className="metric-sub">{done} completed</div>
        </div>
        <div className="metric-card" style={{ borderTop: '2px solid #f59e0b' }}>
          <div className="metric-val" style={{ color: '#f59e0b' }}>{active}</div>
          <div className="metric-lbl">Active Tasks</div>
          <div className="metric-sub">{planned} planned · {blocked} blocked</div>
        </div>
        <div className="metric-card" style={{ borderTop: '2px solid #ef4444' }}>
          <div className="metric-val" style={{ color: '#ef4444' }}>{highPrio}</div>
          <div className="metric-lbl">High Priority</div>
          <div className="metric-sub">needs attention</div>
        </div>
        <div className="metric-card" style={{ borderTop: '2px solid #8b5cf6' }}>
          <div className="metric-val" style={{ color: '#8b5cf6' }}>{costToday}</div>
          <div className="metric-lbl">Cost Today</div>
          <div className="metric-sub">this month: {costMonth}</div>
        </div>
      </div>

      {/* Infra metrics */}
      <div className="infra-row">
        <div className="infra-card" style={{ borderTop: '2px solid #10b981' }}>
          <div className="infra-val" style={{ color: '#10b981' }}>{agentsOnline}</div>
          <div className="infra-lbl">Agents Online</div>
          <div className="infra-sub">of 8 total</div>
        </div>
        <div className="infra-card" style={{ borderTop: '2px solid #8b5cf6' }}>
          <div className="infra-val" style={{ color: '#8b5cf6' }}>{activeWorkflows}</div>
          <div className="infra-lbl">Workflows</div>
          <div className="infra-sub">active</div>
        </div>
        <div className="infra-card" style={{ borderTop: '2px solid #f59e0b' }}>
          <div className="infra-val" style={{ color: '#f59e0b' }}>{costToday}</div>
          <div className="infra-lbl">Cost Today</div>
          <div className="infra-sub">@{lastSync || syncTime}</div>
        </div>
        <div className="infra-card" style={{ borderTop: '2px solid #3b82f6' }}>
          <div className="infra-val" style={{ color: failedExecs > 0 ? '#ef4444' : '#3b82f6' }}>{failedExecs > 0 ? `⚠${failedExecs}` : '99.9%'}</div>
          <div className="infra-lbl">Health</div>
          <div className="infra-sub">{failedExecs > 0 ? `${failedExecs} failed executions` : '30d uptime'}</div>
        </div>
      </div>

      {/* Two columns */}
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Team Status</h3>
            <span className="panel-badge">{TEAM.filter(t=>t.status==='online').length} online</span>
          </div>
          <div className="team-list">
            {TEAM.map(m => (
              <div key={m.name} className="team-row">
                <span className="team-icon" style={{ background: m.color + '22' }}>{m.icon}</span>
                <div className="team-info">
                  <span className="team-name">{m.name}</span>
                  <span className="team-role">{m.role}</span>
                </div>
                <span className={`status-badge-sm ${m.status}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Recent Activity</h3>
            <span className="panel-badge">{chatMsgs.length > 0 ? `chat: ${chatMsgs.length}` : `${activityLog.length} logs`}</span>
          </div>
          <div className="activity-list">
            {activityLog.length > 0 ? (
              activityLog.slice(0, 6).map((e, i) => (
                <div key={i} className="activity-item">
                  <span className="activity-avatar">🦞</span>
                  <div className="activity-text">{e.message?.slice(0, 80) || JSON.stringify(e).slice(0, 80)}</div>
                </div>
              ))
            ) : chatMsgs.length > 0 ? (
              chatMsgs.slice(-5).reverse().map((m, i) => (
                <div key={i} className={`activity-item ${m.role}`}>
                  <span className="activity-avatar">{m.role === 'assistant' ? '🏆' : '👤'}</span>
                  <div className="activity-text">{m.content.slice(0, 80)}{m.content.length > 80 ? '...' : ''}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">No activity yet. Click 🔄 Sync to refresh.</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Task Status</h3>
          </div>
          <div className="status-bars">
            {[
              { label: 'Done', count: done, color: '#10b981', pct: total ? Math.round(done/total*100) : 0 },
              { label: 'Active', count: active, color: '#f59e0b', pct: total ? Math.round(active/total*100) : 0 },
              { label: 'Planned', count: planned, color: '#6b7280', pct: total ? Math.round(planned/total*100) : 0 },
              { label: 'Blocked', count: blocked, color: '#ef4444', pct: total ? Math.round(blocked/total*100) : 0 },
            ].map(s => (
              <div key={s.label} className="status-bar-row">
                <div className="status-bar-labels">
                  <span>{s.label}</span>
                  <span>{s.count}/{total}</span>
                </div>
                <div className="status-bar-track">
                  <div className="status-bar-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>⚠️ High Priority</h3>
            <span className="panel-badge">{highPrio} tasks</span>
          </div>
          <div className="high-prio-list">
            {tasks.filter(t => t.priority === 'high' && t.status !== 'done').slice(0, 5).map(t => (
              <div key={t.id} className="high-prio-item" onClick={() => {}}>
                <span className={`priority-dot ${t.priority}`} />
                <span className="high-prio-title">{t.title}</span>
                <span className="high-prio-status">{t.status === 'progress' ? '🔄' : t.status === 'blocked' ? '🚫' : '📋'}</span>
              </div>
            ))}
            {highPrio === 0 && <div className="empty-state">🎉 Nincs magas prioritású feladat!</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ====== TASKS VIEW ======
function TasksView({ tasks, count, setSelectedTask }: { tasks: Task[], count: (s:string)=>number, setSelectedTask: (t:Task|null)=>void }) {
  const [filter, setFilter] = useState<AgentName | 'all'>('all')
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.assignee === filter)

  const columns = [
    { key: 'progress' as const, label: 'Folyamatban', color: '#f59e0b' },
    { key: 'plan' as const, label: 'Tervezett', color: '#8b5cf6' },
    { key: 'done' as const, label: 'Kész', color: '#10b981' },
  ]

  return (
    <div className="tasks-view">
      <div className="section-top">
        <div>
          <h1 className="section-title">Tasks</h1>
          <p className="section-sub">{tasks.length} total · {count('done')} done · {count('progress')} active · {count('plan')} planned</p>
        </div>
      </div>

      <div className="filter-row">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>🤖 All</button>
        {agents.map(a => (
          <button key={a.name} className={`filter-btn ${filter === a.name ? 'active' : ''}`}
            style={filter === a.name ? { borderColor: a.color, color: a.color } : {}}
            onClick={() => setFilter(a.name)}>{a.icon} {a.name}</button>
        ))}
      </div>

      <div className="kanban">
        {columns.map(col => {
          const colTasks = filtered.filter(t => t.status === col.key)
          return (
            <div key={col.key} className="kanban-col">
              <div className="kanban-col-header">
                <span className="kanban-dot" style={{ background: col.color }} />
                {col.label}
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              {colTasks.map(t => (
                <div key={t.id} className="kanban-card" onClick={() => setSelectedTask(t)}>
                  <div className="kanban-card-title">
                    {t.title}
                    <span className={`priority-dot ${t.priority}`} />
                  </div>
                  <div className="kanban-card-desc">{t.description.slice(0, 60)}{t.description.length > 60 ? '...' : ''}</div>
                  <div className="kanban-card-meta">
                    <span>{getAgent(t.assignee).icon} {t.assignee}</span>
                    <span>📅 {t.date}</span>
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && <div className="empty-col">—</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ====== CHAT VIEW ======
function ChatView({ input, setInput, msgs, loading, send, bottomRef }: {
  input: string, setInput: (s:string)=>void, msgs: {role:string,content:string}[],
  loading: boolean, send: (msg?:string)=>void, bottomRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="chat-view-panel">
      <div className="section-top">
        <h1 className="section-title">AI Chat</h1>
        <p className="section-sub">Kérdezz Clawdius-tól, vagy beszélj az AI csapattal</p>
      </div>

      <div className="chat-layout">
        <div className="chat-sidebar-panel">
          <h4>TEAM ONLINE</h4>
          {TEAM.map(m => (
            <div key={m.name} className="sidebar-member">
              <span>{m.icon}</span>
              <span className="sidebar-member-name">{m.name}</span>
              <span className={`status-indicator ${m.status}`} />
            </div>
          ))}
        </div>

        <div className="chat-main">
          <div className="chat-msgs">
            {msgs.length === 0 && (
              <div className="chat-welcome">
                <div className="chat-welcome-icon">🏆</div>
                <h2>Clawdius Assistant</h2>
                <p>Hogyan segíthetek?</p>
                <div className="suggestion-grid">
                  {QUICK_SUGGESTIONS.map(s => (
                    <button key={s} className="suggestion-btn" onClick={() => send(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>
                <div className="chat-avatar">{m.role === 'assistant' ? '🏆' : '👤'}</div>
                <div className="chat-text">{m.content}</div>
              </div>
            ))}
            {loading && <div className="chat-bubble assistant"><div className="chat-avatar">🏆</div><div className="chat-text loading-dots">···</div></div>}
            <div ref={bottomRef} />
          </div>

          <div className="chat-bar">
            <input className="chat-field" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()} placeholder="Üzenj Clawdius-nak..." disabled={loading} />
            <button className="chat-send" onClick={() => send()} disabled={loading || !input.trim()}>➤</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ====== ORG VIEW ======
function OrgView() {
  const [orgData, setOrgData] = useState<any>(null)
  const [wfCount, setWfCount] = useState(9)
  const [costData, setCostData] = useState({today: '$0.00', month: '$0.00'})
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState('')

  const loadOrg = useCallback(async () => {
    setLoading(true)
    const now = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    const [org, wf, cost] = await Promise.all([
      fetchAgentOrg(),
      fetchN8nWorkflows(),
      fetchCost()
    ])
    if (org) setOrgData(org)
    setWfCount(wf)
    setCostData(cost)
    setLastSync(now)
    setLoading(false)
  }, [])

  useEffect(() => { loadOrg() }, [loadOrg])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadOrg, 30000)
    return () => clearInterval(interval)
  }, [loadOrg])

  const statuses = orgData?.agentStatuses || {}
  const leaderStatuses = orgData?.leaderStatuses || {}
  const structure = orgData?.structure

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return '#10b981'
      case 'online': return '#3b82f6'
      case 'idle': return '#6b7280'
      case 'error': return '#ef4444'
      case 'offline': return '#374151'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return '🟢'
      case 'online': return '🔵'
      case 'idle': return '⚪'
      case 'error': return '🔴'
      case 'offline': return '⚫'
      default: return '⚪'
    }
  }

  const countByStatus = (list: Record<string, any>, ...statuses: string[]) =>
    Object.values(list).filter((s: any) => statuses.includes(s.status)).length

  const allOnline = countByStatus({...leaderStatuses, ...statuses}, 'working', 'online')
  const allTotal = Object.keys({...leaderStatuses, ...statuses}).length

  if (loading && !orgData) {
    return (
      <div className="org-view-panel">
        <div className="section-top">
          <h1 className="section-title">Organization</h1>
          <p className="section-sub">Loading live agent data...</p>
        </div>
        <div className="empty-state" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <div>Syncing agent statuses...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="org-view-panel">
      <div className="section-top">
        <div>
          <h1 className="section-title">Organization</h1>
          <p className="section-sub">
            Clawdius AI Agent Team Structure
            {lastSync && ` · last sync: ${lastSync}`}
          </p>
        </div>
        <div className="sync-badge" onClick={loadOrg}>
          🔄 Sync
        </div>
      </div>

      <div className="org-metrics">
        <div className="metric-card-sm" style={{ borderTop: '2px solid #10b981' }}>
          <div className="metric-val-sm" style={{ color: '#10b981' }}>{allOnline}</div>
          <div className="metric-lbl-sm">Agents Online</div>
          <div className="metric-sub-sm">of {allTotal || 0} total</div>
        </div>
        <div className="metric-card-sm" style={{ borderTop: '2px solid #8b5cf6' }}>
          <div className="metric-val-sm" style={{ color: '#8b5cf6' }}>{wfCount}</div>
          <div className="metric-lbl-sm">Active Workflows</div>
          <div className="metric-sub-sm">n8n</div>
        </div>
        <div className="metric-card-sm" style={{ borderTop: '2px solid #f59e0b' }}>
          <div className="metric-val-sm" style={{ color: '#f59e0b' }}>{costData.today}</div>
          <div className="metric-lbl-sm">Cost Today</div>
          <div className="metric-sub-sm">{costData.month} this month</div>
        </div>
        <div className="metric-card-sm" style={{ borderTop: '2px solid #3b82f6' }}>
          <div className="metric-val-sm" style={{ color: '#3b82f6' }}>4</div>
          <div className="metric-lbl-sm">PM2 Services</div>
          <div className="metric-sub-sm">all online</div>
        </div>
      </div>

      {/* — Center: CEO + CSO + Council — */}
      <div className="org-center">
        {structure?.ceo && (
          <div className="org-ceo" style={{ position: 'relative' }}>
            <div className="org-ceo-icon">{structure.ceo.icon || '👤'}</div>
            <div className="org-ceo-name">{structure.ceo.name}</div>
            <div className="org-ceo-role">{structure.ceo.role}</div>
            <div className="org-ceo-status">
              <span className="status-dot" style={{
                background: getStatusColor(leaderStatuses['balazs']?.status || 'online')
              }} />
              {' '}{(leaderStatuses['balazs']?.status || 'online').toUpperCase()}
            </div>
          </div>
        )}

        {structure?.cso && (
          <div className="org-ceo" style={{ marginTop: '12px', borderColor: '#8b5cf6' }}>
            <div className="org-ceo-icon">{structure.cso.icon || '🏆'}</div>
            <div className="org-ceo-name">{structure.cso.name}</div>
            <div className="org-ceo-role">{structure.cso.role}</div>
            <div className="org-ceo-status">
              <span className="status-dot" style={{
                background: getStatusColor(leaderStatuses['clawdius']?.status || 'idle')
              }} />
              {' '}{(leaderStatuses['clawdius']?.status || 'idle').toUpperCase()}
            </div>
            {leaderStatuses['clawdius']?.currentTask && (
              <div className="org-ceo-task" style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                {leaderStatuses['clawdius'].currentTask}
              </div>
            )}
          </div>
        )}

        {/* Council */}
        {structure?.advisors && (
          <div className="org-advisors" style={{
            marginTop: '16px',
            background: '#1f2937',
            borderRadius: '12px',
            padding: '16px',
            maxWidth: '500px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              color: '#a855f7',
              fontWeight: 600,
              fontSize: '13px'
            }}>
              <span>{structure.advisors.icon} {structure.advisors.name}</span>
              <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '11px' }}>
                {structure.advisors.schedule}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {structure.advisors.members.map((m: any) => (
                <div key={m.id} style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#374151',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getStatusColor(leaderStatuses[m.id]?.status || 'idle'),
                    display: 'inline-block'
                  }} />
                  <span style={{ color: '#d1d5db' }}>{m.name}</span>
                  <span style={{ color: '#6b7280', fontSize: '11px' }}>{m.focus}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consultant */}
        {structure?.consultant && (
          <div className="org-oracle" style={{
            marginTop: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            background: '#451a03',
            border: '1px solid #78350f',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>{structure.consultant.icon}</span>
            <div>
              <div style={{ fontWeight: 600, color: '#fbbf24' }}>{structure.consultant.name}</div>
              <div style={{ color: '#d97706', fontSize: '12px' }}>{structure.consultant.role}</div>
              <div style={{ color: '#92400e', fontSize: '11px' }}>{structure.consultant.description}</div>
            </div>
          </div>
        )}
      </div>

      {/* — Departments — */}
      <div className="org-grid">
        {structure?.departments?.map((dept: any) => {
          const onlineInDept = dept.agents.filter((a: any) => {
            const s = statuses[a.id]
            return s && (s.status === 'working' || s.status === 'online')
          }).length

          return (
            <div key={dept.id} className="org-card">
              <div className="org-card-header" style={{ borderLeft: `3px solid ${dept.color}` }}>
                <h3>{dept.icon} {dept.name}</h3>
                <span className="org-count-badge">{onlineInDept}/{dept.agents.length}</span>
              </div>
              {dept.agents.map((agent: any) => {
                const s = statuses[agent.id]
                const agentStatus = s?.status || 'offline'
                const agentTask = s?.currentTask || ''
                return (
                  <div key={agent.id} className="org-member">
                    <div className="org-member-avatar" style={{ background: agent.color + '22' }}>
                      {agent.icon}
                    </div>
                    <div className="org-member-info">
                      <div className="org-member-name">{agent.name}</div>
                      <div className="org-member-role-text">{agent.role}</div>
                      {agentTask && (
                        <div className="org-member-task" style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          marginTop: '2px',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {agentTask}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                      <span className="status-indicator" style={{
                        background: getStatusColor(agentStatus),
                        boxShadow: `0 0 6px ${getStatusColor(agentStatus)}44`
                      }} />
                      <span style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>
                        {agentStatus}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* — Footer — */}
      <div className="org-footer">
        <span className="org-footer-item">
          <span className="status-dot" style={{ background: '#10b981' }} /> {countByStatus({...leaderStatuses, ...statuses}, 'working', 'online')} Active
        </span>
        <span className="org-footer-item">
          <span className="status-dot" style={{ background: '#6b7280' }} /> {countByStatus({...leaderStatuses, ...statuses}, 'idle')} Idle
        </span>
        <span className="org-footer-item">
          <span className="status-dot" style={{ background: '#ef4444' }} /> {countByStatus({...leaderStatuses, ...statuses}, 'error')} Error
        </span>
        <span className="org-footer-item">Total: {allTotal}</span>
        <span className="org-footer-item">⚡ {wfCount} workflows</span>
      </div>
    </div>
  )
}

// ====== TOOLS VIEW ======
function ToolsView() {
  const tools = [
    { icon: '📋', name: 'Notes', desc: 'Jegyzetek és feljegyzések' },
    { icon: '🔗', name: 'Linktár', desc: 'Hasznos linkek gyűjteménye' },
    { icon: '📊', name: 'Social', desc: 'Közösségi média analitika' },
    { icon: '💰', name: 'Costs', desc: 'Költségkövetés' },
  ]

  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    const saved = localStorage.getItem('clawdius-dash-notes')
    if (saved) setNotes(saved)
  }, [])

  const saveNotes = () => {
    localStorage.setItem('clawdius-dash-notes', notes)
  }

  const [links] = useState<{name:string,url:string}[]>([
    { name: 'Dashboard', url: 'https://dashboard.mindennapai.eu' },
    { name: 'Assistans', url: 'https://agent.mindennapai.eu' },
    { name: 'n8n', url: 'https://n8n.mindennapai.eu' },
    { name: 'Vercel Projektek', url: 'https://vercel.com/kolbal1993s-projects' },
    { name: 'Notion', url: 'https://www.notion.so' },
  ])

  return (
    <div className="tools-view">
      <div className="section-top">
        <h1 className="section-title">Tools</h1>
        <p className="section-sub">Gyors hozzáférés a napi eszközökhöz</p>
      </div>

      <div className="tools-grid">
        {tools.map(t => (
          <button key={t.name} className={`tool-card ${activeTool === t.name ? 'active' : ''}`} onClick={() => setActiveTool(t.name === activeTool ? null : t.name)}>
            <div className="tool-icon">{t.icon}</div>
            <div className="tool-name">{t.name}</div>
            <div className="tool-desc">{t.desc}</div>
          </button>
        ))}
      </div>

      {activeTool === 'Notes' && (
        <div className="tool-panel">
          <h3>📋 Jegyzetek</h3>
          <textarea className="tool-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Írj jegyzetet..." rows={6} />
          <div className="note-actions">
            <span>{notes.length} karakter</span>
            <button className="tool-btn" onClick={saveNotes}>💾 Mentés</button>
          </div>
        </div>
      )}

      {activeTool === 'Linktár' && (
        <div className="tool-panel">
          <h3>🔗 Linktár</h3>
          {links.map((l, i) => (
            <div key={i} className="link-row">
              <span>{l.name}</span>
              <a href={l.url} target="_blank" rel="noopener noreferrer">{l.url}</a>
            </div>
          ))}
        </div>
      )}

      {activeTool === 'Social' && (
        <div className="tool-panel">
          <h3>📊 Social Analytics</h3>
          <div className="platforms-grid">
            {[
              { name: 'LinkedIn', icon: '💼', color: '#0a66c2', followers: 12, views: 340 },
              { name: 'Facebook', icon: '📘', color: '#1877f2', followers: 8, views: 180 },
              { name: 'Instagram', icon: '📸', color: '#e4405f', followers: 5, views: 290 },
              { name: 'TikTok', icon: '🎵', color: '#000', followers: 0, views: 0 },
              { name: 'YouTube', icon: '▶️', color: '#ff0000', followers: 3, views: 65 },
              { name: 'X/Twitter', icon: '🐦', color: '#1da1f2', followers: 2, views: 45 },
            ].map(p => {
              const maxVal = Math.max(p.views, p.followers * 10, 1)
              return (
                <div key={p.name} className="platform-card-sm">
                  <div className="platform-header-sm" style={{ color: p.color }}>{p.icon} {p.name}</div>
                  <div className="platform-stats-sm">
                    <div><div className="platform-stat-val">{p.followers}</div><div className="platform-stat-lbl">Követők</div></div>
                    <div><div className="platform-stat-val">{p.views}</div><div className="platform-stat-lbl">Megtekintés</div></div>
                  </div>
                  <div className="platform-bar"><div className="platform-bar-fill" style={{ width: `${Math.min((maxVal / 350) * 100, 100)}%`, background: p.color }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTool === 'Costs' && (
        <div className="tool-panel">
          <h3>💰 Költségkövetés</h3>
          <CostDetail />
        </div>
      )}
    </div>
  )
}

// ====== COST DETAIL (with live data) ======
function CostDetail() {
  const [costData, setCostData] = useState({ today: '$0.00', month: '$0.00' })
  const [wfCount, setWfCount] = useState(9)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchCost(), fetchN8nWorkflows()]).then(([c, wf]) => {
      setCostData(c)
      setWfCount(wf)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="empty-state">Loading live data...</div>

  return (
    <>
      <div className="cost-cards">
        <div className="cost-card" style={{ borderTop: '2px solid #3b82f6' }}>
          <div className="cost-value" style={{ color: '#3b82f6' }}>{costData.today}</div>
          <div className="cost-name">DeepSeek AI</div>
          <div className="cost-sub">{costData.month} this month</div>
        </div>
        <div className="cost-card" style={{ borderTop: '2px solid #8b5cf6' }}>
          <div className="cost-value" style={{ color: '#8b5cf6' }}>${wfCount * 0}</div>
          <div className="cost-name">Vercel</div>
          <div className="cost-sub">free tier</div>
        </div>
        <div className="cost-card" style={{ borderTop: '2px solid #10b981' }}>
          <div className="cost-value" style={{ color: '#10b981' }}>€12</div>
          <div className="cost-name">Hostinger VPS</div>
          <div className="cost-sub">monthly</div>
        </div>
        <div className="cost-card" style={{ borderTop: '2px solid #f59e0b' }}>
          <div className="cost-value" style={{ color: '#f59e0b' }}>~€12/mo</div>
          <div className="cost-name">Total Monthly</div>
          <div className="cost-sub">± AI API usage</div>
        </div>
      </div>
    </>
  )
}

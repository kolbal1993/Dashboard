import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react'
import type { Task, ChatMessage, AgentName } from './types'
import { agents, defaultTasks, defaultChat, getAgent } from './data'
import IdeasPage from './pages/IdeasPage'
import YouTubeSummariesPage from './pages/YouTubeSummariesPage'
import CommandCenter from './pages/CommandCenter'
import KanbanPage from './pages/KanbanPage'
import KnowledgePage from './pages/KnowledgePage'
import ChatPage from './pages/ChatPage'
import SystemsPage from './pages/SystemsPage'
import { SettingsPage } from './pages/SettingsPage'
import MissionControlPage from './pages/MissionControlPage'
import FinancePage from './pages/FinancePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import { Calendar } from './calendar'
import { AuthProvider, useAuth } from './auth/AuthContext'

interface ThemeState {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  chatMessages: ChatMessage[]
  addChat: (msg: ChatMessage) => void
  selectedTask: Task | null
  setSelectedTask: (t: Task | null) => void
}

type Tab = 'monitor' | 'tasks' | 'projektek' | 'chat' | 'finance' | 'ideas' | 'youtube' | 'knowledge' | 'systems' | 'mission' | 'calendar' | 'settings' | 'profile'
const Theme = createContext<ThemeState>(null!)
export function useApp() { return useContext(Theme) }

// ====== API HELPERS ======
const API_BASE = ''

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
    const r = await fetch('/api/n8n/workflows', { signal: AbortSignal.timeout(3000) })
    const d = await r.json()
    return d.count || 0
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
    const r = await fetch('/api/n8n/executions', { signal: AbortSignal.timeout(3000) })
    const d = await r.json()
    return d.count || 0
  } catch { return 0 }
}

// ====== HERMES API ======
interface HermesStatus {
  online: boolean; model: string; provider: string; session_id: string;
  started_at: string; message_count: number; tool_call_count: number;
  total_sessions: number; today_sessions: number; title: string;
}
interface HermesCosts {
  today: { cost_usd: number; input_tokens: number; output_tokens: number; sessions: number };
  this_month: { cost_usd: number; input_tokens: number; output_tokens: number; sessions: number };
  all_time: { cost_usd: number; input_tokens: number; output_tokens: number; sessions: number; cache_read_tokens?: number; cache_write_tokens?: number; reasoning_tokens?: number };
  model_breakdown: any[];
  monthly_history: any[];
}
interface HermesSystem {
  cpu?: { load_1m: number; load_5m: number; load_15m: number };
  memory?: { total_bytes: number; used_bytes: number; free_bytes: number; used_pct: number };
  disk?: { total: string; used: string; free: string; used_pct: string };
  uptime?: string; processes?: number;
  docker_services?: string[][]; pm2_services?: { name: string; status: string }[];
}

async function fetchHermesStatus(): Promise<HermesStatus | null> {
  try {
    const r = await fetch('/api/hermes/status', { signal: AbortSignal.timeout(3000) })
    return await r.json()
  } catch { return null }
}
async function fetchHermesCosts(): Promise<HermesCosts | null> {
  try {
    const r = await fetch('/api/hermes/costs', { signal: AbortSignal.timeout(3000) })
    return await r.json()
  } catch { return null }
}
async function fetchHermesSystem(): Promise<HermesSystem | null> {
  try {
    const r = await fetch('/api/hermes/system', { signal: AbortSignal.timeout(3000) })
    return await r.json()
  } catch { return null }
}
async function fetchHermesSessions(limit = 10): Promise<any[] | null> {
  try {
    const r = await fetch(`/api/hermes/sessions?limit=${limit}`, { signal: AbortSignal.timeout(3000) })
    return await r.json()
  } catch { return null }
}

// ====== BOOKING FETCH ======
async function fetchBookingStats(): Promise<any> {
  try {
    const r = await fetch('/api/booking/stats', { signal: AbortSignal.timeout(3000) })
    return await r.json()
  } catch { return null }
}
async function fetchBookingSettings(): Promise<any> {
  try {
    const r = await fetch('/api/booking/settings', { signal: AbortSignal.timeout(4000) })
    return await r.json()
  } catch { return null }
}
async function fetchBookings(params: Record<string,string> = {}): Promise<any[]> {
  try {
    const qs = new URLSearchParams(params).toString()
    const r = await fetch(`/api/booking/bookings?${qs}`, { signal: AbortSignal.timeout(4000) })
    return await r.json()
  } catch { return [] }
}
async function saveBookingCompany(data: any): Promise<boolean> {
  try {
    const r = await fetch('/api/booking/company', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
    const d = await r.json()
    return d.success
  } catch { return false }
}
async function saveBookingService(id: string, data: any): Promise<boolean> {
  try {
    const r = await fetch(`/api/booking/services/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
    const d = await r.json()
    return d.success
  } catch { return false }
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
  const { user, isLoggedIn, login, logout } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>(defaultTasks)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(defaultChat)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [tab, setTab] = useState<Tab>('monitor')
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMsgs, setChatMsgs] = useState<{role:'user'|'assistant', content:string}[]>([])
  const [chatUnread, setChatUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Theme state (global, shares 'cal-theme' localStorage key with calendar)
  const [theme, setTheme] = useState(() => localStorage.getItem('cal-theme') || 'dark')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('cal-theme', theme)
  }, [theme])

  // Effect must be BEFORE conditional returns (React hooks rule)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs])

  // Listen for unread count updates from ChatPage
  useEffect(() => {
    const handler = (e: CustomEvent) => { if (e.detail?.count !== undefined) setChatUnread(e.detail.count) }
    window.addEventListener('chat-unread' as any, handler as any)
    // Check localStorage on mount
    try { const v = localStorage.getItem('chat-unread'); if (v) setChatUnread(parseInt(v)) } catch {}
    // Poll localStorage
    const interval = setInterval(() => {
      try { const v = localStorage.getItem('chat-unread'); if (v) setChatUnread(prev => parseInt(v) || prev) } catch {}
    }, 2000)
    return () => { window.removeEventListener('chat-unread' as any, handler as any); clearInterval(interval) }
  }, [])

  // Error boundary
  if (error) return <div style={{padding:40,color:'#ef4444',background:'#0d0d0d',minHeight:'100vh'}}><h2>❌ Error</h2><pre style={{whiteSpace:'pre-wrap',marginTop:16,color:'#ccc',fontSize:13}}>{error}</pre><button onClick={() => {localStorage.clear();location.reload()}} style={{marginTop:16,padding:'8px 16px',background:'#ef4444',color:'#fff',border:'none',borderRadius:6,cursor:'pointer'}}>Reset & Reload</button></div>

  if (!isLoggedIn) return <LoginPage onLogin={(email, pass) => login(email, pass)} />

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
      case 'monitor': return <CommandCenter />
      case 'tasks': return <KanbanPage />
      case 'projektek': return <ProjektekView />
      case 'chat': return <ChatPage />
      case 'finance': return <FinancePage />
      case 'ideas': return <IdeasPage />
      case 'youtube': return <YouTubeSummariesPage />
      case 'knowledge': return <KnowledgePage />
      case 'systems': return <SystemsPage />
      case 'mission': return <MissionControlPage />
      case 'calendar': return <Calendar />
      case 'profile': return <ProfilePage />
      case 'settings': return <SettingsPage onTabChange={(t: string) => setTab(t as Tab)} />
    }
  }

  return (
    <Theme.Provider value={{ tasks, setTasks, chatMessages, addChat, selectedTask, setSelectedTask }}>
      <div className="app">
        <nav className="top-nav">
          <div className="nav-brand" onClick={() => setTab('monitor')}>
            <span className="nav-brand-icon">🏆</span>
            <span className="nav-brand-text">Clawdius</span>
          </div>
          <div className="nav-tabs">
            <button className={`nav-tab ${tab==='monitor'?'active':''}`} onClick={() => setTab('monitor')}><span>🏆</span> COMMAND</button>
            <button className={`nav-tab ${tab==='tasks'?'active':''}`} onClick={() => setTab('tasks')}><span>📋</span> KANBAN</button>
            <button className={`nav-tab ${tab==='projektek'?'active':''}`} onClick={() => setTab('projektek')}><span>📁</span> PROJEKTEK</button>
            <button className={`nav-tab ${tab==='chat'?'active':''}`} onClick={() => { setTab('chat'); setChatUnread(0); localStorage.setItem('chat-unread', '0') }} style={{position:'relative'}}>
              <span>💬</span> CHAT
              {chatUnread > 0 && (
                <span style={{
                  position:'absolute', top:4, right:6,
                  background:'#ef4444', color:'#fff', fontSize:9, fontWeight:700,
                  borderRadius:10, padding:'1px 5px', lineHeight:1.3,
                  boxShadow:'0 1px 3px rgba(0,0,0,0.4)',
                }}>{chatUnread > 9 ? '9+' : chatUnread}</span>
              )}
            </button>
            <button className={`nav-tab ${tab==='finance'?'active':''}`} onClick={() => setTab('finance')}><span>💰</span> FINANCE</button>
            <button className={`nav-tab ${tab==='ideas'?'active':''}`} onClick={() => setTab('ideas')}><span>💡</span> IDEAS</button>
            <button className={`nav-tab ${tab==='youtube'?'active':''}`} onClick={() => setTab('youtube')}><span>🎬</span> YT</button>
            <button className={`nav-tab ${tab==='knowledge'?'active':''}`} onClick={() => setTab('knowledge')}><span>🧠</span> KNOWLEDGE</button>
            <button className={`nav-tab ${tab==='systems'?'active':''}`} onClick={() => setTab('systems')}><span>📊</span> SYSTEMS</button>
            <button className={`nav-tab ${tab==='mission'?'active':''}`} onClick={() => setTab('mission')}><span>🎯</span> MISSION</button>
            <button className={`nav-tab ${tab==='calendar'?'active':''}`} onClick={() => setTab('calendar')}><span>📅</span> NAPTÁR</button>
            <button className={`nav-tab ${tab==='profile'?'active':''}`} onClick={() => setTab('profile')}><span>🧑</span> PROFILE</button>
            <button className={`nav-tab ${tab==='settings'?'active':''}`} onClick={() => setTab('settings')}><span>⚙️</span> SETTINGS</button>
          </div>
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{
              marginTop: 'auto',
              padding: '8px 12px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: 'var(--text2)',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              textAlign: 'left',
              borderTop: '1px solid var(--border)',
              letterSpacing: '0.3px',
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Világos' : 'Sötét'}
          </button>
          <div className="nav-status">
            <div className="nav-status-row">
              <span className="status-dot online" />
              <span className="nav-status-text">Online</span>
            </div>
            {user && (
              <div className="nav-user">
                <div className="nav-user-avatar">{user.name?.charAt(0) || '?'}</div>
                <span className="nav-user-name">{user.email?.split('@')[0]}</span>
                <button onClick={logout} className="nav-user-logout" title="Kijelentkezés">🚪</button>
              </div>
            )}
          </div>
        </nav>

        <main className="main-content">
          {(() => {
            try {
              return renderContent()
            } catch(e: any) {
              setError(String(e?.stack || e?.message || e))
              return null
            }
          })()}
        </main>

        {/* ═══ FLOATING "JEGYEZD MEG" BUTTON ═══ */}
        <div className="save-float" onClick={() => {
          const category = prompt('Kategória (pl. communication, development, business):') || ''
          const key = prompt('Kulcs (pl. language, style, stack):') || ''
          const value = prompt('Érték (pl. magyar, közvetlen, Flask):') || ''
          if (category && key && value) {
            fetch('http://localhost:3015/api/preferences', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({category, key, value, confidence: 0.7, evidence: 'Manuálisan mentve a dashboardról'})
            }).then(r => r.json()).then(d => {
              if (d.status === 'ok') alert('✅ Preferencia elmentve!')
            }).catch(() => alert('❌ Hiba a mentéskor'))
          }
        }} title="Jegyezd meg rólam">
          <span>📝</span>
        </div>

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

  const [links] = useState<{icon:string,name:string,url:string}[]>([
    { icon: '🤖', name: 'Clawdius Agent', url: 'https://clawdius.mindennapai.eu' },
    { icon: '📊', name: 'Dashboard', url: 'https://dashboard.mindennapai.eu' },
    { icon: '📅', name: 'Booking', url: 'https://booking.mindennapai.eu' },
    { icon: '⚡', name: 'n8n', url: 'https://n8n.mindennapai.eu' },
    { icon: '💬', name: 'Assistans', url: 'https://agent.mindennapai.eu' },
    { icon: '🚀', name: 'Vercel Projektek', url: 'https://vercel.com/kolbal1993s-projects' },
    { icon: '📓', name: 'Notion', url: 'https://www.notion.so' },
    { icon: '🤖', name: 'Hermes', url: 'https://89.167.74.30:8445' },
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

// ====== HERMES VIEW ======
function HermesView() {
  const [status, setStatus] = useState<HermesStatus | null>(null)
  const [costs, setCosts] = useState<HermesCosts | null>(null)
  const [system, setSystem] = useState<HermesSystem | null>(null)
  const [sessions, setSessions] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState('')

  const loadAll = useCallback(async () => {
    setSyncing(true)
    const now = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const [s, c, sys, sess] = await Promise.all([
      fetchHermesStatus(),
      fetchHermesCosts(),
      fetchHermesSystem(),
      fetchHermesSessions(8),
    ])
    if (s) setStatus(s)
    if (c) setCosts(c)
    if (sys) setSystem(sys)
    if (sess) setSessions(sess)
    setLastSync(now)
    setSyncing(false)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  function fmtUsd(v: number) {
    if (v === 0) return '$0.00'
    if (v < 0.01) return `$${(v * 100).toFixed(2)}¢`
    return `$${v.toFixed(2)}`
  }

  function fmtBytes(b: number) {
    if (b > 1073741824) return `${(b / 1073741824).toFixed(1)} GB`
    if (b > 1048576) return `${(b / 1048576).toFixed(1)} MB`
    return `${(b / 1024).toFixed(1)} KB`
  }

  if (loading) {
    return (
      <div className="dashboard-view">
        <div className="section-top"><div><h1 className="section-title">🤖 Hermes Agent</h1><p className="section-sub">Betöltés...</p></div></div>
        <div className="empty-state" style={{ padding: 60, textAlign: 'center' }}><div style={{ fontSize: 48 }}>🔄</div><div>Kapcsolódás a Hermes API-hoz...</div></div>
      </div>
    )
  }

  return (
    <div className="dashboard-view">
      <div className="section-top">
        <div>
          <h1 className="section-title">🤖 Hermes Agent</h1>
          <p className="section-sub">
            {status?.online ? '🟢 Online' : '🔴 Offline'} · {status?.model || '?'}
            {lastSync && ` · last sync: ${lastSync}`}
          </p>
        </div>
        <div className="sync-badge" onClick={loadAll} style={{ opacity: syncing ? 0.5 : 1, cursor: 'pointer' }}>
          {syncing ? '🔄 Syncing...' : '🔄 Sync'}
        </div>
      </div>

      {/* Status cards */}
      <div className="metrics-row">
        <div className="metric-card" style={{ borderTop: '2px solid #8b5cf6' }}>
          <div className="metric-val" style={{ color: '#8b5cf6' }}>{status?.model?.split('/').pop() || '?'}</div>
          <div className="metric-lbl">Model</div>
          <div className="metric-sub">via {status?.provider || '?'}</div>
        </div>
        <div className="metric-card" style={{ borderTop: '2px solid #3b82f6' }}>
          <div className="metric-val" style={{ color: '#3b82f6' }}>{status?.total_sessions || 0}</div>
          <div className="metric-lbl">Total Sessions</div>
          <div className="metric-sub">{status?.today_sessions || 0} today</div>
        </div>
        <div className="metric-card" style={{ borderTop: '2px solid #10b981' }}>
          <div className="metric-val" style={{ color: '#10b981' }}>{status?.message_count || 0}</div>
          <div className="metric-lbl">Messages</div>
          <div className="metric-sub">{status?.tool_call_count || 0} tool calls</div>
        </div>
        <div className="metric-card" style={{ borderTop: '2px solid #f59e0b' }}>
          <div className="metric-val" style={{ color: '#f59e0b' }}>{fmtUsd(costs?.today?.cost_usd || 0)}</div>
          <div className="metric-lbl">Cost Today</div>
          <div className="metric-sub">{fmtUsd(costs?.this_month?.cost_usd || 0)} this month</div>
        </div>
      </div>

      {/* Two columns */}
      <div className="dashboard-grid">
        {/* LEFT: Cost + System */}
        <div className="panel">
          <div className="panel-header">
            <h3>💰 Cost Breakdown</h3>
            <span className="panel-badge">all time: {fmtUsd(costs?.all_time?.cost_usd || 0)}</span>
          </div>
          <div className="team-list">
            <div className="team-row">
              <span className="team-icon" style={{ background: '#8b5cf622' }}>📊</span>
              <div className="team-info">
                <span className="team-name">Today</span>
                <span className="team-role">{fmtUsd(costs?.today?.cost_usd || 0)} · {costs?.today?.input_tokens?.toLocaleString() || 0} in · {costs?.today?.output_tokens?.toLocaleString() || 0} out</span>
              </div>
            </div>
            <div className="team-row">
              <span className="team-icon" style={{ background: '#3b82f622' }}>📅</span>
              <div className="team-info">
                <span className="team-name">This Month</span>
                <span className="team-role">{fmtUsd(costs?.this_month?.cost_usd || 0)} · {costs?.this_month?.sessions || 0} sessions</span>
              </div>
            </div>
            <div className="team-row">
              <span className="team-icon" style={{ background: '#10b98122' }}>📈</span>
              <div className="team-info">
                <span className="team-name">All Time</span>
                <span className="team-role">{fmtUsd(costs?.all_time?.cost_usd || 0)} · {costs?.all_time?.sessions || 0} sessions</span>
              </div>
            </div>
            <div className="team-row">
              <span className="team-icon" style={{ background: '#f59e0b22' }}>🔤</span>
              <div className="team-info">
                <span className="team-name">Total Tokens</span>
                <span className="team-role">{(costs?.all_time?.input_tokens || 0).toLocaleString()} in · {(costs?.all_time?.output_tokens || 0).toLocaleString()} out</span>
              </div>
            </div>
            {(costs?.all_time?.cache_read_tokens || 0) > 0 && (
              <div className="team-row">
                <span className="team-icon" style={{ background: '#06b6d422' }}>💾</span>
                <div className="team-info">
                  <span className="team-name">Cache</span>
                  <span className="team-role">{(costs?.all_time?.cache_read_tokens || 0).toLocaleString()} read · {(costs?.all_time?.cache_write_tokens || 0).toLocaleString()} write</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="panel-header">
              <h3>🖥️ System</h3>
            </div>
            <div className="team-list">
              {system?.cpu && (
                <div className="team-row">
                  <span className="team-icon" style={{ background: '#ef444422' }}>⚡</span>
                  <div className="team-info">
                    <span className="team-name">CPU Load</span>
                    <span className="team-role">{system.cpu.load_1m} / {system.cpu.load_5m} / {system.cpu.load_15m}</span>
                  </div>
                </div>
              )}
              {system?.memory && (
                <div className="team-row">
                  <span className="team-icon" style={{ background: '#3b82f622' }}>🧠</span>
                  <div className="team-info">
                    <span className="team-name">Memory</span>
                    <span className="team-role">{fmtBytes(system.memory.used_bytes)} / {fmtBytes(system.memory.total_bytes)} ({system.memory.used_pct}%)</span>
                  </div>
                </div>
              )}
              {system?.disk && (
                <div className="team-row">
                  <span className="team-icon" style={{ background: '#10b98122' }}>💾</span>
                  <div className="team-info">
                    <span className="team-name">Disk</span>
                    <span className="team-role">{system.disk.used} / {system.disk.total} ({system.disk.used_pct})</span>
                  </div>
                </div>
              )}
              {system?.uptime && (
                <div className="team-row">
                  <span className="team-icon" style={{ background: '#f59e0b22' }}>⏱️</span>
                  <div className="team-info">
                    <span className="team-name">Uptime</span>
                    <span className="team-role">{system.uptime}</span>
                  </div>
                </div>
              )}
              {system?.processes && (
                <div className="team-row">
                  <span className="team-icon" style={{ background: '#6b728022' }}>🔧</span>
                  <div className="team-info">
                    <span className="team-name">Processes</span>
                    <span className="team-role">{system.processes}</span>
                  </div>
                </div>
              )}
              {system?.docker_services && system.docker_services.length > 0 && (
                <div className="team-row">
                  <span className="team-icon" style={{ background: '#06b6d422' }}>🐳</span>
                  <div className="team-info">
                    <span className="team-name">Docker</span>
                    <span className="team-role">{system.docker_services.map(s => s[0] || '').filter(Boolean).join(', ')}</span>
                  </div>
                </div>
              )}
              {system?.pm2_services && system.pm2_services.length > 0 && (
                <div className="team-row">
                  <span className="team-icon" style={{ background: '#a855f722' }}>📋</span>
                  <div className="team-info">
                    <span className="team-name">PM2</span>
                    <span className="team-role">{system.pm2_services.filter(s => s.status === 'online').length}/{system.pm2_services.length} online</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Recent Sessions */}
        <div className="panel">
          <div className="panel-header">
            <h3>📋 Recent Sessions</h3>
            <span className="panel-badge">{sessions?.length || 0} latest</span>
          </div>
          <div className="team-list">
            {sessions && sessions.length > 0 ? sessions.map((s, i) => (
              <div key={s.id || i} className="team-row" style={{ borderLeft: `3px solid ${s.source === 'telegram' ? '#3b82f6' : s.source === 'api_server' ? '#10b981' : '#8b5cf6'}` }}>
                <div className="team-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="team-name" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.source === 'telegram' ? '✈️' : s.source === 'api_server' ? '🔗' : '💻'} {s.title || s.id?.slice(0, 20) || 'session'} 
                  </div>
                  <div className="team-role" style={{ fontSize: 11 }}>
                    {s.model || '?'} · {s.message_count || 0} msg · {(s.input_tokens || 0).toLocaleString()} tok
                  </div>
                  <div className="team-role" style={{ fontSize: 10, color: '#6b7280' }}>
                    {s.started_at ? new Date(s.started_at).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }) : '?'} · ${(s.estimated_cost || 0).toFixed(4)}
                  </div>
                </div>
              </div>
            )) : (
              <div className="empty-state">No sessions found</div>
            )}
          </div>
        </div>
      </div>
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

// ====== PROJEKTEK VIEW ======
function ProjektekView() {
  const [selected, setSelected] = useState<string | null>(null)
  const [projectCosts, setProjectCosts] = useState<Record<string, any> | null>(null)

  // Fetch real project costs from the API
  useEffect(() => {
    fetch('/api/projects', { signal: AbortSignal.timeout(5000) })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.projects && setProjectCosts(d.projects))
      .catch(() => {})
  }, [])

  // Map project IDs to project-costs API names
  const costMap: Record<string, string> = {
    filtranova: 'Chatbot Widget',
    booking: 'Clawdius Booking',
    clawdius: 'Clawdius Dashboard',
  }

  function getCosts(projId: string) {
    const apiName = costMap[projId]
    return apiName && projectCosts?.[apiName] ? projectCosts[apiName] : null
  }

  const projects = [
    {
      id: 'filtranova', name: 'FILTRANOVA', icon: '💧',
      desc: 'Víztisztító cég weboldal + chatbot',
      devCost: '€1,200', runCost: '€24/mo',
      liveData: { type: 'filtranova' as const },
      links: [
        { icon: '🌐', label: 'Weboldal', url: 'https://filtranova.mindennapai.eu' },
        { icon: '📊', label: 'Admin', url: 'https://filtranova.mindennapai.eu/admin' },
        { icon: '🤖', label: 'Chatbot API', url: 'http://localhost:3004' },
      ],
      stats: { docs: 26, chats: '>100', languages: 3 },
      dashboard: {
        '📄 Dokumentumok': [
          { label: 'EN', value: '11', sub: 'angol' },
          { label: 'HU', value: '10', sub: 'magyar' },
          { label: 'SK', value: '5', sub: 'szlovák' },
        ],
        '🏷️ Kategóriák': [
          { label: 'Termékek', value: '14' },
          { label: 'FAQ', value: '4' },
          { label: 'Cég', value: '5' },
          { label: 'Szolgáltatás', value: '3' },
        ],
        '🤖 Chatbot': [
          { label: 'Válaszidő', value: '<1s' },
          { label: 'Modell', value: 'DeepSeek V4' },
          { label: 'Nyelvek', value: '3 (SK/HU/EN)' },
        ],
      },
    },
    {
      id: 'booking', name: 'Booking Rendszer', icon: '📅',
      desc: 'Online foglalási rendszer (ProGumi)',
      devCost: '€800', runCost: '€12/mo',
      liveData: { type: 'booking' as const },
      links: [
        { icon: '🌐', label: 'Foglalás oldal', url: 'https://booking.mindennapai.eu' },
        { icon: '📊', label: 'Admin', url: 'https://dashboard.mindennapai.eu' },
      ],
      stats: { bookings: '1', services: 9, dbSize: 'SQLite' },
      dashboard: {
        '📊 Foglalások': [
          { label: 'Összes', value: '1' },
          { label: 'Ebben a hónapban', value: '1' },
          { label: 'Lemondva', value: '0' },
        ],
        '🛠️ Szolgáltatások': [
          { label: 'Aktív', value: '9' },
          { label: 'ProGumi', value: '6' },
          { label: 'Egyéb', value: '3' },
        ],
        '📅 Naptár': [
          { label: 'Google Sync', value: '✅' },
          { label: 'Cég', value: 'ProGumi' },
          { label: 'Adatbázis', value: 'SQLite' },
        ],
      },
    },
    {
      id: 'xulinalex', name: 'XulinaleX', icon: '🎵',
      desc: 'Zenei release management',
      devCost: '€600', runCost: '€0/mo (Vercel)',
      links: [
        { icon: '🌐', label: 'Release Manager', url: 'https://xulinalex.mindennapai.eu' },
      ],
      stats: { tracks: '0', releases: 0, platforms: 2 },
      dashboard: {
        '🎵 Tracks': [
          { label: 'Feltöltve', value: '0' },
          { label: 'Feldolgozás alatt', value: '0' },
        ],
        '📀 Releases': [
          { label: 'Megjelent', value: '0' },
          { label: 'Tervezett', value: '0' },
        ],
        '🔊 Platformok': [
          { label: 'Spotify', value: '❌' },
          { label: 'Apple Music', value: '❌' },
        ],
      },
    },
    {
      id: 'clawdius', name: 'Clawdius Platform', icon: '🏆',
      desc: 'AI agent platform & dashboard',
      devCost: '€2,400', runCost: '€0/mo (Vercel)',
      links: [
        { icon: '🌐', label: 'Dashboard', url: 'https://dashboard.mindennapai.eu' },
        { icon: '🌐', label: 'Landing', url: 'https://clawdius-landing-v2.vercel.app' },
        { icon: '🤖', label: 'Hermes API', url: 'http://localhost:8642' },
        { icon: '📁', label: 'GitHub', url: 'https://github.com/kolbal1993/Dashboard' },
      ],
      stats: { agents: 8, workflows: '9', uptime: '99.9%' },
      dashboard: {
        '🤖 AI Agentek': [
          { label: 'Online', value: '6' },
          { label: 'Idle', value: '2' },
          { label: 'Összesen', value: '8' },
        ],
        '⚡ n8n Workflowok': [
          { label: 'Aktív', value: '9' },
          { label: 'Sikertelen', value: '0' },
        ],
        '🖥️ Infrastruktúra': [
          { label: 'Vercel', value: '✅' },
          { label: 'VPS (Hetzner)', value: '✅' },
          { label: 'Open WebUI', value: '✅' },
        ],
      },
    },
    {
      id: 'mindennapai', name: 'mindennapai.eu', icon: '🌐',
      desc: 'Fő portál — kurzusok, tudástár',
      devCost: '€900', runCost: '€0/mo (Vercel)',
      links: [
        { icon: '🌐', label: 'Weboldal', url: 'https://www.mindennapai.eu' },
      ],
      stats: { courses: 7, articles: '24', visitors: '340' },
      dashboard: {
        '📚 Tartalom': [
          { label: 'Kurzusok', value: '7' },
          { label: 'Cikkek', value: '24' },
          { label: 'Videók', value: '12' },
        ],
        '📊 Látogatottság': [
          { label: 'Havi', value: '~340' },
          { label: 'Napi', value: '~11' },
        ],
        '🔗 Domain': [
          { label: 'Hostinger', value: '✅' },
          { label: 'Vercel', value: '✅' },
        ],
      },
    },
    {
      id: 'mindmate', name: 'MindMate', icon: '🧠',
      desc: 'Multi-Agent Mastermind Chat platform',
      devCost: '€0 (terv)', runCost: '€0/mo (MVP)',
      liveData: { type: 'mindmate' as const },
      links: [
        { icon: '📋', label: 'Terv (PLAN.md)', url: 'https://github.com/kolbal1993/Dashboard' },
      ],
      stats: { bots: '3 seed', phases: '9', tasks: '65' },
      dashboard: {
        '🤖 Botok': [
          { label: 'Marketing Miti', value: '📈' },
          { label: 'Tech Tomi', value: '💻' },
          { label: 'Üzleti Béla', value: '💼' },
        ],
        '📐 Fázisok': [
          { label: 'Kész', value: '0/9' },
          { label: 'Státusz', value: 'Terv' },
          { label: 'Feladatok', value: '65' },
        ],
        '🛠️ Stack': [
          { label: 'Frontend', value: 'Next.js' },
          { label: 'Backend', value: 'FastAPI' },
          { label: 'DB', value: 'pgvector' },
        ],
      },
    },
    {
      id: 'hermes-hosting', name: 'Hermes Hosting', icon: '🚀',
      desc: 'Hostinger for AI agents — 1-click Hermes Agent deployment',
      devCost: '€0 (meglévő eszközök)', runCost: '€30.91/mo (CCX23)',
      liveData: { type: 'hermes-hosting' as const },
      links: [
        { icon: '🌐', label: 'Landing', url: 'https://bot.mindennapai.eu' },
        { icon: '🔧', label: 'Admin', url: 'https://admin.mindennapai.eu' },
        { icon: '📋', label: 'Terv (PLAN.md)', url: 'https://github.com/kolbal1993/Dashboard' },
      ],
      stats: { clients: '0', agents: '0', mrr: '€0/mo' },
      dashboard: {
        '🚀 Hosting': [
          { label: 'Ügyfelek', value: '0' },
          { label: 'Aktív agentek', value: '0' },
          { label: 'MRR', value: '€0/mo' },
          { label: 'Terv', value: '✅' },
        ],
      },
    },
    {
      id: 'aimatchr', name: 'AIMatchr', icon: '💖',
      desc: 'AI dating app — deep compatibility matching',
      devCost: '€1,200', runCost: '€12/mo (VPS)',
      links: [
        { icon: '🌐', label: 'API', url: 'http://89.167.74.30:3020' },
        { icon: '📁', label: 'Projekt', url: 'https://github.com/kolbal1993/AIMatchr' },
      ],
      stats: { phases: '3/6', tasks: '12/26', db: 'PostgreSQL' },
      dashboard: {
        '📊 Fejlesztés': [
          { label: 'Phase 1-3', value: '✅ Kész' },
          { label: 'Phase 4 (Matching)', value: '⬜' },
          { label: 'Phase 5 (Chat)', value: '⬜' },
          { label: 'Phase 6 (Frontend)', value: '⬜' },
        ],
        '🔧 Stack': [
          { label: 'Backend', value: 'Flask' },
          { label: 'DB', value: 'PostgreSQL' },
          { label: 'Vektor DB', value: 'ChromaDB' },
          { label: 'AI', value: 'DeepSeek V4' },
        ],
        '💎 Monetizáció': [
          { label: 'AIMatchr', value: '€9.99/hó' },
          { label: 'DateMate bundle', value: '€12.99/hó' },
        ],
      },
    },
    {
      id: 'datemate', name: 'DateMate Passport', icon: '🛂',
      desc: 'Cross-platform dating profile export tool',
      devCost: '€400', runCost: '€0/mo (AIMatchr infra)',
      links: [
        { icon: '💖', label: 'Része', url: 'https://dashboard.mindennapai.eu' },
      ],
      stats: { status: 'Terv', bundle: '€12.99', standalone: '€6.99' },
      dashboard: {
        '📊 Státusz': [
          { label: 'Fejlesztés', value: 'Tervezés' },
          { label: 'AIMatchr bundle', value: '€12.99/hó' },
          { label: 'Önálló', value: '€6.99/hó' },
        ],
      },
    },
    {
      id: 'brandmate', name: 'BrandMate', icon: '🏷️',
      desc: 'AI brand name generator + platform availability checker',
      devCost: '€600', runCost: '€0/mo (MVP)',
      links: [
        { icon: '💡', label: 'Ötlet', url: 'https://dashboard.mindennapai.eu' },
      ],
      stats: { status: 'Ötlet', platforms: '8', concept: '✅' },
      dashboard: {
        '📊 Státusz': [
          { label: 'Fejlesztés', value: 'Ötletfázis' },
          { label: 'Platform ellenőrzés', value: '8 platform' },
          { label: 'AI modell', value: 'DeepSeek V4' },
        ],
      },
    },
    {
      id: 'agent-stack-builder', name: 'Agent Stack Builder', icon: '🧩',
      desc: 'Többagentű AI workflow építő platform — pre-built Hermes skillekből AI csapat',
      devCost: '€0 (terv)', runCost: '€0/mo (MVP)',
      links: [
        { icon: '📋', label: 'Terv', url: 'https://dashboard.mindennapai.eu' },
      ],
      stats: { stacks: '6 pre-built', árazás: '€49-299/hó', állapot: 'Tervezés' },
      dashboard: {
        '🧩 Stack-ek': [
          { label: 'Social Media Manager', value: '€49/hó' },
          { label: 'SEO Growth Stack', value: '€79/hó' },
          { label: 'Sales Funnel', value: '€99/hó' },
          { label: 'Content Factory', value: '€79/hó' },
          { label: 'Agency Ops', value: '€149/hó' },
          { label: 'Custom', value: '€199/hó' },
        ],
        '📐 Fázisok': [
          { label: '1. Landing + Stripe', value: '✅ Terv' },
          { label: '2. Builder MVP', value: '⬜' },
          { label: '3. Monitoring', value: '⬜' },
          { label: '4. Skálázás', value: '⬜' },
        ],
        '💎 Üzleti modell': [
          { label: 'Single Stack', value: '€49/hó' },
          { label: 'Multi Stack', value: '€99/hó' },
          { label: 'Agency', value: '€199/hó' },
          { label: 'Break-even', value: '1 ügyfél' },
        ],
      },
    },
  ]

  const proj = projects.find(p => p.id === selected)

  return (
    <div className="projektek-page">
      <div className="section-top">
        <div>
          <h1 className="section-title">📁 Projektek</h1>
          <p className="section-sub">{projects.length} aktív projekt · összes fejlesztési költség: €8,100</p>
        </div>
      </div>

      <div className="projektek-grid">
        {projects.map(p => (
          <div key={p.id} className="projekt-card" onClick={() => setSelected(p.id)}>
            <div className="projekt-card-header">
              <span className="projekt-icon">{p.icon}</span>
              <div>
                <div className="projekt-name">{p.name}</div>
                <div className="projekt-desc">{p.desc}</div>
              </div>
            </div>
            <div className="projekt-costs">
              <div className="projekt-cost-item">
                <span className="projekt-cost-lbl">Fejlesztés</span>
                <span className="projekt-cost-val dev">{p.devCost}</span>
              </div>
              <div className="projekt-cost-item">
                <span className="projekt-cost-lbl">Futtatás/hó</span>
                <span className="projekt-cost-val run">{p.runCost}</span>
              </div>
            </div>
            <div className="projekt-stats-row">
              {Object.entries(p.stats).map(([k, v]) => (
                <div key={k} className="projekt-stat">
                  <span className="projekt-stat-val">{v}</span>
                  <span className="projekt-stat-lbl">{k}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Full-page modal — all-in-one */}
      {proj && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal projekt-modal-full" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><span style={{ marginRight: 8 }}>{proj.icon}</span>{proj.name}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p className="modal-desc">{proj.desc}</p>

              {/* === PÉNZÜGYEK SECTION === */}
              <div className="projekt-full-section">
                <div className="projekt-full-section-title">💰 Pénzügyek</div>
                <div className="projekt-full-cash-grid">
                  {/* Real costs from API */}
                  {(() => {
                    const c = getCosts(proj.id);
                    const hasReal = c && (c.spent_eur > 0 || c.hours_logged > 0 || c.token_cost > 0);
                    return (<>
                      <div className="projekt-full-cash-card real">
                        <div className="projekt-full-cash-lbl">Ténylegesen elköltve</div>
                        <div className="projekt-full-cash-val" style={{ color: '#60a5fa' }}>
                          {c ? `€${c.spent_eur?.toFixed(0) || 0}` : '⏳'}
                        </div>
                        {hasReal && (
                          <div className="projekt-full-cash-sub">
                            ﹢€{Math.max(0, (c.spent_eur - c.token_cost)).toFixed(0)} munka
                            {c.token_cost > 0 && <> + €{c.token_cost.toFixed(2)} token</>}
                          </div>
                        )}
                      </div>
                      <div className="projekt-full-cash-card real">
                        <div className="projekt-full-cash-lbl">Munkaórák</div>
                        <div className="projekt-full-cash-val" style={{ color: '#a78bfa' }}>
                          {c ? `${c.hours_logged?.toFixed(1) || 0}h` : '⏳'}
                        </div>
                        {c?.tokens_used > 0 && (
                          <div className="projekt-full-cash-sub">{c.tokens_used.toLocaleString()} token</div>
                        )}
                      </div>
                    </>)
                  })()}
                  {/* Static costs */}
                  <div className="projekt-full-cash-card">
                    <div className="projekt-full-cash-lbl">Fejlesztési költség (becsült)</div>
                    <div className="projekt-full-cash-val" style={{ color: '#f59e0b' }}>{proj.devCost}</div>
                    <div className="projekt-full-cash-sub">egyszeri</div>
                  </div>
                  <div className="projekt-full-cash-card">
                    <div className="projekt-full-cash-lbl">Futtatási költség</div>
                    <div className="projekt-full-cash-val" style={{ color: '#10b981' }}>{proj.runCost}</div>
                    <div className="projekt-full-cash-sub">havonta</div>
                  </div>
                </div>
              </div>

              {/* === DASHBOARD / STATS SECTION === */}
              <div className="projekt-full-section">
                <div className="projekt-full-section-title">📊 Dashboard</div>
                <div className="projekt-full-dash-wrap">
                  {Object.entries(proj.dashboard).map(([sectionTitle, items]) => (
                    <div key={sectionTitle} className="projekt-full-dash-section">
                      <div className="projekt-full-dash-section-title">{sectionTitle}</div>
                      <div className="projekt-full-dash-grid">
                        {(items as any[]).map((item: any, i: number) => (
                          <div key={i} className="projekt-full-dash-card">
                            <div className="projekt-full-dash-val">{item.value}</div>
                            <div className="projekt-full-dash-lbl">{item.label}</div>
                            {'sub' in item && <div className="projekt-full-dash-sub">{item.sub}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* === LINKS SECTION === */}
              <div className="projekt-full-section">
                <div className="projekt-full-section-title">🔗 Linkek</div>
                <div className="projekt-full-links-wrap">
                  {proj.links.map((l: any, i: number) => (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                      className="projekt-full-link-row">
                      <span className="projekt-full-link-icon">{l.icon}</span>
                      <span className="projekt-full-link-label">{l.label}</span>
                      <span className="projekt-full-link-url">{l.url.replace(/https?:\/\//, '')}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ====== FINANCE VIEW ======

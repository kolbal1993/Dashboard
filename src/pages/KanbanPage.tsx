import React, { useState, useMemo, useEffect } from 'react'
import type { AgentName, Task } from '../types'
import { agents, getAgent } from '../data'

// ── Helpers ──
const BADGE_COLORS: Record<string, string> = {
  launch: '#f59e0b', dev: '#3b82f6', infra: '#6b7280',
  design: '#ec4899', content: '#14b8a6', system: '#8b5cf6',
  sales: '#22c55e', affiliate: '#06b6d4', finance: '#10b981',
}
const BADGE_BGS: Record<string, string> = {
  launch: '#f59e0b18', dev: '#3b82f618', infra: '#6b728018',
  design: '#ec489918', content: '#14b8a618', system: '#8b5cf618',
  sales: '#22c55e18', affiliate: '#06b6d418', finance: '#10b98118',
}

const COLUMNS = [
  { key: 'plan' as const, label: '📋 Tervezett', color: '#8b5cf6' },
  { key: 'progress' as const, label: '🔄 Folyamatban', color: '#f59e0b' },
  { key: 'blocked' as const, label: '🚫 Blokkolt', color: '#ef4444' },
  { key: 'done' as const, label: '✅ Kész', color: '#10b981' },
]

const PRIORITIES = [
  { key: 'high' as const, label: '🔴 Magas', color: '#ef4444' },
  { key: 'medium' as const, label: '🟡 Közepes', color: '#f59e0b' },
  { key: 'low' as const, label: '🟢 Alacsony', color: '#22c55e' },
]

const STORAGE_KEY = 'clawdius-kanban-tasks'

// ── Default tasks from data/index.ts ──
import { defaultTasks } from '../data'

function loadTasks(): Task[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Merge with defaults — keep saved changes but add any new defaults
      const merged = [...defaultTasks]
      for (const t of parsed) {
        const idx = merged.findIndex(m => m.id === t.id)
        if (idx >= 0) merged[idx] = t
        else merged.push(t)
      }
      return merged
    }
  } catch {}
  return [...defaultTasks]
}

function saveTasks(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {}
}

type FilterType = 'all' | AgentName
type FilterPriority = 'all' | 'high' | 'medium' | 'low'

let _idCounter = Date.now()
function genId() { return `t${_idCounter++}` }

// ── Component ──
export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [filterAgent, setFilterAgent] = useState<FilterType>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [searchQ, setSearchQ] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState<Partial<Task>>({ title: '', description: '', priority: 'medium', assignee: 'Clawdius' })

  // Persist
  useEffect(() => { saveTasks(tasks) }, [tasks])

  const updateTask = (id: string, upd: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...upd } : t))
  }

  const moveTask = (id: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }

  const addTask = () => {
    if (!newTask.title?.trim()) return
    const task: Task = {
      id: genId(),
      title: newTask.title.trim(),
      description: newTask.description?.trim() || '',
      status: 'plan',
      badge: newTask.badge || 'Task',
      badgeType: (newTask.badgeType || 'dev') as Task['badgeType'],
      assignee: (newTask.assignee || 'Clawdius') as AgentName,
      date: new Date().toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
      priority: (newTask.priority || 'medium') as Task['priority'],
      comments: [],
    }
    setTasks(prev => [task, ...prev])
    setShowAdd(false)
    setNewTask({ title: '', description: '', priority: 'medium', assignee: 'Clawdius' })
  }

  // Filtering
  const filtered = useMemo(() => {
    let result = tasks
    if (filterAgent !== 'all') result = result.filter(t => t.assignee === filterAgent)
    if (filterPriority !== 'all') result = result.filter(t => t.priority === filterPriority)
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      )
    }
    return result
  }, [tasks, filterAgent, filterPriority, searchQ])

  const count = (s: string) => tasks.filter(t => t.status === s).length
  const total = tasks.length
  const doneCount = count('done')
  const progressCount = count('progress')
  const planCount = count('plan')
  const blockedCount = count('blocked')
  const highPrio = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length

  return (
    <div className="kanban-page">
      {/* ═══ HEADER ═══ */}
      <div className="section-top">
        <div>
          <h1 className="section-title">📋 Kanban Board</h1>
          <p className="section-sub">
            {total} task · {doneCount} kész · {progressCount} aktív · {planCount} tervezett · {blockedCount} blokkolt
            {highPrio > 0 && ` · 🔴 ${highPrio} magas priority`}
          </p>
        </div>
        <button className="add-task-btn" onClick={() => setShowAdd(true)}>
          ➕ Új task
        </button>
      </div>

      {/* ═══ METRICS BAR ═══ */}
      <div className="kanban-metrics">
        <div className="km-card" style={{ borderTopColor: '#8b5cf6' }}>
          <div className="km-val" style={{ color: '#8b5cf6' }}>{planCount}</div>
          <div className="km-lbl">Tervezett</div>
        </div>
        <div className="km-card" style={{ borderTopColor: '#f59e0b' }}>
          <div className="km-val" style={{ color: '#f59e0b' }}>{progressCount}</div>
          <div className="km-lbl">Folyamatban</div>
          <div className="km-sub">{highPrio > 0 ? `🔴 ${highPrio} magas` : ''}</div>
        </div>
        <div className="km-card" style={{ borderTopColor: '#ef4444' }}>
          <div className="km-val" style={{ color: '#ef4444' }}>{blockedCount}</div>
          <div className="km-lbl">Blokkolt</div>
        </div>
        <div className="km-card" style={{ borderTopColor: '#10b981' }}>
          <div className="km-val" style={{ color: '#10b981' }}>{doneCount}</div>
          <div className="km-lbl">Kész</div>
          <div className="km-sub">{total ? `${Math.round(doneCount/total*100)}%` : ''}</div>
        </div>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="kanban-filters">
        <div className="kf-row">
          <div className="kf-search">
            <span className="kf-search-icon">🔍</span>
            <input
              className="kf-search-input"
              placeholder="Keresés a task-okban..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            {searchQ && <button className="kf-search-clear" onClick={() => setSearchQ('')}>✕</button>}
          </div>
          <div className="kf-filter-group">
            <button className={`kf-btn ${filterAgent === 'all' ? 'active' : ''}`} onClick={() => setFilterAgent('all')}>🤖 Mindenki</button>
            {agents.map(a => (
              <button
                key={a.name}
                className={`kf-btn ${filterAgent === a.name ? 'active' : ''}`}
                style={filterAgent === a.name ? { borderColor: a.color, color: a.color } : {}}
                onClick={() => setFilterAgent(a.name)}
              >{a.icon}</button>
            ))}
          </div>
          <div className="kf-filter-group">
            {PRIORITIES.map(p => (
              <button
                key={p.key}
                className={`kf-btn ${filterPriority === p.key ? 'active' : ''}`}
                style={filterPriority === p.key ? { borderColor: p.color, color: p.color } : {}}
                onClick={() => setFilterPriority(filterPriority === p.key ? 'all' : p.key)}
              >{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ KANBAN BOARD ═══ */}
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.status === col.key)
          return (
            <div key={col.key} className="kb-col">
              <div className="kb-col-header" style={{ borderBottomColor: col.color }}>
                <span className="kb-col-dot" style={{ background: col.color }} />
                <span>{col.label}</span>
                <span className="kb-col-count">{colTasks.length}</span>
              </div>
              <div className="kb-col-body">
                {colTasks.map(t => (
                  <div
                    key={t.id}
                    className="kb-card"
                    onClick={() => setSelectedTask(t)}
                    style={{ borderLeftColor: PRIORITIES.find(p => p.key === t.priority)?.color || '#6b7280' }}
                  >
                    <div className="kb-card-header">
                      <span className="kb-card-title">{t.title}</span>
                      <span className={`kb-dot ${t.priority}`} />
                    </div>
                    {t.description && (
                      <div className="kb-card-desc">{t.description.slice(0, 70)}{t.description.length > 70 ? '…' : ''}</div>
                    )}
                    <div className="kb-card-footer">
                      <span className="kb-card-agent">{getAgent(t.assignee).icon} {t.assignee}</span>
                      <span className="kb-card-date">📅 {t.date}</span>
                      {t.badge && (
                        <span className="kb-card-badge" style={{
                          background: BADGE_BGS[t.badgeType] || '#6b728018',
                          color: BADGE_COLORS[t.badgeType] || '#6b7280',
                        }}>{t.badge}</span>
                      )}
                    </div>
                    {/* Quick move buttons */}
                    <div className="kb-card-actions">
                      {col.key !== 'plan' && (
                        <button className="kb-move-btn" onClick={e => { e.stopPropagation(); moveTask(t.id, 'plan') }} title="Tervezett">📋</button>
                      )}
                      {col.key !== 'progress' && (
                        <button className="kb-move-btn" onClick={e => { e.stopPropagation(); moveTask(t.id, 'progress') }} title="Folyamatban">🔄</button>
                      )}
                      {col.key !== 'blocked' && (
                        <button className="kb-move-btn" onClick={e => { e.stopPropagation(); moveTask(t.id, 'blocked') }} title="Blokkolt">🚫</button>
                      )}
                      {col.key !== 'done' && (
                        <button className="kb-move-btn done" onClick={e => { e.stopPropagation(); moveTask(t.id, 'done') }} title="Kész">✅</button>
                      )}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="kb-empty">
                    {searchQ || filterAgent !== 'all' || filterPriority !== 'all'
                      ? 'Nincs találat'
                      : col.key === 'plan' ? 'Nincs tervezett task' :
                        col.key === 'progress' ? 'Semmi sincs folyamatban 🎉' :
                        col.key === 'blocked' ? 'Semmi sincs blokkolva 🎉' :
                        'Még nincs kész task'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══ TASK DETAIL MODAL ═══ */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => { setSelectedTask(null); setEditingTask(null) }}>
          <div className="modal kanban-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask?.id === selectedTask.id ? '✏️ Task szerkesztése' : selectedTask.title}</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="modal-close" onClick={() => setEditingTask(editingTask?.id === selectedTask.id ? null : selectedTask)}>
                  {editingTask?.id === selectedTask.id ? '❌' : '✏️'}
                </button>
                <button className="modal-close" onClick={() => setSelectedTask(null)}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              {editingTask?.id === selectedTask.id ? (
                /* EDIT MODE */
                <div className="k-edit-form">
                  <div className="k-edit-field">
                    <label>Cím</label>
                    <input value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} />
                  </div>
                  <div className="k-edit-field">
                    <label>Leírás</label>
                    <textarea value={editingTask.description} onChange={e => setEditingTask({...editingTask, description: e.target.value})} rows={3} />
                  </div>
                  <div className="k-edit-row">
                    <div className="k-edit-field">
                      <label>Felelős</label>
                      <select value={editingTask.assignee} onChange={e => setEditingTask({...editingTask, assignee: e.target.value as AgentName})}>
                        {agents.map(a => <option key={a.name} value={a.name}>{a.icon} {a.name}</option>)}
                      </select>
                    </div>
                    <div className="k-edit-field">
                      <label>Priority</label>
                      <select value={editingTask.priority} onChange={e => setEditingTask({...editingTask, priority: e.target.value as Task['priority']})}>
                        {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                    </div>
                    <div className="k-edit-field">
                      <label>Státusz</label>
                      <select value={editingTask.status} onChange={e => setEditingTask({...editingTask, status: e.target.value as Task['status']})}>
                        {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="k-edit-field">
                    <label>Badge</label>
                    <input value={editingTask.badge || ''} onChange={e => setEditingTask({...editingTask, badge: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="k-edit-save" onClick={() => {
                      if (editingTask.title.trim()) {
                        updateTask(selectedTask.id, editingTask)
                        setSelectedTask(editingTask)
                        setEditingTask(null)
                      }
                    }}>💾 Mentés</button>
                    <button className="k-edit-cancel" onClick={() => setEditingTask(null)}>Mégse</button>
                    <button className="k-edit-delete" onClick={() => {
                      setTasks(prev => prev.filter(t => t.id !== selectedTask.id))
                      setSelectedTask(null)
                      setEditingTask(null)
                    }}>🗑️ Törlés</button>
                  </div>
                </div>
              ) : (
                /* VIEW MODE */
                <>
                  <p className="modal-desc">{selectedTask.description}</p>
                  <div className="modal-meta">
                    <span className={`modal-status ${selectedTask.status}`}>
                      {COLUMNS.find(c => c.key === selectedTask.status)?.label.split(' ')[1] || selectedTask.status}
                    </span>
                    <span className={`modal-priority ${selectedTask.priority}`}>{selectedTask.priority}</span>
                    <span>{getAgent(selectedTask.assignee).icon} {selectedTask.assignee}</span>
                    <span>📅 {selectedTask.date}</span>
                    {selectedTask.badge && (
                      <span className="kb-card-badge" style={{
                        background: BADGE_BGS[selectedTask.badgeType] || '#6b728018',
                        color: BADGE_COLORS[selectedTask.badgeType] || '#6b7280',
                      }}>{selectedTask.badge}</span>
                    )}
                  </div>

                  {/* Quick status change */}
                  <div className="k-quick-status">
                    {COLUMNS.filter(c => c.key !== selectedTask.status).map(c => (
                      <button
                        key={c.key}
                        className="k-qs-btn"
                        style={{ borderColor: c.color, color: c.color }}
                        onClick={() => { moveTask(selectedTask.id, c.key); setSelectedTask({...selectedTask, status: c.key}) }}
                      >→ {c.label}</button>
                    ))}
                  </div>

                  {/* Comments */}
                  <div className="modal-comments">
                    <h3>Kommentek ({selectedTask.comments.length})</h3>
                    {selectedTask.comments.map(c => (
                      <div key={c.id} className="modal-comment">
                        <strong>{c.author}:</strong> {c.text}
                        <span className="modal-comment-time">{c.time}</span>
                      </div>
                    ))}
                    <div className="add-comment">
                      <input
                        className="add-comment-input"
                        placeholder="Írj kommentet..."
                        id={`comment-input-${selectedTask.id}`}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement
                            const text = input.value.trim()
                            if (text) {
                              const now = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
                              updateTask(selectedTask.id, {
                                comments: [...selectedTask.comments, { id: `c${Date.now()}`, author: 'Balázs' as AgentName, text, time: now }]
                              })
                              setSelectedTask({ ...selectedTask, comments: [...selectedTask.comments, { id: `c${Date.now()}`, author: 'Balázs' as AgentName, text, time: now }] })
                              input.value = ''
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD TASK MODAL ═══ */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal kanban-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Új task</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="k-edit-form">
                <div className="k-edit-field">
                  <label>Cím *</label>
                  <input autoFocus value={newTask.title || ''} onChange={e => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Task neve..." onKeyDown={e => e.key === 'Enter' && addTask()} />
                </div>
                <div className="k-edit-field">
                  <label>Leírás</label>
                  <textarea value={newTask.description || ''} onChange={e => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Részletek..." rows={3} />
                </div>
                <div className="k-edit-row">
                  <div className="k-edit-field">
                    <label>Felelős</label>
                    <select value={newTask.assignee || 'Clawdius'} onChange={e => setNewTask({...newTask, assignee: e.target.value as AgentName})}>
                      {agents.map(a => <option key={a.name} value={a.name}>{a.icon} {a.name}</option>)}
                    </select>
                  </div>
                  <div className="k-edit-field">
                    <label>Priority</label>
                    <select value={newTask.priority || 'medium'} onChange={e => setNewTask({...newTask, priority: e.target.value as Task['priority']})}>
                      {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="k-edit-field">
                  <label>Badge (pl. Launch, Dev, Infra)</label>
                  <input value={newTask.badge || ''} onChange={e => setNewTask({...newTask, badge: e.target.value})} placeholder="Pl. Frontend, API, Launch..." />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="k-edit-save" onClick={addTask} disabled={!newTask.title?.trim()}>
                    ➕ Létrehozás
                  </button>
                  <button className="k-edit-cancel" onClick={() => setShowAdd(false)}>Mégse</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ INLINE STYLES ═══ */}
      <style>{`
        .kanban-page { max-width: 1400px; animation: fadeIn 0.2s; }
        .add-task-btn {
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: white; border: none; padding: 8px 16px;
          border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: opacity 0.15s; white-space: nowrap;
        }
        .add-task-btn:hover { opacity: 0.85; }

        /* Metrics */
        .kanban-metrics {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 10px; margin-bottom: 14px;
        }
        .km-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 8px; padding: 12px 14px; border-top: 2px solid transparent;
        }
        .km-val { font-size: 22px; font-weight: 700; }
        .km-lbl { font-size: 10px; color: var(--text2); margin-top: 2px; }
        .km-sub { font-size: 9px; color: var(--text3); margin-top: 1px; }

        /* Filters */
        .kanban-filters { margin-bottom: 14px; }
        .kf-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .kf-search {
          display: flex; align-items: center; gap: 6px;
          background: var(--card); border: 1px solid var(--border);
          border-radius: 8px; padding: 4px 10px; flex: 1; min-width: 180px;
        }
        .kf-search-icon { font-size: 12px; }
        .kf-search-input {
          flex: 1; background: none; border: none; color: var(--text);
          font-size: 12px; outline: none; padding: 4px 0;
        }
        .kf-search-input::placeholder { color: var(--text3); }
        .kf-search-clear {
          background: none; border: none; color: var(--text3);
          cursor: pointer; font-size: 12px; padding: 2px;
        }
        .kf-filter-group { display: flex; gap: 3px; }
        .kf-btn {
          background: var(--bg3); border: 1px solid var(--border);
          color: var(--text2); font-size: 11px; padding: 4px 8px;
          border-radius: 5px; cursor: pointer; transition: all 0.12s;
          white-space: nowrap;
        }
        .kf-btn:hover { border-color: #444; color: var(--text); }
        .kf-btn.active { background: var(--card); border-color: var(--blue); color: white; }

        /* Board */
        .kanban-board {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          min-height: 400px;
        }
        .kb-col {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .kb-col-header {
          padding: 10px 12px;
          font-size: 12px; font-weight: 700;
          border-bottom: 2px solid;
          display: flex; align-items: center; gap: 6px;
          background: var(--bg2);
        }
        .kb-col-dot { width: 8px; height: 8px; border-radius: 50%; }
        .kb-col-count {
          margin-left: auto;
          background: var(--bg3); padding: 1px 7px;
          border-radius: 10px; font-size: 10px; color: var(--text2);
        }
        .kb-col-body {
          flex: 1; padding: 6px;
          display: flex; flex-direction: column; gap: 6px;
          overflow-y: auto; max-height: calc(100vh - 340px);
        }

        /* Cards */
        .kb-card {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-left: 3px solid #6b7280;
          border-radius: 6px;
          padding: 8px 10px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .kb-card:hover { border-color: #444; background: var(--card-hover); }
        .kb-card-header { display: flex; align-items: flex-start; gap: 4px; }
        .kb-card-title { font-size: 12px; font-weight: 600; flex: 1; word-break: break-word; }
        .kb-dot {
          width: 6px; height: 6px;
          border-radius: 50%; flex-shrink: 0; margin-top: 4px;
        }
        .kb-dot.high { background: #ef4444; }
        .kb-dot.medium { background: #f59e0b; }
        .kb-dot.low { background: #22c55e; }
        .kb-card-desc {
          font-size: 10px; color: var(--text2);
          margin: 3px 0; line-height: 1.3;
        }
        .kb-card-footer {
          display: flex; gap: 6px; align-items: center;
          font-size: 10px; color: var(--text3);
          flex-wrap: wrap; margin-top: 2px;
        }
        .kb-card-agent { white-space: nowrap; }
        .kb-card-date { white-space: nowrap; }
        .kb-card-badge {
          font-size: 9px; padding: 1px 6px;
          border-radius: 4px; font-weight: 600;
          white-space: nowrap; letter-spacing: 0.3px;
        }

        /* Quick move buttons */
        .kb-card-actions {
          display: flex; gap: 2px; margin-top: 4px;
          opacity: 0; transition: opacity 0.15s;
        }
        .kb-card:hover .kb-card-actions { opacity: 1; }
        .kb-move-btn {
          background: none; border: 1px solid var(--border);
          border-radius: 4px; padding: 2px 5px;
          font-size: 10px; cursor: pointer; color: var(--text3);
          transition: all 0.12s; line-height: 1;
        }
        .kb-move-btn:hover { background: var(--bg); color: var(--text); }
        .kb-move-btn.done { border-color: #10b98133; }
        .kb-move-btn.done:hover { background: #10b98118; }

        .kb-empty {
          padding: 20px 10px; text-align: center;
          color: var(--text3); font-size: 11px;
        }

        /* Edit form */
        .k-edit-form { display: flex; flex-direction: column; gap: 10px; }
        .k-edit-field { display: flex; flex-direction: column; gap: 3px; }
        .k-edit-field label { font-size: 10px; color: var(--text3); font-weight: 600; letter-spacing: 0.5px; }
        .k-edit-field input, .k-edit-field textarea, .k-edit-field select {
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 6px; padding: 7px 10px; color: var(--text);
          font-size: 12px; outline: none; font-family: inherit;
        }
        .k-edit-field input:focus, .k-edit-field textarea:focus, .k-edit-field select:focus {
          border-color: var(--blue);
        }
        .k-edit-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .k-edit-save {
          background: var(--blue); color: white; border: none;
          padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: opacity 0.15s;
        }
        .k-edit-save:disabled { opacity: 0.4; cursor: default; }
        .k-edit-save:hover:not(:disabled) { opacity: 0.85; }
        .k-edit-cancel {
          background: var(--bg3); color: var(--text2); border: 1px solid var(--border);
          padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: pointer;
        }
        .k-edit-cancel:hover { border-color: #444; }
        .k-edit-delete {
          background: transparent; color: #ef4444; border: 1px solid #ef444444;
          padding: 8px 16px; border-radius: 6px; font-size: 12px;
          cursor: pointer; margin-left: auto;
        }
        .k-edit-delete:hover { background: #ef444418; }

        /* Quick status */
        .k-quick-status {
          display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap;
        }
        .k-qs-btn {
          background: var(--bg3); border: 1px solid;
          border-radius: 6px; padding: 5px 10px; font-size: 11px;
          cursor: pointer; transition: all 0.12s; font-weight: 600;
        }
        .k-qs-btn:hover { opacity: 0.8; background: var(--card); }

        .kanban-modal { width: 560px; }

        @media (max-width: 1100px) {
          .kanban-board { grid-template-columns: repeat(2, 1fr); }
          .kanban-metrics { grid-template-columns: repeat(2, 1fr); }
          .k-edit-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .kanban-board { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

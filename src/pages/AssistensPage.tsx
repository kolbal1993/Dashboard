import { useState } from 'react'

interface DelegatedTask {
  id: string
  title: string
  description: string
  status: 'pending' | 'progress' | 'done'
  assignedBy: string
  date: string
}

export default function AssistensPage() {
  const [tasks, setTasks] = useState<DelegatedTask[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')

  function addTask() {
    if (!newTitle.trim()) return
    const task: DelegatedTask = {
      id: `t${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: 'pending',
      assignedBy: 'Balázs',
      date: new Date().toLocaleDateString('hu-HU'),
    }
    setTasks(prev => [task, ...prev])
    setNewTitle('')
    setNewDesc('')
    setShowForm(false)
  }

  function toggleStatus(id: string) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const next = t.status === 'pending' ? 'progress' : t.status === 'progress' ? 'done' : 'pending'
      return { ...t, status: next }
    }))
  }

  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const statBar = [
    { label: '⏳ Várakozó', count: tasks.filter(t => t.status === 'pending').length, color: '#f59e0b' },
    { label: '⚡ Folyamatban', count: tasks.filter(t => t.status === 'progress').length, color: '#6366f1' },
    { label: '✅ Kész', count: tasks.filter(t => t.status === 'done').length, color: '#22c55e' },
  ]

  return (
    <div style={{ padding: '16px 24px', maxWidth: 700, margin: '0 auto' }}>
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f4ff, #e8f5e9)',
        borderRadius: 16,
        padding: '20px 28px',
        marginBottom: 20,
        border: '1px solid #c8e6c9',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a237e', marginBottom: 4 }}>
          🦞 Clawdius Assistens
        </div>
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
          Ezen a felületen tudsz egyszerű feladatokat delegálni.
          Írd ki, mit kell csinálni — a másik fél pipálja ki, ha kész. 😊
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {statBar.map(s => (
          <div key={s.label} style={{
            flex: 1, background: '#fff', borderRadius: 10,
            border: '1px solid #e0e0e0', padding: '10px 14px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{s.label}</div>
          </div>
        ))}
        <button onClick={() => setShowForm(!showForm)} style={{
          background: '#1a237e', color: '#fff', border: 'none',
          borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
          fontWeight: 600, fontSize: 20, display: 'flex',
          alignItems: 'center', justifyContent: 'center', minWidth: 50,
        }}>+</button>
      </div>

      {/* New task form */}
      {showForm && (
        <div style={{
          background: '#fff', borderRadius: 12, border: '2px solid #1a237e',
          padding: 16, marginBottom: 16,
        }}>
          <input
            placeholder="Mit kell csinálni?"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', marginBottom: 8,
              border: '1px solid #ddd', borderRadius: 8, fontSize: 14,
              boxSizing: 'border-box',
            }}
            autoFocus
          />
          <textarea
            placeholder="Részletek (opcionális)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            rows={2}
            style={{
              width: '100%', padding: '10px 12px', marginBottom: 10,
              border: '1px solid #ddd', borderRadius: 8, fontSize: 13,
              fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addTask} style={{
              flex: 1, padding: '9px 0', background: '#1a237e', color: '#fff',
              border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
            }}>📤 Delegálás</button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '9px 24px', background: '#f5f5f5', color: '#666',
              border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer',
            }}>Mégse</button>
          </div>
        </div>
      )}

      {/* Task list */}
      {tasks.length === 0 && !showForm ? (
        <div style={{
          background: '#fff', borderRadius: 12, border: '1px solid #e0e0e0',
          padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14,
        }}>
          🎯 Még nincs delegált feladat.<br />
          Nyomj a <strong>+</strong> gombra, hogy adj hozzá!
        </div>
      ) : (
        tasks.map(t => (
          <div key={t.id} style={{
            background: '#fff', borderRadius: 10,
            border: `1px solid ${t.status === 'done' ? '#c8e6c9' : '#e0e0e0'}`,
            padding: '12px 16px', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: t.status === 'done' ? 0.7 : 1,
          }}>
            {/* Status button */}
            <button onClick={() => toggleStatus(t.id)} style={{
              width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: t.status === 'done' ? '#22c55e' : t.status === 'progress' ? '#6366f1' : '#e0e0e0',
              color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, fontWeight: 700,
            }}>
              {t.status === 'done' ? '✓' : t.status === 'progress' ? '⚡' : '○'}
            </button>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14, fontWeight: 600, color: '#333',
                textDecoration: t.status === 'done' ? 'line-through' : 'none',
              }}>{t.title}</div>
              {t.description && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{t.description}</div>}
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                📅 {t.date} · 👤 {t.assignedBy}
              </div>
            </div>

            {/* Delete */}
            <button onClick={() => deleteTask(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, color: '#ddd', padding: '4px 8px',
            }}>🗑️</button>
          </div>
        ))
      )}
    </div>
  )
}

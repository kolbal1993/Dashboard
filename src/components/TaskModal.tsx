import { useState } from 'react'
import type { Task, AgentName } from '../types'
import { getAgent } from '../data'
import AgentBadge from './AgentBadge'

function getStatusLabel(status: string): string {
  switch(status) {
    case 'plan': return '📋 Tervezett'
    case 'progress': return '⚡ Folyamatban'
    case 'review': return '🔍 Ellenőrzés'
    case 'done': return '✅ Kész'
    default: return status
  }
}

function getPriorityLabel(p: string): string {
  switch(p) {
    case 'high': return '🔥 Magas'
    case 'medium': return '⚡ Közepes'
    case 'low': return '💤 Alacsony'
    default: return p
  }
}

interface Props {
  task: Task
  onClose: () => void
  onAddComment: (taskId: string, text: string) => void
}

export default function TaskModal({ task, onClose, onAddComment }: Props) {
  const [commentText, setCommentText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (commentText.trim()) {
      onAddComment(task.id, commentText.trim())
      setCommentText('')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{task.title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <span className="modal-label">Leírás:</span>
            <p className="modal-text">{task.description}</p>
          </div>
          <div className="modal-grid">
            <div className="modal-field">
              <span className="modal-label">Státusz</span>
              <span className={`status-badge ${task.status}`}>{getStatusLabel(task.status)}</span>
            </div>
            <div className="modal-field">
              <span className="modal-label">Felelős agent</span>
              <AgentBadge name={task.assignee} />
            </div>
            <div className="modal-field">
              <span className="modal-label">Prioritás</span>
              <span className={`priority-badge ${task.priority}`}>{getPriorityLabel(task.priority)}</span>
            </div>
            <div className="modal-field">
              <span className="modal-label">Határidő</span>
              <span style={{ color: 'var(--text)', fontSize: 14 }}>{task.date}</span>
            </div>
            <div className="modal-field">
              <span className="modal-label">Kategória</span>
              <span className={`kanban-card-badge ${task.badgeType}`}>{task.badge}</span>
            </div>
            {task.cost !== undefined && (
              <div className="modal-field">
                <span className="modal-label">Költség</span>
                <span style={{ color: 'var(--brand)', fontSize: 14, fontWeight: 600 }}>{task.cost}</span>
              </div>
            )}
          </div>

          {/* COMMENTS */}
          <div className="modal-comments-section">
            <span className="modal-label">Megjegyzések</span>
            {task.comments.length === 0 && (
              <div className="modal-no-comments">Még nincsenek megjegyzések.</div>
            )}
            {task.comments.map(c => {
              const agent = getAgent(c.author)
              return (
                <div key={c.id} className="modal-comment">
                  <div className="modal-comment-header">
                    <span className="agent-badge-agent">
                      <span className="agent-badge-icon">{agent.icon}</span>
                      {c.author}
                    </span>
                    <span className="modal-comment-time">{c.time}</span>
                  </div>
                  <div className="modal-comment-text">{c.text}</div>
                </div>
              )
            })}
            <form className="modal-comment-form" onSubmit={handleSubmit}>
              <input
                className="modal-comment-input"
                placeholder="Írd ide a megjegyzésed..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">💬 Küldés</button>
            </form>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Bezárás</button>
        </div>
      </div>
    </div>
  )
}

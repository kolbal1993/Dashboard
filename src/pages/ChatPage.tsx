import { useState, useRef, useEffect } from 'react'
import { useApp } from '../App'
import { agents, getAgent } from '../data'
import type { AgentName, ChatMessage } from '../types'

export default function ChatPage() {
  const { chatMessages, addChat } = useApp()
  const [message, setMessage] = useState('')
  const [activeFilter, setActiveFilter] = useState<AgentName | 'all'>('all')
  const bottomRef = useRef<HTMLDivElement>(null)

  const filtered = activeFilter === 'all'
    ? chatMessages
    : chatMessages.filter(m => m.from === activeFilter || m.from === (activeFilter === 'Balázs' ? 'Clawdius' : 'Balázs'))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [filtered.length])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    const newMsg: ChatMessage = {
      id: `c${Date.now()}`,
      from: 'Balázs',
      text: message.trim(),
      time: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }),
    }
    addChat(newMsg)
    setMessage('')
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="section-title">💬 Agent Chat</div>
        <div className="chat-status">
          <span className="chat-status-dot" />
          5 online
        </div>
      </div>

      <div className="chat-filter-bar">
        <button className={`chat-filter-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>🤖 Összes</button>
        {agents.map(a => (
          <button key={a.name} className={`chat-filter-btn ${activeFilter === a.name ? 'active' : ''}`}
            style={activeFilter === a.name ? { borderColor: a.color, color: a.color, background: `${a.color}10` } : {}}
            onClick={() => setActiveFilter(a.name)}>{a.icon}</button>
        ))}
      </div>

      <div className="chat-messages">
        {filtered.map(msg => {
          const agent = getAgent(msg.from)
          return (
            <div key={msg.id} className={`chat-message ${msg.from === 'Balázs' ? 'chat-message-mine' : ''}`}>
              <div className="chat-message-avatar" style={{ background: `${agent.color}20` }}>
                {agent.icon}
              </div>
              <div className="chat-message-content">
                <div className="chat-message-header">
                  <span className="chat-message-author" style={{ color: agent.color }}>{agent.label}</span>
                  <span className="chat-message-time">{msg.time}</span>
                </div>
                <div className="chat-message-text">{msg.text}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          className="chat-input"
          placeholder="Írj üzenetet... (@név a megemlítéshez)"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button type="submit" className="btn btn-primary chat-send-btn">🚀 Küldés</button>
      </form>
    </div>
  )
}

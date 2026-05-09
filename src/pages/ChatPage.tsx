import { useState, useRef, useEffect } from 'react'

interface ChatMsg {
  id: number
  role: string
  content: string
  source: string
  created_at: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [lastId, setLastId] = useState(0)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined)

  // Fetch history on mount
  useEffect(() => {
    fetchHistory()
    // Poll every 3 seconds
    pollRef.current = setInterval(fetchHistory, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function fetchHistory() {
    try {
      const r = await fetch(`/api/chat/history?since=${lastId}`, { signal: AbortSignal.timeout(5000) })
      const data = await r.json()
      if (data.messages && data.messages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id))
          const newMsgs = data.messages.filter((m: ChatMsg) => !existingIds.has(m.id))
          if (newMsgs.length === 0) return prev
          const maxId = Math.max(...newMsgs.map((m: ChatMsg) => m.id))
          if (maxId > lastId) setLastId(maxId)
          return [...prev, ...newMsgs]
        })
      }
    } catch { /* silent */ }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setError('')

    try {
      const r = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
        signal: AbortSignal.timeout(5000),
      })
      const data = await r.json()
      if (data.status === 'ok') {
        setMessages(prev => [...prev, {
          id: data.id,
          role: 'user',
          content: data.content,
          source: 'dashboard',
          created_at: new Date().toISOString(),
        }])
        setLastId(data.id)
        setInput('')
      } else {
        setError('❌ Hiba a küldés során')
      }
    } catch {
      setError('❌ Hálózati hiba')
    }
    setSending(false)
  }

  function formatTime(dateStr: string) {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
    <div className="chat-page">
      <div className="section-top">
        <div>
          <h1 className="section-title">💬 Hermes Chat</h1>
          <p className="section-sub">Üzenetek szinkronizálva a Telegrammal · {messages.length} üzenet</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="status-dot online" />
          <span style={{ fontSize: 11, color: 'var(--text2)' }}>Live Sync</span>
        </div>
      </div>

      <div className="chat-messages" style={{ flex: 1, overflow: 'auto', marginBottom: 12 }}>
        {messages.length === 0 ? (
          <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>
              Még nincsenek üzenetek. Küldj egy üzenetet!
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`chat-message ${msg.role === 'user' ? 'chat-message-mine' : ''}`}>
              <div className="chat-message-avatar" style={{
                background: msg.role === 'user' ? '#3b82f622' : '#8b5cf622',
              }}>
                {msg.role === 'user' ? '👤' : '🏆'}
              </div>
              <div className="chat-message-content">
                <div className="chat-message-header">
                  <span className="chat-message-author" style={{
                    color: msg.role === 'user' ? '#3b82f6' : '#8b5cf6',
                  }}>
                    {msg.role === 'user' ? 'Balázs' : 'Hermes / Clawdius'}
                  </span>
                  <span className="chat-message-time" style={{ fontSize: 10, color: 'var(--text3)' }}>
                    {formatTime(msg.created_at)}
                    {msg.source === 'telegram' && ' 📱'}
                  </span>
                </div>
                <div className="chat-message-text">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>{error}</div>
      )}

      <form className="chat-input-bar" onSubmit={handleSend} style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <input
          className="chat-input"
          placeholder="Írj üzenetet Hermes-nek..."
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
        />
        <button type="submit" disabled={sending || !input.trim()} className="btn btn-primary chat-send-btn" style={{
          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600,
          cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.5 : 1, whiteSpace: 'nowrap',
        }}>
          {sending ? '⏳' : '🚀'} Küldés
        </button>
      </form>
    </div>
  )
}

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

  useEffect(() => {
    fetchHistory()
    pollRef.current = setInterval(fetchHistory, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

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

  function formatDateLabel(dateStr: string, prevDateStr?: string) {
    try {
      const d = new Date(dateStr)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const dateStrShort = d.toLocaleDateString('hu-HU')
      const prevDateStrShort = prevDateStr ? new Date(prevDateStr).toLocaleDateString('hu-HU') : ''
      
      if (dateStrShort === prevDateStrShort) return null // same day, no label
      if (dateStrShort === today.toLocaleDateString('hu-HU')) return 'Ma'
      if (dateStrShort === yesterday.toLocaleDateString('hu-HU')) return 'Tegnap'
      return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return null }
  }

  // Group consecutive messages from same sender
  function shouldShowAvatar(msg: ChatMsg, i: number) {
    if (i === 0) return true
    const prev = messages[i - 1]
    if (prev.role !== msg.role) return true
    // Check if more than 5 minutes apart
    try {
      const diff = new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()
      if (diff > 5 * 60 * 1000) return true
    } catch {}
    return false
  }

  function isFirstOfGroup(msg: ChatMsg, i: number) {
    if (i === 0) return true
    return messages[i - 1].role !== msg.role
  }

  function isLastOfGroup(msg: ChatMsg, i: number) {
    if (i === messages.length - 1) return true
    return messages[i + 1].role !== msg.role
  }

  const COLORS = {
    userBubble: '#2b5278',
    userBubbleEnd: '#1d3a5c',
    assistantBubble: '#1e1f23',
    assistantBorder: '#2e3035',
    text: '#e8e8e8',
    textMuted: '#8a8a8a',
    accent: '#3b82f6',
    accentGreen: '#22c55e',
    bgCard: '#16171b',
    bgInput: '#1e1f23',
    border: '#2e3035',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', maxWidth: 720, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.border}`, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🏆</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>Hermes</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS.accentGreen, display: 'inline-block' }} />
              online · {messages.length} üzenet
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS.accentGreen, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>Live Sync</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0', scrollBehavior: 'smooth' }}
        className="chat-scroll">
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
            <div style={{ fontSize: 48, opacity: 0.4 }}>💬</div>
            <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Még nincsenek üzenetek</div>
            <div style={{ color: COLORS.textMuted, fontSize: 11 }}>Küldj egy üzenetet, vagy írj Telegramon!</div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            const showAvatar = shouldShowAvatar(msg, i)
            const first = isFirstOfGroup(msg, i)
            const last = isLastOfGroup(msg, i)
            const dateLabel = formatDateLabel(msg.created_at, messages[i - 1]?.created_at)

            return (
              <div key={msg.id}>
                {/* Date separator */}
                {dateLabel && (
                  <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                    <span style={{
                      fontSize: 11, color: COLORS.textMuted, background: COLORS.bgCard,
                      padding: '3px 12px', borderRadius: 10,
                    }}>{dateLabel}</span>
                  </div>
                )}

                {/* Message row */}
                <div style={{
                  display: 'flex',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 6,
                  marginBottom: first ? 8 : 2,
                  paddingLeft: isUser ? 48 : 0,
                  paddingRight: isUser ? 0 : 48,
                }}>
                  {/* Avatar (only for first msg in group) */}
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: isUser ? '#3b82f622' : '#8b5cf622',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13,
                    visibility: showAvatar ? 'visible' : 'hidden',
                    flexShrink: 0,
                  }}>
                    {isUser ? '👤' : '🏆'}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    maxWidth: '85%',
                    background: isUser
                      ? `linear-gradient(135deg, ${COLORS.userBubble}, ${COLORS.userBubbleEnd})`
                      : COLORS.assistantBubble,
                    border: isUser ? 'none' : `1px solid ${COLORS.assistantBorder}`,
                    borderRadius: first && last ? (isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px')
                      : first ? (isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px')
                      : last ? (isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px')
                      : (isUser ? '18px 4px 4px 18px' : '4px 18px 18px 4px'),
                    padding: '7px 12px',
                    position: 'relative',
                  }}>
                    {/* Name */}
                    {first && (
                      <div style={{
                        fontSize: 11, fontWeight: 600,
                        color: isUser ? '#60a5fa' : '#a78bfa',
                        marginBottom: 2,
                      }}>
                        {isUser ? 'Balázs' : 'Hermes'}
                        {msg.source === 'telegram' && !isUser && (
                          <span style={{ fontSize: 10, color: COLORS.textMuted, marginLeft: 4 }}>📱</span>
                        )}
                      </div>
                    )}
                    
                    {/* Message text */}
                    <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.content}
                    </div>

                    {/* Time */}
                    <div style={{
                      textAlign: 'right', marginTop: 2,
                      fontSize: 10, color: isUser ? 'rgba(255,255,255,0.5)' : COLORS.textMuted,
                      lineHeight: 1,
                    }}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', padding: '4px 0' }}>{error}</div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} style={{
        borderTop: `1px solid ${COLORS.border}`,
        padding: '10px 0',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: COLORS.bgInput,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 24,
          padding: '6px 16px',
        }}>
          <input
            placeholder="Írj üzenetet..."
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: COLORS.text,
              fontSize: 14,
              outline: 'none',
              padding: '4px 0',
            }}
          />
        </div>
        <button type="submit" disabled={sending || !input.trim()}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            border: 'none',
            background: input.trim() && !sending
              ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
              : COLORS.border,
            color: input.trim() && !sending ? '#fff' : COLORS.textMuted,
            fontSize: 16,
            cursor: sending || !input.trim() ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}>
          {sending ? '⏳' : '➤'}
        </button>
      </form>

      {/* Global styles */}
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #2e3035; border-radius: 2px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: #4a4a4a; }
      `}</style>
    </div>
  )
}

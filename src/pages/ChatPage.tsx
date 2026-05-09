import React, { useState, useRef, useEffect, useCallback } from 'react'

// ─── Types ───
interface ChatMsg {
  id: number; role: string; content: string
  source: string; created_at: string
}

interface ReplyTo { id: number; content: string; role: string }

// ─── Emoji list ───
const EMOJIS = ['😊','☺️','🔥','🚀','💪','🎉','👍','👏','😄','😂','❤️','💯','🙏','🤝','⭐','💡','👀','😎','🤔','😅','🥳','✨','💥','🎯','✅','❌','📌','💬','📱','💻','🎮','🏆','🥇','💰','📊','🔮','🤖','🦞','🧠','⚡','🎵','🎬','📝','🌐','🔄','🔧','💎','🌈',]

// ─── Sound generator ───
function playNotification() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880; osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15)
    setTimeout(() => ctx.close(), 200)
  } catch {}
}

// ─── Markdown renderer ───
function renderMarkdown(text: string): (string | React.ReactNode)[] {
  const parts: (string | React.ReactNode)[] = []
  let remaining = text
  let key = 0

  // Code block first (```...```)
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/
  let match = remaining.match(codeBlockRegex)
  if (match) {
    if (match.index! > 0) parts.push(remaining.slice(0, match.index))
    parts.push(
      <pre key={key++} style={{
        background: '#0d0e12', border: '1px solid #2e3035',
        borderRadius: 10, padding: '10px 14px', overflow: 'auto',
        fontSize: 12, fontFamily: 'monospace', color: '#e8e8e8', lineHeight: 1.5,
        margin: '4px 0',
      }}>
        <code>{match[2]}</code>
      </pre>
    )
    remaining = remaining.slice(match.index! + match[0].length)
    const rest = renderMarkdown(remaining)
    parts.push(...rest)
    return parts
  }

  // Parse inline elements
  const tokens: { type: string; content: string; href?: string }[] = []
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(~~(.+?)~~)|(\|\|(.+?)\|\|)|(`(.+?)`)|(\[([^\]]+)\]\(([^)]+)\))|(## (.+))/g
  let lastIndex = 0
  let m: RegExpExecArray | null

  while ((m = regex.exec(remaining)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ type: 'text', content: remaining.slice(lastIndex, m.index) })
    }
    if (m[1]) tokens.push({ type: 'bold', content: m[2] })
    else if (m[3]) tokens.push({ type: 'italic', content: m[4] })
    else if (m[5]) tokens.push({ type: 'strike', content: m[6] })
    else if (m[7]) tokens.push({ type: 'spoiler', content: m[8] })
    else if (m[9]) tokens.push({ type: 'code', content: m[10] })
    else if (m[11]) tokens.push({ type: 'link', content: m[12], href: m[13] })
    else if (m[14]) tokens.push({ type: 'header', content: m[15] })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < remaining.length) {
    tokens.push({ type: 'text', content: remaining.slice(lastIndex) })
  }

  // Convert tokens to elements
  return tokens.map((t, i) => {
    const c = t.content || ''
    switch (t.type) {
      case 'bold': return <strong key={key++}>{renderMarkdown(c)}</strong>
      case 'italic': return <em key={key++}>{renderMarkdown(c)}</em>
      case 'strike': return <del key={key++} style={{ opacity: 0.5 }}>{c}</del>
      case 'spoiler': return <span key={key++} className="chat-spoiler" title="Spoiler" style={{
        background: '#000', color: '#000', borderRadius: 3, padding: '0 2px', cursor: 'pointer',
        transition: 'color 0.3s',
      }} onClick={e => { (e.target as HTMLElement).style.color = '#e8e8e8' }}>{c}</span>
      case 'code': return <code key={key++} style={{
        background: '#0d0e12', padding: '1px 5px', borderRadius: 4,
        fontSize: 12, fontFamily: 'monospace', color: '#22c55e',
      }}>{c}</code>
      case 'link': return <a key={key++} href={t.href} target="_blank" rel="noopener"
        style={{ color: '#60a5fa', textDecoration: 'underline' }}>{c}</a>
      case 'header': return <div key={key++} style={{
        fontWeight: 700, fontSize: 16, marginBottom: 4, marginTop: 6,
        color: '#e8e8e8',
      }}>{c}</div>
      default: return <span key={key++}>{c}</span>
    }
  })
}

// ─── Main Component ───
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [lastId, setLastId] = useState(0)
  const [error, setError] = useState('')
  const [typing, setTyping] = useState(false)
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const msgCountRef = useRef(0)

  useEffect(() => {
    fetchHistory()
    pollRef.current = setInterval(fetchHistory, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typing])

  // Notification sound + unread count for new messages
  useEffect(() => {
    if (messages.length > msgCountRef.current) {
      const newMsgs = messages.slice(msgCountRef.current)
      const hasAssistantNew = newMsgs.some(m => m.role === 'assistant')
      if (hasAssistantNew) {
        playNotification()
        const count = messages.length - msgCountRef.current
        const newAsst = newMsgs.filter(m => m.role === 'assistant').length
        setUnreadCount(prev => {
          const total = prev + newAsst
          try { localStorage.setItem('chat-unread', String(total)) } catch {}
          // Dispatch custom event for nav badge
          window.dispatchEvent(new CustomEvent('chat-unread', { detail: { count: total } }))
          return total
        })
      }
    }
    msgCountRef.current = messages.length
  }, [messages.length])

  // Typing indicator: show when user sent and no assistant response yet
  useEffect(() => {
    if (messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role === 'user') {
      setTyping(true)
    } else {
      setTyping(false)
    }
  }, [messages])

  async function fetchHistory() {
    try {
      const r = await fetch(`/api/chat/history?since=${lastId}`, { signal: AbortSignal.timeout(5000) })
      const data = await r.json()
      if (data.messages?.length) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id))
          const newMsgs = data.messages.filter((m: ChatMsg) => !existingIds.has(m.id))
          if (!newMsgs.length) return prev
          const maxId = Math.max(...newMsgs.map((m: ChatMsg) => m.id))
          if (maxId > lastId) setLastId(maxId)
          return [...prev, ...newMsgs]
        })
      }
    } catch {}
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setSending(true); setError(''); setShowEmoji(false)

    let content = text
    if (replyTo) {
      content = `> ${replyTo.content.slice(0, 80)}${replyTo.content.length > 80 ? '...' : ''}\n\n${text}`
    }

    try {
      const r = await fetch('/api/chat/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        signal: AbortSignal.timeout(5000),
      })
      const data = await r.json()
      if (data.status === 'ok') {
        setMessages(prev => [...prev, {
          id: data.id, role: 'user', content, source: 'dashboard',
          created_at: new Date().toISOString(),
        }])
        setLastId(data.id); setInput(''); setReplyTo(null)
        setTyping(true)
      } else setError('❌ Hiba a küldés során')
    } catch { setError('❌ Hálózati hiba') }
    setSending(false)
  }

  function formatTime(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  function formatDateLabel(dateStr: string, prevDateStr?: string) {
    try {
      const d = new Date(dateStr)
      if (prevDateStr && d.toLocaleDateString('hu-HU') === new Date(prevDateStr).toLocaleDateString('hu-HU')) return null
      const today = new Date(); const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
      const ds = d.toLocaleDateString('hu-HU')
      if (ds === today.toLocaleDateString('hu-HU')) return 'Ma'
      if (ds === yesterday.toLocaleDateString('hu-HU')) return 'Tegnap'
      return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return null }
  }

  function isFirstOfGroup(msg: ChatMsg, i: number) {
    return i === 0 || messages[i - 1].role !== msg.role
  }

  function handleReply(msg: ChatMsg) {
    setReplyTo({ id: msg.id, content: msg.content, role: msg.role })
    inputRef.current?.focus()
  }

  function handleEmojiPick(emoji: string) {
    setInput(prev => prev + emoji)
    inputRef.current?.focus()
  }

  // ─── File upload ───
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      if (file.type.startsWith('image/')) {
        setInput(prev => prev + ` [📷${file.name}](${text}) `)
      } else {
        setInput(prev => prev + ` [📎${file.name}](file) `)
      }
    }
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file)
    } else {
      reader.readAsText(file)
    }
    e.target.value = ''
  }

  const COLORS = {
    userBubble: '#2b5278', userBubbleEnd: '#1d3a5c',
    assistantBubble: '#1e1f23', assistantBorder: '#2e3035',
    text: '#e8e8e8', textMuted: '#8a8a8a', bgInput: '#1e1f23', border: '#2e3035', bgCard: '#16171b',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 100px)', maxWidth: 720, margin: '0 auto', width: '100%',
    }}>
      {/* ─── Header ─── */}
      <div style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.border}`, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🏆</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>Hermes</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              online · {messages.length} üzenet
              {unreadCount > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
                  borderRadius: 10, padding: '1px 6px', marginLeft: 4,
                }}>+{unreadCount}</span>
              )}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>Live Sync</span>
            <button onClick={() => { setUnreadCount(0); try { localStorage.setItem('chat-unread', '0') } catch {}; window.dispatchEvent(new CustomEvent('chat-unread', { detail: { count: 0 } })) }}
              style={{ background: 'none', border: 'none', color: COLORS.textMuted, fontSize: 10, cursor: 'pointer' }}>
              ↺
            </button>
          </div>
        </div>
      </div>

      {/* ─── Messages ─── */}
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
            const first = isFirstOfGroup(msg, i)
            const dateLabel = formatDateLabel(msg.created_at, messages[i - 1]?.created_at)

            return (
              <div key={msg.id}>
                {dateLabel && (
                  <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, background: COLORS.bgCard, padding: '3px 12px', borderRadius: 10 }}>
                      {dateLabel}
                    </span>
                  </div>
                )}
                <div style={{
                  display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
                  alignItems: 'flex-end', gap: 6,
                  marginBottom: first ? 8 : 2,
                  paddingLeft: isUser ? 48 : 0, paddingRight: isUser ? 0 : 48,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: isUser ? '#3b82f622' : '#8b5cf622',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                    visibility: first ? 'visible' : 'hidden', flexShrink: 0,
                  }}>{isUser ? '👤' : '🏆'}</div>

                  <div
                    onClick={() => handleReply(msg)}
                    style={{
                      maxWidth: '85%', cursor: 'pointer',
                      background: isUser
                        ? `linear-gradient(135deg, ${COLORS.userBubble}, ${COLORS.userBubbleEnd})`
                        : COLORS.assistantBubble,
                      border: isUser ? 'none' : `1px solid ${COLORS.assistantBorder}`,
                      borderRadius: 18,
                      borderBottomLeftRadius: isUser ? 18 : 4,
                      borderBottomRightRadius: isUser ? 4 : 18,
                      padding: '7px 12px',
                      transition: 'opacity 0.1s',
                    }}
                    title="Kattints a válaszhoz"
                  >
                    {first && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: isUser ? '#60a5fa' : '#a78bfa', marginBottom: 2 }}>
                        {isUser ? 'Balázs' : 'Hermes'}
                        {msg.source === 'telegram' && !isUser && (
                          <span style={{ fontSize: 10, color: COLORS.textMuted, marginLeft: 4 }}>📱</span>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {renderMarkdown(msg.content)}
                    </div>
                    <div style={{ textAlign: 'right', marginTop: 2, fontSize: 10, color: isUser ? 'rgba(255,255,255,0.5)' : COLORS.textMuted, lineHeight: 1 }}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* ─── Typing indicator ─── */}
        {typing && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: '#8b5cf622', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0,
            }}>🏆</div>
            <div style={{
              background: COLORS.assistantBubble, border: `1px solid ${COLORS.assistantBorder}`,
              borderRadius: 18, borderBottomLeftRadius: 4, padding: '10px 16px',
            }}>
              <div className="typing-dots">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ─── Reply bar ─── */}
      {replyTo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
          borderRadius: 10, padding: '6px 12px', marginBottom: 6, fontSize: 12,
        }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: 11 }}>
              Válasz {replyTo.role === 'user' ? 'Balázs' : 'Hermes'}-nak:
            </div>
            <div style={{ color: COLORS.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {replyTo.content.slice(0, 100)}
            </div>
          </div>
          <button onClick={() => setReplyTo(null)}
            style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 14 }}>
            ✕
          </button>
        </div>
      )}

      {/* ─── Error ─── */}
      {error && (
        <div style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', padding: '4px 0' }}>{error}</div>
      )}

      {/* ─── Emoji picker ─── */}
      {showEmoji && (
        <div style={{
          background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12,
          padding: 8, marginBottom: 6, display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 140, overflow: 'auto',
        }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => handleEmojiPick(e)}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 2, borderRadius: 4, transition: 'background 0.1s' }}>
              {e}
            </button>
          ))}
        </div>
      )}

      {/* ─── Input bar ─── */}
      <form onSubmit={handleSend} style={{
        borderTop: `1px solid ${COLORS.border}`, padding: '10px 0',
        display: 'flex', gap: 6, alignItems: 'center',
      }}>
        {/* Emoji button */}
        <button type="button" onClick={() => setShowEmoji(!showEmoji)}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'none', color: showEmoji ? '#3b82f6' : COLORS.textMuted, fontSize: 18,
            cursor: 'pointer', flexShrink: 0,
          }}>
          😊
        </button>

        {/* File upload */}
        <label style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: 'none', color: COLORS.textMuted, fontSize: 16,
          cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          📎
          <input type="file" accept="image/*,.txt,.pdf,.doc,.docx" onChange={handleFileUpload}
            style={{ display: 'none' }} />
        </label>

        {/* Input */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          background: COLORS.bgInput, border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: '6px 16px',
        }}>
          <input ref={inputRef} placeholder="Írj üzenetet..." value={input}
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', color: COLORS.text, fontSize: 14, outline: 'none', padding: '4px 0' }} />
        </div>

        {/* Send button */}
        <button type="submit" disabled={sending || !input.trim()}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none',
            background: input.trim() && !sending ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : COLORS.border,
            color: input.trim() && !sending ? '#fff' : COLORS.textMuted, fontSize: 16,
            cursor: sending || !input.trim() ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', flexShrink: 0,
          }}>
          {sending ? '⏳' : '➤'}
        </button>
      </form>

      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #2e3035; border-radius: 2px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: #4a4a4a; }
        
        .typing-dots { display: flex; gap: 4px; align-items: center; }
        .typing-dots .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #8a8a8a; animation: typingAnim 1.4s infinite ease-in-out;
        }
        .typing-dots .dot:nth-child(1) { animation-delay: 0s; }
        .typing-dots .dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingAnim {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

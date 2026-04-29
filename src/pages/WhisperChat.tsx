import { useState, useRef, useEffect } from 'react'

interface WhisperMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

const INITIAL_MESSAGE: WhisperMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '👋 Szia! Én vagyok a **Clawdius Whisper** — a személyes üzleti coachod.\n\nKüldj bármilyen kérdést, szituációt, és segítek:\n- 🤝 Tárgyalási stratégiák\n- 💰 Árazás és ajánlat\n- 🎯 Ügyfélkezelés\n- 📊 Döntési tanácsok\n\nMiben segíthetek?',
  time: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
}

const SAMPLE_RESPONSES: Record<string, string> = {
  'ár': '🎯 **Árazási tipp:**\n\nAz ügyfél árérzékenységét három dolog oldja:\n1️⃣ Érték megmutatása — ne az árat, hanem a ROI-t hangsúlyozd\n2️⃣ Opciók adása — 3 csomag (Basic, Pro, Enterprise) mindig jobb\n3️⃣ Időkorlát — "Ezt az árat május 31-ig tudom biztosítani"\n\nMelyik stratégiát próbálnád ki először?',
  'tárgyal': '🤝 **Tárgyalási tipp:**\n\nA sikeres tárgyalás 3 alapszabálya:\n1️⃣ **Figyelj többet, mint amennyit beszélsz** — a másik fél elárulja a határait\n2️⃣ **Ne mondj árat elsőként** — aki először mond számot, veszít\n3️⃣ **Mindig kérj valamit cserébe** — engedményért mindig kérj plusz szolgáltatást vagy hosszabb szerződést\n\nVan konkrét szituációd?',
  'ügyfél': '💡 **Ügyfélkezelés:**\n\nEgy elégedetlen ügyfél 3 dolgot akar:\n1️⃣ **Meghallgatást** — tükrözd vissza, amit mond\n2️⃣ **Gyors megoldást** — 24 órán belül reagálj\n3️⃣ **Kompenzációt** — egy hónap ingyen support, vagy extra workflow\n\nA legfontosabb: ne vedd személyes sértésnek a panaszt. Az ügyfél a problémára haragszik, nem rád.',
  'deepseek': '🧠 **DeepSeek AI — a motor:**\n\nA Súgó a DeepSeek Chat modellt használja, ami:\n- Ingyenes és gyors\n- Kiváló logikai és elemző képesség\n- Magyarul is tökéletesen ért\n- Nem tárolja a beszélgetéseket\n\nÉrdekel a technikai háttér?',
  'n8n': '⚡ **n8n automatizáció:**\n\nAz n8n egy vizuális workflow motor. Előnyei:\n- ✅ Ingyenes és self-hosted\n- ✅ 400+ integráció\n- ✅ Vizuális szerkesztés\n- ✅ AI node-ok (LLM, RAG, vector store)\n\nHa készítek egy n8n tutorial-t, megnéznéd?',
  'start': '👋 **Üdv újra!**\n\nKészen állok! Mondd el, miben segíthetek.\n\nTipp: próbáld ki, hogy azt írod: "Segíts az árazásban" vagy "Hogyan tárgyaljak?"',
}

function getResponse(input: string): string {
  const lower = input.toLowerCase()
  
  for (const [keyword, response] of Object.entries(SAMPLE_RESPONSES)) {
    if (lower.includes(keyword)) {
      return response
    }
  }
  
  // Default AI-like response
  const topics = [
    'üzleti stratégia',
    'ügyfélszerzés',
    'hatékonyság',
    'automatizáció',
    'AI integráció'
  ]
  const randomTopic = topics[Math.floor(Math.random() * topics.length)]
  
  return `🤔 **Érdekes kérdés!**\n\nErről a témáról még nincs előre betöltött tudásom a Súgó v2-ben. A következő verzióban a DeepSeek AI valós időben fog válaszolni.\n\nAddig is: mit szólnál egy beszélgetéshez a **${randomTopic}** témáról?`
}

export default function WhisperChat() {
  const [messages, setMessages] = useState<WhisperMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg: WhisperMessage = {
      id: `m${Date.now()}`,
      role: 'user',
      content: input.trim(),
      time: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulated AI response
    setTimeout(() => {
      const response = getResponse(userMsg.content)
      const aiMsg: WhisperMessage = {
        id: `m${Date.now()}`,
        role: 'assistant',
        content: response,
        time: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 800 + Math.random() * 1200)
  }

  function formatText(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />')
  }

  return (
    <div className="whisper-chat">
      {/* Header */}
      <div className="whisper-header">
        <div className="whisper-header-left">
          <div className="whisper-avatar">
            <span className="whisper-logo">🎤</span>
          </div>
          <div>
            <h2>Clawdius Whisper</h2>
            <div className="whisper-status">
              <span className="online-dot" />
              <span>Online — Súgó v2</span>
            </div>
          </div>
        </div>
        <div className="whisper-header-right">
          <span className="whisper-badge">🆕  AI</span>
          <button className="whisper-clear-btn" onClick={() => {
            setMessages([{
              ...INITIAL_MESSAGE,
              time: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
            }])
          }} title="Új beszélgetés">
            ➕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="whisper-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`whisper-message ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="whisper-message-avatar">🎤</div>
            )}
            <div className={`whisper-bubble ${msg.role}`}>
              <div className="whisper-text" dangerouslySetInnerHTML={{ __html: formatText(msg.content) }} />
              <div className="whisper-time">{msg.time}</div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="whisper-message assistant">
            <div className="whisper-message-avatar">🎤</div>
            <div className="whisper-bubble assistant">
              <div className="whisper-typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      <div className="whisper-suggestions">
        <button className="suggestion-chip" onClick={() => setInput('Segíts az árazásban')}>💰 Árazás</button>
        <button className="suggestion-chip" onClick={() => setInput('Hogyan tárgyaljak?')}>🤝 Tárgyalás</button>
        <button className="suggestion-chip" onClick={() => setInput('Ügyfél panasz kezelése')}>💡 Ügyfél</button>
        <button className="suggestion-chip" onClick={() => setInput('Mi az a DeepSeek?')}>🧠 DeepSeek</button>
      </div>

      {/* Input */}
      <form className="whisper-input-bar" onSubmit={handleSubmit}>
        <input
          className="whisper-input"
          placeholder="Írd ide a kérdésed..."
          value={input}
          onChange={e => setInput(e.target.value)}
          autoFocus
        />
        <button type="submit" className="whisper-send-btn" disabled={!input.trim() || isTyping}>
          🚀
        </button>
      </form>
    </div>
  )
}

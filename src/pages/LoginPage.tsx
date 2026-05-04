import { useState } from 'react'

export default function LoginPage({ onLogin }: { onLogin: (email: string, pass: string) => boolean }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !pass.trim()) { setError('❌ Tölts ki minden mezőt'); return }
    const ok = onLogin(email, pass)
    if (!ok) setError('❌ Hibás email vagy jelszó')
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0f172a',
      flexDirection: 'column', gap: 24,
    }}>
      <div style={{
        background: '#1e293b', borderRadius: 20, padding: '48px 40px',
        textAlign: 'center', maxWidth: 380, width: '90%',
        border: '1px solid #334155',
      }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          Clawdius Command Center
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28 }}>
          Belső rendszer — csak jogosult felhasználóknak
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" placeholder="Email cím" value={email}
            onChange={e => setEmail(e.target.value)} autoFocus
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #334155',
              background: '#0f172a', color: '#fff', fontSize: 14, outline: 'none' }} />

          <input type="password" placeholder="Jelszó" value={pass}
            onChange={e => setPass(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #334155',
              background: '#0f172a', color: '#fff', fontSize: 14, outline: 'none' }} />

          <button type="submit" style={{
            padding: '12px', borderRadius: 10, border: 'none',
            background: '#6366f1', color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', marginTop: 4,
          }}>
            Belépés →
          </button>
        </form>

        {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 16 }}>{error}</p>}
      </div>
    </div>
  )
}

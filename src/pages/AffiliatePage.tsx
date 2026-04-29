import { Link } from 'react-router-dom'

const programs = [
  {
    name: 'n8n',
    desc: 'Automatizációs workflow motor',
    commission: '30% első év',
    link: 'https://n8n.io/affiliates/',
    status: 'pending',
    priority: '🔴',
    reason: 'Fő eszközünk — minden posztban'
  },
  {
    name: 'Hostinger',
    desc: 'VPS & domain hosting',
    commission: '40-60%',
    link: 'https://www.hostinger.com/affiliates',
    status: 'pending',
    priority: '🔴',
    reason: 'VPS ajánló'
  },
  {
    name: 'Zapier',
    desc: 'Low-code automatizáció',
    commission: 'Változó',
    link: 'https://zapier.com/affiliates',
    status: 'pending',
    priority: '🟡',
    reason: 'AI workflow alternatíva'
  },
  {
    name: 'ElevenLabs',
    desc: 'AI hanggenerálás',
    commission: 'Van program',
    link: 'https://elevenlabs.io/affiliates',
    status: 'pending',
    priority: '🟡',
    reason: 'TTS feature'
  },
  {
    name: 'Supabase',
    desc: 'Backend + Auth',
    commission: '20%',
    link: 'https://supabase.com/partners/affiliate',
    status: 'pending',
    priority: '🟢',
    reason: 'Backend ajánló'
  },
  {
    name: 'Vercel',
    desc: 'Frontend deployment',
    commission: '$50/előfizető',
    link: 'https://vercel.com/affiliates',
    status: 'pending',
    priority: '🟢',
    reason: 'Landing deploy'
  },
]

const unused = [
  { name: 'Udemy', commission: '15%' },
  { name: 'Make.com', commission: 'Változó' },
  { name: 'Skillshare', commission: '$10/fő' },
  { name: 'Namecheap', commission: 'Változó' },
  { name: 'Hetzner', commission: 'Van program' },
]

export default function AffiliatePage() {
  return (
    <div>
      <Link to="/" className="back-btn">← Vissza</Link>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>📢 Affiliate Programok</h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        Regisztrációhoz Balázs kell (CAPTCHA). Linkek automatikusan a posztokba.
      </p>

      {/* Regisztrációs adatok */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 16, marginBottom: 16
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#818cf8' }}>
          📋 Regisztrációs adatok (ctrl+c → beillesztés)
        </h3>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: '#aaa' }}>
          <div><strong style={{ color: '#ccc' }}>Email:</strong> clawdiustheai@gmail.com</div>
          <div><strong style={{ color: '#ccc' }}>Név:</strong> Clawdius Caesar</div>
          <div><strong style={{ color: '#ccc' }}>Web:</strong> https://clawdius-landing-kohl.vercel.app</div>
        </div>
      </div>

      {/* Programok listája */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {programs.map((p, i) => (
          <div key={i} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 12, marginRight: 6 }}>{p.priority}</span>
                <strong>{p.name}</strong>
                <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>{p.desc}</span>
              </div>
              <span style={{
                padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                background: p.status === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                color: p.status === 'done' ? '#22c55e' : '#f59e0b',
              }}>
                {p.status === 'done' ? '✅ Kész' : '⏳ Regisztráció kell'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
              <span>💰 Jutalék: <strong style={{ color: '#22c55e' }}>{p.commission}</strong></span>
              <span style={{ margin: '0 8px' }}>·</span>
              <span>{p.reason}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={p.link} target="_blank" rel="noopener noreferrer" style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                textDecoration: 'none', border: '1px solid rgba(99,102,241,0.2)',
              }}>🔗 Regisztrációs link</a>
              <span style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: 'var(--bg)', color: '#666', border: '1px solid var(--border)',
              }}>Balázs feladata ⏳</span>
            </div>
          </div>
        ))}
      </div>

      {/* Másodlagos */}
      <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 20, marginBottom: 10, color: '#888' }}>
        🟢 Másodlagos (később)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {unused.map((p, i) => (
          <div key={i} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 12, fontSize: 13,
          }}>
            <strong>{p.name}</strong>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{p.commission}</div>
          </div>
        ))}
      </div>

      {/* Stat */}
      <div style={{ marginTop: 20, padding: 14, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Potenciális havi jutalék</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>€0</div>
        <div style={{ fontSize: 11, color: '#666' }}>Még egy regisztráció sem történt meg</div>
      </div>
    </div>
  )
}

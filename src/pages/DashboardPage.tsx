import { Link } from 'react-router-dom'

const months = [
  { label: 'Jan', cost: 0.12, h: 12 },
  { label: 'Feb', cost: 0.08, h: 8 },
  { label: 'Már', cost: 0.25, h: 25 },
  { label: 'Ápr', cost: 1.20, h: 100, active: true },
  { label: 'Máj', cost: 0, h: 3 },
  { label: 'Jún', cost: 0, h: 3 },
]

const platforms = [
  { name: 'LinkedIn', icon: '💼', val: 12, color: '#0a66c2' },
  { name: 'YouTube', icon: '▶️', val: 8, color: '#ff0044' },
  { name: 'Facebook', icon: '📘', val: 5, color: '#1877f2' },
  { name: 'Instagram', icon: '📸', val: 3, color: '#e4405f' },
  { name: 'TikTok', icon: '🎵', val: 1, color: '#25f4ee' },
  { name: 'Twitter', icon: '🐦', val: 1, color: '#1da1f2' },
]

export default function DashboardPage() {
  return (
    <div style={{ padding: '0 0 16px 0' }}>
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        marginBottom: 14,
      }}>
        {[
          { v: '€0.04', s: 'Havi: €1.20', c: '#6366f1' },
          { v: '3', s: '1 rád vár', c: '#f59e0b' },
          { v: '2', s: 'Ma összesen', c: '#22c55e' },
          { v: '30', s: 'LinkedIn 12', c: '#a855f7' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, borderTop: `3px solid ${s.c}` }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4, fontWeight: 500 }}>Stat {i+1}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: '#666' }}>{s.s}</div>
          </div>
        ))}
      </div>

      {/* Nav */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        marginBottom: 14,
      }}>
        {[
          { to: '/whisper', icon: '🎤', lbl: 'Whisper' },
          { to: '/notes', icon: '📋', lbl: 'Jegyzetek' },
          { to: '/chat', icon: '💬', lbl: 'Chat' },
          { to: '/landing', icon: '🌐', lbl: 'Landing' },
        ].map((n, i) => (
          <Link key={i} to={n.to} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 8px', borderRadius: 10,
            background: 'var(--card)', border: '1px solid var(--border)',
            textDecoration: 'none', color: '#ccc', fontSize: 13, fontWeight: 500,
          }}>
            <span>{n.icon}</span> {n.lbl}
          </Link>
        ))}
      </div>

      {/* Két oszlop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        {/* BAL: Költség */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#aaa', marginBottom: 14}}>💰 API Költség</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6, marginBottom: 16,
          }}>
            {[
              ['Ezen a héten', '€0.35'],
              ['Ebben a hónapban', '€1.20'],
              ['Tervezett', '€3.60'],
            ].map(([l, v], i) => (
              <div key={i} style={{ background: 'var(--bg)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#6366f1' }}>{v}</div>
              </div>
            ))}
          </div>
          {/* BAR CHART */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 4,
            height: 160, paddingTop: 8,
          }}>
            {months.map((m, i) => (
              <div key={i} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                gap: 3,
              }}>
                <div style={{ fontSize: 9, color: '#999', fontWeight: 600 }}>{m.cost > 0 ? `€${m.cost.toFixed(2)}` : '-'}</div>
                <div style={{
                  flex: 1,
                  width: '100%',
                  maxWidth: 32,
                  display: 'flex',
                  alignItems: 'flex-end',
                }}>
                  <div style={{
                    width: '100%',
                    height: `${m.h}%`,
                    minHeight: 4,
                    background: m.active
                      ? 'linear-gradient(180deg, #818cf8, #6366f1)'
                      : '#222',
                    borderRadius: '4px 4px 0 0',
                    boxShadow: m.active ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
                  }} />
                </div>
                <div style={{
                  fontSize: 10,
                  color: m.active ? '#818cf8' : '#555',
                  fontWeight: m.active ? 700 : 400,
                }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* JOBB: Platformok */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#aaa', marginBottom: 14 }}>📈 Követők</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {platforms.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{p.icon}</span>
                <span style={{ width: 65, fontSize: 12, fontWeight: 500, flexShrink: 0, color: '#bbb' }}>{p.name}</span>
                <div style={{ flex: 1, height: 8, background: '#1a1a24', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(p.val/12)*100}%`, borderRadius: 4, background: p.color, boxShadow: `0 0 6px ${p.color}33` }} />
                </div>
                <span style={{ width: 20, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#eee' }}>{p.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <style>{`
        @media (max-width: 768px) {
          .dash-stats, [style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

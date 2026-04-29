import { Link } from 'react-router-dom'

const FEATURES = [
  { icon: '🤖', title: 'AI Agent Builder', desc: 'Vizuális konfigurátor — 3 kattintásból kész az agented. Nincs kódolás.' },
  { icon: '🛡️', title: 'Enterprise Security', desc: 'Beépített rate limit, API limit, audit logging. Minden alapból biztonságos.' },
  { icon: '🚀', title: 'Auto VPS Deploy', desc: 'Egy gombnyomásra élesítjük az agented a saját VPS-én.' },
  { icon: '🔌', title: 'Multi-Platform', desc: 'Telegram, Discord, Web — egyszerre minden csatornán.' },
  { icon: '🧠', title: 'AI-Native', desc: 'DeepSeek, Claude, Gemini — válaszd ki a modellt ami kell.' },
  { icon: '📦', title: 'Pre-built Agents', desc: 'Coach, Asszisztens, Support — kész sablonok, azonnal használható.' },
]

const PRICING = [
  {
    name: 'Starter',
    price: '19',
    desc: 'Egyéni indulóknak',
    features: [
      '1 AI agent',
      'OpenClaw konfiguráció',
      'Telegram bot',
      'Alap biztonság',
      'Community support',
    ],
    cta: 'Kezdő lépés',
    popular: false,
  },
  {
    name: 'Business',
    price: '49',
    desc: 'Komolyan vevő cégeknek',
    features: [
      '3 AI agent',
      'VPS deploy (automatikus)',
      'Advanced security',
      'Audit log',
      'Email support',
    ],
    cta: 'Ajánlott',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '99',
    desc: 'Növekvő vállalkozásoknak',
    features: [
      '10+ AI agent',
      'Dedikált VPS',
      'White-label',
      'Priority support',
      'Custom integrációk',
    ],
    cta: 'Professzionális',
    popular: false,
  },
  {
    name: 'Ultimate',
    price: '199',
    desc: 'Teljes kontroll',
    features: [
      'Korlátlan agent',
      'Dedikált infrastruktúra',
      'SLA garancia',
      'VIP support 24/7',
      'Custom development',
    ],
    cta: 'Vállalati',
    popular: false,
  },
]

const FAQ = [
  { q: 'Szükségem van programozási tudásra?', a: 'Nem. A platform vizuális felületén 3 kattintással létrehozhatod az első agented.' },
  { q: 'Mennyi idő alatt éles az agent?', a: 'Az alap beállítás 5 perc. A VPS deploy 10-15 perc.' },
  { q: 'Mi történik, ha nem vagyok elégedett?', a: '30 napos pénzvisszafizetési garancia. Nincs kockázat.' },
  { q: 'Hol fut az agentem?', a: 'A saját VPS-én, amit mi állítunk be és konfigurálunk. Teljes kontrollod van.' },
  { q: 'Tudok saját modellt használni?', a: 'Igen. Bármilyen OpenAI-kompatibilis API-t csatlakoztathatsz.' },
  { q: 'Milyen adatokat tároltok?', a: 'Csak az email címed és a konfigurációs beállításaid. Semmi több.' },
]

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="landing-logo-icon">C</span>
          <span className="landing-logo-text">Clawdius</span>
        </div>
        <div className="landing-nav-links">
          <a href="#pricing">Árazás</a>
          <a href="#features">Funkciók</a>
          <a href="#faq">GYIK</a>
          <a href="#contact">Kapcsolat</a>
          <Link to="/dashboard" className="landing-btn landing-btn-outline">Dashboard</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-badge">🎉 Clawdius Agent Platform</div>
        <h1 className="landing-hero-title">
          AI Agentjeid.<br />
          <span className="gradient-text">Biztonságban.</span>
        </h1>
        <p className="landing-hero-desc">
          Hozz létre, konfigurálj és futtass AI agenteket percek alatt.
          Beépített biztonság, automatikus VPS deploy, nulla kódolás.
        </p>
        <div className="landing-hero-actions">
          <a href="#pricing" className="landing-btn landing-btn-primary">Előfizetések →</a>
          <a href="#features" className="landing-btn landing-btn-ghost">Hogyan működik?</a>
        </div>
        <div className="landing-hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">0</span>
            <span className="hero-stat-label">aktív agent</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">€19</span>
            <span className="hero-stat-label">tól/hó</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">5</span>
            <span className="hero-stat-label">perc alatt éles</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-section">
        <div className="landing-section-header">
          <h2>Minden, ami egy AI agenthez kell</h2>
          <p>Beépítve, alapból, gondolkodás nélkül.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="landing-section landing-section-dark">
        <div className="landing-section-header">
          <h2>3 lépésben éles az agented</h2>
        </div>
        <div className="steps-row">
          {[
            { num: '01', title: 'Regisztráció', desc: 'Google fiókkal 10 másodperc. Nincs kaland.', icon: '📝' },
            { num: '02', title: 'Konfiguráció', desc: 'Válassz sablont vagy építs egyedit. Vizuálisan, kattintgatással.', icon: '⚙️' },
            { num: '03', title: 'Élesítés', desc: 'Egy gomb. Automatikus VPS deploy, biztonsági beállítások, kész.', icon: '🚀' },
          ].map((s, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{s.num}</div>
              <div className="step-icon">{s.icon}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
              {i < 2 && <div className="step-connector">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="landing-section">
        <div className="landing-section-header">
          <h2>Egyszerű árazás. Nincs meglepetés.</h2>
          <p>Minden csomag tartalmazza a biztonsági alapbeállításokat.</p>
        </div>
        <div className="pricing-grid">
          {PRICING.map((p, i) => (
            <div key={i} className={`pricing-card ${p.popular ? 'pricing-popular' : ''}`}>
              {p.popular && <div className="pricing-badge">Ajánlott</div>}
              <h3 className="pricing-name">{p.name}</h3>
              <div className="pricing-price">
                <span className="pricing-currency">€</span>
                <span className="pricing-value">{p.price}</span>
                <span className="pricing-period">/hó</span>
              </div>
              <p className="pricing-desc">{p.desc}</p>
              <ul className="pricing-features">
                {p.features.map((f, j) => (
                  <li key={j}>✅ {f}</li>
                ))}
              </ul>
              <a href="#contact" className={`landing-btn ${p.popular ? 'landing-btn-primary' : 'landing-btn-outline'}`}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>
        <p className="pricing-note">
          🤝 Nincs ingyenes csomag. Nincs időpazarlás. 30 napos pénzvisszafizetési garancia.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="landing-section landing-section-dark">
        <div className="landing-section-header">
          <h2>Gyakori kérdések</h2>
        </div>
        <div className="faq-grid">
          {FAQ.map((item, i) => (
            <details key={i} className="faq-item">
              <summary className="faq-question">{item.q}</summary>
              <p className="faq-answer">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Contact / Waitlist */}
      <section id="contact" className="landing-section">
        <div className="landing-section-header">
          <h2>Még nem éles? Iratkozz fel!</h2>
          <p>Értesítünk, amikor a platform elindul. Első hónap 50% kedvezmény a feliratkozóknak.</p>
        </div>
        <form className="waitlist-form" onSubmit={e => e.preventDefault()}>
          <input type="email" placeholder="email@cimed.hu" className="waitlist-input" required />
          <button type="submit" className="landing-btn landing-btn-primary">Értesíts!</button>
        </form>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-brand">
            <span className="landing-logo-icon">C</span>
            <span>Clawdius</span>
          </div>
          <div className="landing-footer-links">
            <span>© 2026 Clawdius</span>
            <a href="#">Felhasználási feltételek</a>
            <a href="#">Adatvédelem</a>
            <a href="#">Sütik</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

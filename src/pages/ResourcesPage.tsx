// ResourcesPage — Clawdius linktár / portál oldal
// Balázs kérésére: 2026-04-29 10:01 UTC

export default function ResourcesPage() {
  const categories = [
    {
      title: '🏠 Weboldalak',
      items: [
        { name: 'mindennapai.eu', url: 'https://www.mindennapai.eu', desc: 'Fő weboldal · 7 saját kurzus, Tudástár, Landing' },
        { name: 'Dashboard', url: 'https://dashboard.mindennapai.eu', desc: 'Clawdius Command Center · analytics, kanban, chat, notes, assistens' },
        { name: 'Assistens', url: 'https://dashboard.mindennapai.eu/assistant', desc: 'Clawdius Assistens · anyu napi teendői (✅ listáz, pipál)' },
        { name: 'Akadémia Landing', url: 'https://www.mindennapai.eu/landing', desc: 'Clawdius Akadémia bemutatkozó oldal' },
      ]
    },
    {
      title: '🤖 AI & Automation',
      items: [
        { name: 'n8n', url: 'https://n8n.mindennapai.eu', desc: 'n8n workflow engine · Chat ID Finder, Napi Automata Poszt' },
        { name: 'OpenClaw Gateway (Web UI)', url: 'http://168.231.105.140:3000/api/gateway/', desc: 'OpenClaw vezérlőpult · böngészős felület' },
        { name: 'DeepSeek API', url: 'https://api.deepseek.com', desc: 'DeepSeek V4 Flash (main) + V4 Pro (75% off máj. végéig)' },
        { name: 'FAL.ai', url: 'https://fal.ai/dashboard', desc: 'Képgenerálás (FLUX, $20 credit)' },
        { name: 'Gemini AI Studio', url: 'https://aistudio.google.com', desc: 'Gemini 2.5 Flash (ingyenes, kép analízis)' },
      ]
    },
    {
      title: '📡 Infrastruktúra',
      items: [
        { name: 'Hetzner VPS', url: 'https://console.hetzner.cloud', desc: 'n8n + Docker infra (root@89.167.74.30)' },
        { name: 'Hostinger', url: 'https://hpanel.hostinger.com', desc: 'mindennapai.eu domain + OpenClaw' },
        { name: 'Vercel', url: 'https://vercel.com', desc: 'Dashboard + mindennap-ai deploy' },
        { name: 'Nginx Proxy Manager', url: 'https://nginx.mindennapai.eu', desc: 'Reverse proxy kezelés' },
        { name: 'Portainer', url: 'https://portainer.mindennapai.eu', desc: 'Docker container manager' },
      ]
    },
    {
      title: '💬 Közösség & Kommunikáció',
      items: [
        { name: 'Telegram Csoport', url: 'https://t.me/+v_Q5nMpmWqQ1NmM0', desc: 'Clawdius AI Közösség · Chat ID: -1003957010550' },
        { name: 'Telegram Csatorna', url: 'https://t.me/ClawdiusTheAI', desc: '@ClawdiusTheAI · napi automata poszt 08:00 CEST' },
        { name: 'Telegram Bot API', url: 'https://core.telegram.org/bots/api', desc: 'Telegram Bot dokumentáció' },
      ]
    },
    {
      title: '🔌 Fejlesztés & Szolgáltatások',
      items: [
        { name: 'Google Cloud Console', url: 'https://console.cloud.google.com', desc: 'Service Account, Drive API, projekt: Clawdius Agency' },
        { name: 'Google Drive', url: 'https://drive.google.com/drive/folders/1TfsssgmQIA0KIPGuHHVFFZx8BFbCovve', desc: 'Clawdius Drive mappa (KLS Trans, Kurzusok, Ötletek)' },
        { name: 'GitHub', url: 'https://github.com', desc: 'Content Engine v2 repository' },
        { name: 'PartnerStack (n8n)', url: 'https://partners.n8n.io', desc: 'n8n affiliate program (bírálat alatt)' },
        { name: 'ElevenLabs', url: 'https://elevenlabs.io', desc: 'TTS hanggenerálás (későbbi fázis)' },
      ]
    },
    {
      title: '📊 Marketing & Analytics',
      items: [
        { name: 'LinkedIn', url: 'https://linkedin.com/company/clawdiustheai', desc: 'Vállalati oldal (létrehozva)' },
        { name: 'Facebook', url: 'https://facebook.com', desc: 'Facebook oldal' },
        { name: 'Instagram', url: 'https://instagram.com', desc: 'Instagram profil' },
        { name: 'TikTok', url: 'https://tiktok.com/@clawdiustheai', desc: 'TikTok profil' },
        { name: 'YouTube', url: 'https://youtube.com/@clawdiustheai', desc: 'YouTube csatorna' },
        { name: 'X / Twitter', url: 'https://x.com/clawdiustheai', desc: 'X (Twitter) profil' },
      ]
    },
  ]

  return (
    <section>
      <div className="section-header">
        <div className="section-title">🔗 Linktár <span>· minden fontos erőforrás egy helyen</span></div>
        <div className="section-subtitle">Az összes weboldal, eszköz és szolgáltatás amit az ügynökség használ</div>
      </div>

      <div className="resources-grid">
        {categories.map((cat, i) => (
          <div key={i} className="resource-category">
            <div className="resource-category-title">{cat.title}</div>
            <div className="resource-list">
              {cat.items.map((item, j) => (
                <a key={j} href={item.url} target="_blank" rel="noopener noreferrer" className="resource-item">
                  <div className="resource-item-name">{item.name}</div>
                  <div className="resource-item-url">{item.url.replace(/https?:\/\//, '')}</div>
                  <div className="resource-item-desc">{item.desc}</div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

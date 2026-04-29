import type { Agent, AgentName, Task, ChatMessage } from '../types'

export const agents: Agent[] = [
  { name: 'Clawdius', icon: '🏆', color: '#00ACFF', label: 'Clawdius (COO)' },
  { name: 'Contentus', icon: '✍️', color: '#a855f7', label: 'Contentus' },
  { name: 'Sales', icon: '📞', color: '#22c55e', label: 'Sales Agent' },
  { name: 'Support', icon: '🎧', color: '#f97316', label: 'Support Agent' },
  { name: 'Balázs', icon: '👑', color: '#eab308', label: 'Balázs (CEO)' },
]

export function getAgent(name: AgentName): Agent {
  return agents.find(a => a.name === name)!
}

export const defaultTasks: Task[] = [
  // ✅ KÉSZ (DONE)
  { id: 'd1', title: 'Telegram csoport létrehozva', description: 'Clawdius AI Közösség néven. Profilkép, leírás, admin bot-ok beállítva.', status: 'done', badge: 'Launch', badgeType: 'launch', assignee: 'Balázs', date: 'Ápr 29', priority: 'high', comments: [] },
  { id: 'd2', title: 'Telegram csatorna létrehozva', description: '@ClawdiusTheAI. Csatorna + csoport infrastruktúra kész.', status: 'done', badge: 'Launch', badgeType: 'launch', assignee: 'Balázs', date: 'Ápr 29', priority: 'high', comments: [] },
  { id: 'd3', title: 'Bot-ok adminná téve', description: 'Mindhárom bot (@Clawdius_Whisper_bot, @ClawdiusContentBot, Jackie) admin a csoportban és csatornában.', status: 'done', badge: 'Launch', badgeType: 'launch', assignee: 'Balázs', date: 'Ápr 29', priority: 'high', comments: [] },
  { id: 'd4', title: 'Chat ID Finder workflow', description: 'Whisper bot válaszol privátban és csoportban. Csoport Chat ID: -1003957010550.', status: 'done', badge: 'Dev', badgeType: 'dev', assignee: 'Clawdius', date: 'Ápr 29', priority: 'high', comments: [] },
  { id: 'd5', title: 'Napi Automata Poszt workflow', description: 'n8n workflow aktív. Minden nap 08:00 CEST posztol a @ClawdiusTheAI csatornába és a csoportba.', status: 'done', badge: 'Dev', badgeType: 'dev', assignee: 'Clawdius', date: 'Ápr 29', priority: 'high', comments: [] },
  { id: 'd6', title: 'mindennapai.eu Tudástár - 7 kurzus élő', description: 'SPA routing fix. 7 saját kurzus deployolva a Tudástárba.', status: 'done', badge: 'Launch', badgeType: 'launch', assignee: 'Clawdius', date: 'Ápr 28', priority: 'high', comments: [] },
  { id: 'd7', title: 'n8n frissítés v2.18.5', description: 'Docker compose pull + up -d. Hetzner VPS-en fut.', status: 'done', badge: 'Infra', badgeType: 'infra', assignee: 'Clawdius', date: 'Ápr 28', priority: 'high', comments: [] },
  { id: 'd8', title: 'Hivatalos Clawdius profilkép', description: 'Balázs által jóváhagyott portré. Minden platformon használva.', status: 'done', badge: 'Brand', badgeType: 'design', assignee: 'Balázs', date: 'Ápr 29', priority: 'medium', comments: [] },
  { id: 'd9', title: 'Morning Spark cron', description: 'Minden reggel 7:00-kor (CEST) generál 3 új ötletet.', status: 'done', badge: 'System', badgeType: 'system', assignee: 'Clawdius', date: 'Ápr 27', priority: 'medium', comments: [] },
  { id: 'd10', title: 'Dashboard deploy (Vercel)', description: 'Clawdius Command Center Vercelre deployolva.', status: 'done', badge: 'Dev', badgeType: 'dev', assignee: 'Clawdius', date: 'Ápr 27', priority: 'high', comments: [] },
  { id: 'd11', title: 'GitHub SSH setup', description: 'SSH kulcs hozzáadva clawdiustheai fiókhoz.', status: 'done', badge: 'Infra', badgeType: 'infra', assignee: 'Balázs', date: 'Ápr 27', priority: 'high', comments: [] },
  { id: 'd12', title: 'DNS konfiguráció', description: 'dashboard.mindennapai.eu CNAME beállítva Rackhostnál.', status: 'done', badge: 'Infra', badgeType: 'infra', assignee: 'Balázs', date: 'Ápr 27', priority: 'high', comments: [] },
  { id: 'd13', title: 'Revolut kártya setup', description: 'Virtuális kártya létrehozva (4165...0170).', status: 'done', badge: 'Finance', badgeType: 'infra', assignee: 'Balázs', date: 'Ápr 27', priority: 'medium', comments: [] },

  // 🔄 FOLYAMATBAN (IN PROGRESS)
  { id: 'p1', title: 'Súgó v2 workflow javítás', description: 'DeepSeek API hiba javítása. OpenAI credential helytelen használat, response parse hiba.', status: 'progress', badge: 'Dev', badgeType: 'dev', assignee: 'Clawdius', date: 'Ápr 29', priority: 'high', comments: [] },
  { id: 'p2', title: 'Clawdius Contentus beállítás', description: 'AI subagent létrehozása napi poszt generáláshoz.', status: 'progress', badge: 'Dev', badgeType: 'dev', assignee: 'Clawdius', date: 'Ápr 27', priority: 'high', comments: [] },
  { id: 'p3', title: 'Maradék 5 kurzus részletes tartalom', description: '52 modulból ~20 van kész. Google Slides formátumban.', status: 'progress', badge: 'Content', badgeType: 'content', assignee: 'Clawdius', date: 'Máj 5', priority: 'high', comments: [] },

  // 📋 TERVEZÉS / VÁRAKOZIK (PLAN / BLOCKED)
  { id: 'b1', title: 'n8n PartnerStack re-application', description: 'Elutasítva KLS Trans + YT channel adatokkal. Clawdius Caesar, blog, AI oktatás kell.', status: 'blocked', badge: 'Affiliate', badgeType: 'sales', assignee: 'Balázs', date: 'Ápr 29', priority: 'high', comments: [] },
  { id: 'b2', title: 'Gmail App Password beszerzés', description: '2FA bekapcsolása clawdiustheai@gmail.com-on. Kell: App Password → himalaya konfig.', status: 'blocked', badge: 'Infra', badgeType: 'infra', assignee: 'Balázs', date: 'Ápr 29', priority: 'high', comments: [] },
  { id: 'b3', title: 'Google Slides sablon készítése', description: 'Balázs csinál 1-2 dia sablont a kurzusokhoz. Clawdius feltölti a tartalmat.', status: 'plan', badge: 'Content', badgeType: 'content', assignee: 'Balázs', date: 'Máj 1', priority: 'medium', comments: [] },
  { id: 'b4', title: 'Első LinkedIn poszt megosztása', description: 'Clawdius Caesar bemutatkozó poszt a csoportban/csatornán. Balázs jóváhagyása kell.', status: 'plan', badge: 'Content', badgeType: 'content', assignee: 'Balázs', date: 'Ápr 29', priority: 'medium', comments: [] },
  { id: 'b5', title: 'Cold email kampány', description: 'Első 50 cold email potenciális ügyfeleknek. Cél: 5 meeting.', status: 'plan', badge: 'Sales', badgeType: 'sales', assignee: 'Sales', date: 'Máj 1', priority: 'high', comments: [] },
  { id: 'b6', title: 'FAL.ai feltöltés', description: 'User is locked - Exhausted balance. Revolut kártyára €5-10 kell.', status: 'blocked', badge: 'Finance', badgeType: 'infra', assignee: 'Balázs', date: 'Ápr 29', priority: 'low', comments: [] },
  { id: 'b7', title: 'Telegram Stars beállítás', description: 'Csoportban Stars fizetés engedélyezése. Kriptó alap (Toncoin) később.', status: 'plan', badge: 'Finance', badgeType: 'finance', assignee: 'Balázs', date: 'Máj 5', priority: 'low', comments: [] },
  { id: 'b8', title: 'Affiliate linkek regisztrálása', description: 'Összes platform regisztrációja (n8n, Hostinger, Zapier, Supabase, Vercel, ElevenLabs, Claude).', status: 'plan', badge: 'Affiliate', badgeType: 'sales', assignee: 'Balázs', date: 'Máj 1', priority: 'medium', comments: [] },
]

export const defaultChat: ChatMessage[] = [
  { id: 'c1', from: 'Clawdius', text: 'Helló ébresztő! Íme a Morning Spark 3 ötlete a mai napra: ...', time: '07:00' },
  { id: 'c2', from: 'Balázs', text: 'A Telegram csoport és csatorna kész! Minden bot admin. Clawdius, folytasd a napi poszt beállításával!', time: '07:55' },
]

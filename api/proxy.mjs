// Vercel serverless API proxy — routes through VPS port 3000 (only external port)
// Server-side: no CORS/SSL issues from Vercel to VPS
// v2 — forwards POST/PATCH/DELETE bodies with Content-Type + Auth headers
// VPS HTTP proxy target (Hetzner) — self-signed cert, uses custom agent
import https from 'https'
const VPS_AGENT = new https.Agent({ rejectUnauthorized: false })
const VPS_HTTP = 'https://89.167.74.30:8445'
// Port 3000 = Hostinger proxy (now fixed to forward POST body)
const N8N_API = 'https://n8n.mindennapai.eu/api/v1'
const N8N_KEY = process.env.N8N_API_KEY || ''

export const config = {
  api: {
    bodyParser: true, // let Vercel parse JSON bodies for us
  },
}

export default async function handler(req, res) {
  const { pathname, search } = new URL(req.url, 'http://localhost')

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    // ─── Settings API → VPS port 3000 → Hostinger proxy → port 3001 ───
    if (pathname.startsWith('/api/settings/')) {
      const targetPath = pathname.replace(/^\/api\/settings/, '')
      const url = `${VPS_HTTP}/api/settings${targetPath}${search}`

      const fetchOpts = { method: req.method, headers: {}, agent: VPS_AGENT }

      // Forward Content-Type and Authorization for write operations
      if (req.headers['content-type']) {
        fetchOpts.headers['Content-Type'] = req.headers['content-type']
      }
      if (req.headers['authorization']) {
        fetchOpts.headers['Authorization'] = req.headers['authorization']
      }

      // For POST/PATCH/PUT/DELETE — forward the parsed body
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
        fetchOpts.body = JSON.stringify(req.body)
        if (!fetchOpts.headers['Content-Type']) {
          fetchOpts.headers['Content-Type'] = 'application/json'
        }
      }

      const response = await fetch(url, fetchOpts)
      const data = await response.json()
      return res.status(response.status).json(data)
    }

    // ─── Hermes Agent API ───
    if (pathname.startsWith('/api/hermes/')) {
      const targetPath = pathname.replace(/^\/api\/hermes/, '')
      const url = `http://89.167.74.30:3003${targetPath}${search}`
      const response = await fetch(url, {
        method: req.method,
        headers: { 'Accept': 'application/json' },
      })
      const data = await response.json()
      return res.status(response.status).json(data)
    }

    // ─── Booking API ───
    if (pathname.startsWith('/api/booking/')) {
      const targetPath = pathname.replace(/^\/api\/booking/, '/booking')
      const url = `http://89.167.74.30:3003${targetPath}${search}`
      const opts = { method: req.method, headers: { 'Accept': 'application/json' } }
      if (['PUT', 'POST'].includes(req.method)) {
        opts.headers['Content-Type'] = 'application/json'
        if (req.body) opts.body = JSON.stringify(req.body)
      }
      const response = await fetch(url, opts)
      const data = await response.json()
      return res.status(response.status).json(data)
    }

    // ─── Dashboard API → VPS port 3000 → Hostinger proxy → port 3002 ───
    if (pathname.startsWith('/api/costs/') || pathname.startsWith('/api/health/') || 
        pathname.startsWith('/api/agents') || pathname.startsWith('/api/status')) {
      const targetPath = pathname.replace(/^\/api/, '')
      const url = `${VPS_HTTP}/dashboard-api${targetPath}${search}`
      const response = await fetch(url, { method: req.method, agent: VPS_AGENT })
      const data = await response.json()
      return res.status(response.status).json(data)
    }

    // ─── n8n proxy ───
    if (pathname === '/api/n8n/workflows') {
      const response = await fetch(`${N8N_API}/workflows?active=true&limit=50`, {
        headers: { 'X-N8N-API-KEY': N8N_KEY }
      })
      const data = await response.json()
      return res.status(response.status).json({ count: data.data?.length || 0 })
    }

    if (pathname === '/api/n8n/executions') {
      const response = await fetch(`${N8N_API}/executions?status=error&limit=50`, {
        headers: { 'X-N8N-API-KEY': N8N_KEY }
      })
      const data = await response.json()
      return res.status(response.status).json({ count: data.data?.length || 0 })
    }

    return res.status(404).json({ error: 'Unknown proxy path' })
  } catch (err) {
    console.error('API proxy error:', err.message)
    return res.status(502).json({ error: 'Upstream unavailable', detail: err.message })
  }
}

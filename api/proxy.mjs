// Vercel serverless API proxy — routes through VPS port 3000 (only external port)
// Server-side: no CORS/SSL issues from Vercel to VPS
// v2 — forwards POST/PATCH/DELETE bodies with Content-Type + Auth headers

const VPS_HTTP = 'http://168.231.105.140:3000'
const SETTINGS_DIRECT = 'http://168.231.105.140:3010'
const N8N_API = 'https://n8n.mindennapai.eu/api/v1'
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NTY3MDQ3OS1kNjU2LTRhNWYtYjZmMi04OWUxZmY1NDg5MDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMGQwNmFjNWMtNWQ1Zi00YTNhLWI1MzctYjdlMzVlYmE3YzhlIiwiaWF0IjoxNzc3NjE4NDQxfQ.BRwcWD_JEmQCxepPyZ6Ffz2JqPhmThEZ95iNQ1fyJMU'

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
      // Use the direct proxy (port 3010) to avoid Hostinger proxy body-consumption issue
      const url = `${SETTINGS_DIRECT}/api/settings${targetPath}${search}`

      const fetchOpts = { method: req.method, headers: {} }

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

    // ─── Dashboard API → VPS port 3000 → Hostinger proxy → port 3002 ───
    if (pathname.startsWith('/api/costs/') || pathname.startsWith('/api/health/') || 
        pathname.startsWith('/api/agents') || pathname.startsWith('/api/status')) {
      const targetPath = pathname.replace(/^\/api/, '')
      const url = `${VPS_HTTP}/dashboard-api${targetPath}${search}`
      const response = await fetch(url, { method: req.method })
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

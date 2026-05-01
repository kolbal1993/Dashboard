// Vercel serverless API proxy — forwards requests to VPS backend servers (HTTP, no CORS/SSL issues)
// Server-side, so no CORS or SSL certificate problems

const DASHBOARD_API = 'http://168.231.105.140:3002'
const SETTINGS_API = 'http://168.231.105.140:3001'
const N8N_API = 'https://n8n.mindennapai.eu/api/v1'
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NTY3MDQ3OS1kNjU2LTRhNWYtYjZmMi04OWUxZmY1NDg5MDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMGQwNmFjNWMtNWQ1Zi00YTNhLWI1MzctYjdlMzVlYmE3YzhlIiwiaWF0IjoxNzc3NjE4NDQxfQ.BRwcWD_JEmQCxepPyZ6Ffz2JqPhmThEZ95iNQ1fyJMU'

function getUrl(req, pathPattern, base) {
  const { pathname, search } = new URL(req.url, 'http://localhost')
  const targetPath = pathname.replace(pathPattern, '')
  return `${base}${targetPath}${search}`
}

async function proxy(req, url) {
  return fetch(url, {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
    body: ['POST','PATCH','PUT','DELETE'].includes(req.method) ? JSON.stringify(req.body) : undefined,
  })
}

export default async function handler(req, res) {
  const { pathname, search } = new URL(req.url, 'http://localhost')
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    // ─── Dashboard API (port 3002) ───
    if (pathname.startsWith('/api/costs/') || pathname.startsWith('/api/health/') || 
        pathname.startsWith('/api/agents') || pathname.startsWith('/api/agent/') ||
        pathname === '/api/status') {
      const url = getUrl(req, /^\/api/, DASHBOARD_API)
      const response = await proxy(req, url)
      const data = await response.json()
      return res.status(response.status).json(data)
    }
    
    // ─── Settings API (port 3001) ───
    if (pathname.startsWith('/api/settings/')) {
      const url = getUrl(req, /^\/api\/settings/, `${SETTINGS_API}/api/settings`)
      const response = await proxy(req, url)
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

// Vercel serverless API proxy — forwards requests to VPS dashboard API (HTTP, no CORS issues)
// Server-side, so no CORS or SSL certificate problems

const DASHBOARD_API = 'http://168.231.105.140:3002'
const N8N_API = 'https://n8n.mindennapai.eu/api/v1'
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NTY3MDQ3OS1kNjU2LTRhNWYtYjZmMi04OWUxZmY1NDg5MDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMGQwNmFjNWMtNWQ1Zi00YTNhLWI1MzctYjdlMzVlYmE3YzhlIiwiaWF0IjoxNzc3NjE4NDQxfQ.BRwcWD_JEmQCxepPyZ6Ffz2JqPhmThEZ95iNQ1fyJMU'

export default async function handler(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost')
  
  // CORS headers (for direct browser access)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    // ─── Dashboard API proxy ───
    if (pathname.startsWith('/api/costs/') || pathname.startsWith('/api/health/') || 
        pathname.startsWith('/api/agents') || pathname.startsWith('/api/agent/')) {
      const targetPath = pathname.replace(/^\/api/, '')
      const url = `${DASHBOARD_API}${targetPath}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`
      
      const response = await fetch(url, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
      })
      const data = await response.json()
      return res.status(response.status).json(data)
    }
    
    // ─── n8n proxy ───
    if (pathname === '/api/n8n/workflows') {
      const url = `${N8N_API}/workflows?active=true&limit=50`
      const response = await fetch(url, {
        headers: { 'X-N8N-API-KEY': N8N_KEY }
      })
      const data = await response.json()
      return res.status(response.status).json({ count: data.data?.length || 0 })
    }
    
    if (pathname === '/api/n8n/executions') {
      const url = `${N8N_API}/executions?status=error&limit=50`
      const response = await fetch(url, {
        headers: { 'X-N8N-API-KEY': N8N_KEY }
      })
      const data = await response.json()
      return res.status(response.status).json({ count: data.data?.length || 0 })
    }
    
    // ─── Status ───
    if (pathname === '/api/status') {
      return res.json({ online: true, proxy: 'active' })
    }

    return res.status(404).json({ error: 'Unknown proxy path' })
  } catch (err) {
    console.error('API proxy error:', err.message)
    return res.status(502).json({ error: 'Upstream unavailable', detail: err.message })
  }
}

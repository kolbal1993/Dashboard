const API_BASE = 'https://filtranova.mindennapai.eu/youtube-summary-api/api/youtube-summary';

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // Build upstream URL preserving query params
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/^\/api\/youtube\//, '').replace(/^\/api\//, '');
  const fullUrl = `${API_BASE}/${path}${url.search}`;

  try {
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message, path, fullUrl });
  }
};

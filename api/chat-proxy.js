const API_BASE = 'http://89.167.74.30:3008';

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = new URL(req.url, 'http://localhost');
  const fullUrl = `${API_BASE}${url.pathname}${url.search}`;

  try {
    const fetchOpts = { method: req.method, headers: { 'Content-Type': 'application/json' } };
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      fetchOpts.body = JSON.stringify(req.body);
    }
    const response = await fetch(fullUrl, fetchOpts);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Chat proxy error:', error.message);
    return res.status(200).json({ messages: [], count: 0, error: error.message });
  }
};

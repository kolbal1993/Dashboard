const API_BASE = 'https://filtranova.mindennapai.eu';

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // Forward the FULL request path as-is to the nginx backend
  const url = new URL(req.url, 'http://localhost');
  const fullUrl = `${API_BASE}${url.pathname}${url.search}`;

  try {
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(502).json({ error: error.message, path: url.pathname, fullUrl });
  }
};

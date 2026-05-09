const API_BASE = 'http://89.167.74.30:3009';

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = new URL(req.url, 'http://localhost');
  const fullUrl = `${API_BASE}${url.pathname}${url.search}`;

  try {
    const response = await fetch(fullUrl, { signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Knowledge proxy error:', error.message);
    return res.status(200).json({
      error: error.message,
      decisions: [], count: 0, results: [], events: [],
    });
  }
};

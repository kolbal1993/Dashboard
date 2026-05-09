const API_BASE = 'http://89.167.74.30:3011';

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = new URL(req.url, 'http://localhost');
  // Rewrite /api/predict/ -> /api/predictor/
  const targetPath = url.pathname.replace('/api/predict/', '/api/predictor/');
  const fullUrl = `${API_BASE}${targetPath}${url.search}`;

  try {
    const response = await fetch(fullUrl, { signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Predictor proxy error:', error.message);
    return res.status(200).json({
      error: error.message,
      prediction: 'API unavailable', confidence: 0,
      related_decisions: [],
    });
  }
};

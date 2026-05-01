import { useState, useEffect } from 'react';

// Use same-origin proxy (no env var needed — avoids CORS/SSL issues)
const API = '';

interface Agent {
  id: string;
  name: string;
  model: { primary: string; fallback?: string[] };
}

interface APIKey {
  provider: string;
  key: string;
  status: string;
  lastUsed?: string;
}

const AVAILABLE_MODELS = [
  'deepseek/deepseek-v4-flash',
  'deepseek/deepseek-v4-pro',
  'google/gemini-2.5-flash',
  'groq/llama-3-70b-versatile',
  'groq/mixtral-8x7b-32768',
  'anthropic/claude-haiku-4-5',
  'anthropic/claude-sonnet-4-6',
  'anthropic/claude-opus-4-6',
];

const API_PROVIDERS = [
  { id: 'deepseek', name: 'DeepSeek', color: '#D92B2B' },
  { id: 'groq', name: 'Groq', color: '#F97316' },
  { id: 'google', name: 'Google Gemini', color: '#4285F4' },
  { id: 'anthropic', name: 'Anthropic', color: '#8B5CF6' },
  { id: 'openai', name: 'OpenAI', color: '#10B981' },
  { id: 'fal', name: 'FAL.ai', color: '#EC4899' },
  { id: 'elevenlabs', name: 'ElevenLabs', color: '#6366F1' },
];

export function SettingsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState(false);
  const [showAddKey, setShowAddKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState({ provider: '', key: '' });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [agentsRes, keysRes] = await Promise.all([
          fetch(`${API}/api/settings/agents`),
          fetch(`${API}/api/settings/api-keys`),
        ]);
        if (!agentsRes.ok || !keysRes.ok) throw new Error('Failed to load settings');
        setAgents(await agentsRes.json());
        setApiKeys(await keysRes.json());
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection failed');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpdateAgent = async (agentId: string, primaryModel: string, fallback?: string[]) => {
    try {
      const res = await fetch(`${API}/api/settings/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: { primary: primaryModel, fallback } }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setAgents(agents.map(a => a.id === agentId ? updated : a));
      setEditingAgent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleAddApiKey = async () => {
    if (!newApiKey.provider || !newApiKey.key) return;
    setSavingKey(true);
    try {
      const res = await fetch(`${API}/api/settings/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApiKey),
      });
      if (!res.ok) throw new Error('Failed to add');
      const added = await res.json();
      setApiKeys([...apiKeys, added]);
      setNewApiKey({ provider: '', key: '' });
      setShowAddKey(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add key');
    }
    setSavingKey(false);
  };

  const handleDeleteApiKey = async (provider: string) => {
    try {
      const res = await fetch(`${API}/api/settings/api-keys/${provider}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setApiKeys(apiKeys.filter(k => k.provider !== provider));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-header">
          <h1>⚙️ Settings</h1>
          <p className="settings-subtitle">Agent models &amp; API key management</p>
        </div>
        <div className="settings-loading">
          <div className="spinner" />
          <span>Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <p className="settings-subtitle">Agent models &amp; API key management</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="settings-error" onClick={() => setError('')}>
          <span>⚠️ {error}</span>
          <button className="error-close">✕</button>
        </div>
      )}

      {/* Tab bar */}
      <div className="settings-tabs">
        <button className={`settings-tab ${editingAgent === null ? 'active' : ''}`} onClick={() => setEditingAgent(null)}>
          🧠 Agent Models
        </button>
        <button className={`settings-tab ${showAddKey ? 'active' : ''}`} onClick={() => setShowAddKey(false)}>
          🔑 API Keys
        </button>
      </div>

      {/* ───────────── AGENT MODELS ───────────── */}
      <div className="settings-section">
        {agents.map(agent => (
          <div key={agent.id} className="agent-card">
            <div className="agent-card-header">
              <div className="agent-info">
                <div className="agent-name">{agent.name}</div>
                <div className="agent-id">ID: {agent.id}</div>
              </div>
              <button
                className="agent-edit-btn"
                onClick={() => setEditingAgent(editingAgent === agent.id ? null : agent.id)}
              >
                {editingAgent === agent.id ? '✕ Close' : '✏️ Edit'}
              </button>
            </div>

            {editingAgent === agent.id ? (
              <div className="agent-edit-form">
                <label className="field-label">Primary Model</label>
                <select
                  className="model-select"
                  defaultValue={agent.model.primary}
                  onChange={e => handleUpdateAgent(agent.id, e.target.value, agent.model.fallback)}
                >
                  {AVAILABLE_MODELS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {agent.model.fallback?.length ? (
                  <div className="fallback-list">
                    <label className="field-label">Fallback Models</label>
                    {agent.model.fallback.map((fb, i) => (
                      <div key={i} className="fallback-item">{i + 1}. {fb}</div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="agent-model-info">
                <div className="model-row">
                  <span className="model-label">Primary</span>
                  <span className="model-value">{agent.model.primary}</span>
                </div>
                {agent.model.fallback?.length ? (
                  <div className="model-row">
                    <span className="model-label">Fallback</span>
                    <span className="model-value">{agent.model.fallback.join(', ')}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ───────────── API KEYS ───────────── */}
      <div className="settings-section">
        <div className="api-keys-header">
          <h2>🔑 API Keys</h2>
          <button className="add-key-btn" onClick={() => setShowAddKey(!showAddKey)}>
            {showAddKey ? '✕ Cancel' : '+ Add Key'}
          </button>
        </div>

        {/* Add key form */}
        {showAddKey && (
          <div className="add-key-card">
            <div className="key-form-row">
              <div className="key-form-field">
                <label className="field-label">Provider</label>
                <select
                  className="model-select"
                  value={newApiKey.provider}
                  onChange={e => setNewApiKey({ ...newApiKey, provider: e.target.value })}
                >
                  <option value="">Select provider</option>
                  {API_PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="key-form-field">
                <label className="field-label">API Key</label>
                <input
                  className="key-input"
                  type="password"
                  placeholder="sk-..."
                  value={newApiKey.key}
                  onChange={e => setNewApiKey({ ...newApiKey, key: e.target.value })}
                />
              </div>
            </div>
            <button className="save-key-btn" onClick={handleAddApiKey} disabled={savingKey || !newApiKey.provider || !newApiKey.key}>
              {savingKey ? 'Saving...' : 'Save API Key'}
            </button>
          </div>
        )}

        {/* Key list */}
        {apiKeys.length === 0 && !showAddKey ? (
          <div className="empty-keys">
            <span>🔑</span>
            <p>No API keys configured yet.</p>
            <button className="add-key-btn" onClick={() => setShowAddKey(true)}>Add your first key</button>
          </div>
        ) : (
          <div className="key-list">
            {apiKeys.map(k => {
              const provider = API_PROVIDERS.find(p => p.id === k.provider);
              return (
                <div key={k.provider} className="key-card">
                  <div className="key-card-left">
                    <div className="key-provider" style={{ borderLeftColor: provider?.color || '#555' }}>
                      <div className="key-provider-name">{provider?.name || k.provider}</div>
                      <div className="key-preview">{k.key.substring(0, 25)}...</div>
                      {k.lastUsed && <div className="key-last-used">Last used: {new Date(k.lastUsed).toLocaleDateString()}</div>}
                    </div>
                  </div>
                  <div className="key-card-right">
                    <span className={`key-status ${k.status === 'active' ? 'active' : 'inactive'}`}>
                      {k.status}
                    </span>
                    <button className="key-delete-btn" onClick={() => handleDeleteApiKey(k.provider)}>
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

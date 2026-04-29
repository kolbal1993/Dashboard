import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SETTINGS_API_BASE = import.meta.env.VITE_SETTINGS_API_URL || 'http://localhost:3001';

interface Agent {
  id: string;
  name: string;
  model: {
    primary: string;
    fallback?: string[];
  };
}

interface APIKey {
  provider: string;
  key: string;
  status: 'active' | 'invalid' | 'expired';
  lastUsed?: string;
}

const AVAILABLE_MODELS = [
  'deepseek/deepseek-v4-flash',
  'deepseek/deepseek-v4-pro',
  'groq/llama-3-70b-versatile',
  'groq/mixtral-8x7b-32768',
  'google/gemini-2.5-flash',
  'anthropic/claude-opus-4-6',
  'anthropic/claude-sonnet-4-6',
  'anthropic/claude-haiku-4-5',
];

const API_PROVIDERS = [
  { id: 'deepseek', name: 'DeepSeek', key: 'DEEPSEEK_API_KEY' },
  { id: 'groq', name: 'Groq', key: 'GROQ_API_KEY' },
  { id: 'google', name: 'Google Gemini', key: 'GOOGLE_API_KEY' },
  { id: 'anthropic', name: 'Anthropic Claude', key: 'ANTHROPIC_API_KEY' },
  { id: 'fal', name: 'FAL.ai', key: 'FAL_KEY' },
  { id: 'elevenlabs', name: 'ElevenLabs', key: 'ELEVENLABS_API_KEY' },
];

export function SettingsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState({ provider: '', key: '' });

  // Load agents and API keys
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const [agentsRes, keysRes] = await Promise.all([
          fetch(`${SETTINGS_API_BASE}/api/settings/agents`),
          fetch(`${SETTINGS_API_BASE}/api/settings/api-keys`),
        ]);

        if (!agentsRes.ok || !keysRes.ok) throw new Error('Failed to load settings');

        const agentsData = await agentsRes.json();
        const keysData = await keysRes.json();

        setAgents(agentsData);
        setApiKeys(keysData);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleUpdateAgent = async (agentId: string, primaryModel: string, fallback?: string[]) => {
    try {
      const res = await fetch(`${SETTINGS_API_BASE}/api/settings/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: { primary: primaryModel, fallback } }),
      });

      if (!res.ok) throw new Error('Failed to update agent');

      const updated = await res.json();
      setAgents(agents.map((a) => (a.id === agentId ? updated : a)));
      setEditingAgent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleAddApiKey = async () => {
    if (!newApiKey.provider || !newApiKey.key) {
      setError('Provider and key required');
      return;
    }

    try {
      const res = await fetch(`${SETTINGS_API_BASE}/api/settings/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApiKey),
      });

      if (!res.ok) throw new Error('Failed to add API key');

      const added = await res.json();
      setApiKeys([...apiKeys, added]);
      setNewApiKey({ provider: '', key: '' });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDeleteApiKey = async (provider: string) => {
    try {
      const res = await fetch(`${SETTINGS_API_BASE}/api/settings/api-keys/${provider}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete API key');

      setApiKeys(apiKeys.filter((k) => k.provider !== provider));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading settings...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">⚙️ Settings</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded text-red-700">
          {error}
        </div>
      )}

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="models">Agent Models</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        {/* Agent Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Configure which model each agent uses by default, with fallback options.
          </div>

          {agents.map((agent) => (
            <div
              key={agent.id}
              className="border rounded-lg p-4 bg-white dark:bg-gray-900 space-y-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{agent.name}</h3>
                {editingAgent === agent.id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingAgent(null)}
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAgent(agent.id)}
                  >
                    Edit
                  </Button>
                )}
              </div>

              {editingAgent === agent.id ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Primary Model</Label>
                    <Select
                      defaultValue={agent.model.primary}
                      onValueChange={(value) => {
                        handleUpdateAgent(agent.id, value, agent.model.fallback);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_MODELS.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {agent.model.fallback && agent.model.fallback.length > 0 && (
                    <div>
                      <Label className="text-sm">Fallback Models</Label>
                      <div className="space-y-2">
                        {agent.model.fallback.map((fb, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            {idx + 1}. {fb}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Primary:</strong> {agent.model.primary}
                  </div>
                  {agent.model.fallback && agent.model.fallback.length > 0 && (
                    <div className="text-sm">
                      <strong>Fallback:</strong> {agent.model.fallback.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Manage API keys for LLM providers and integrations.
          </div>

          {/* Add New Key */}
          <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 space-y-3">
            <h3 className="font-semibold">Add New API Key</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="provider" className="text-sm">
                  Provider
                </Label>
                <Select
                  value={newApiKey.provider}
                  onValueChange={(value) =>
                    setNewApiKey({ ...newApiKey, provider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {API_PROVIDERS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="key" className="text-sm">
                  API Key
                </Label>
                <Input
                  id="key"
                  type="password"
                  placeholder="sk-..."
                  value={newApiKey.key}
                  onChange={(e) =>
                    setNewApiKey({ ...newApiKey, key: e.target.value })
                  }
                />
              </div>
            </div>

            <Button onClick={handleAddApiKey} className="w-full">
              Add API Key
            </Button>
          </div>

          {/* Existing Keys */}
          <div className="space-y-2">
            <h3 className="font-semibold">Active API Keys</h3>
            {apiKeys.length === 0 ? (
              <p className="text-sm text-gray-600">No API keys configured.</p>
            ) : (
              apiKeys.map((k) => (
                <div
                  key={k.provider}
                  className="border rounded-lg p-3 bg-white dark:bg-gray-900 flex justify-between items-center"
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      {API_PROVIDERS.find((p) => p.id === k.provider)?.name || k.provider}
                    </div>
                    <div className="text-xs text-gray-600">
                      {k.key.substring(0, 20)}...
                    </div>
                    {k.lastUsed && (
                      <div className="text-xs text-gray-500">
                        Last used: {new Date(k.lastUsed).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        k.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {k.status}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteApiKey(k.provider)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

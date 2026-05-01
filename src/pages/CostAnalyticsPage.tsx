import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts'

const COST_API = 'http://localhost:3002'

const COLORS = [
  '#4f7cff', '#ff6b6b', '#51cf66', '#ffd43b', '#cc5de8',
  '#20c997', '#ff922b', '#748ffc', '#f06595', '#5c7cfa'
]

interface ModelCost {
  model: string
  total_tokens: number
  total_cost_usd: number
  request_count: number
}

interface MonthData {
  month: number
  models: ModelCost[]
  total: number
}

export default function CostAnalyticsPage() {
  const [monthData, setMonthData] = useState<ModelCost[]>([])
  const [yearData, setYearData] = useState<MonthData[]>([])
  const [summary, setSummary] = useState({ totalUsd: 0, totalTokens: 0, totalRequests: 0 })
  const [loading, setLoading] = useState(true)
  const [pricing, setPricing] = useState<Record<string, any>>({})

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      // Current month breakdown
      const monthRes = await fetch(`${COST_API}/api/costs/month/${currentYear}/${currentMonth}`)
      const monthJson = await monthRes.json()
      setMonthData(monthJson.models || [])
      setSummary(monthJson.summary || { totalUsd: 0, totalTokens: 0, totalRequests: 0 })

      // Year data
      const yearRes = await fetch(`${COST_API}/api/costs/year/${currentYear}`)
      const yearJson = await yearRes.json()

      // Convert byMonth to array
      const months: MonthData[] = []
      for (const [m, models] of Object.entries(yearJson.byMonth || {})) {
        const ms = models as ModelCost[]
        months.push({
          month: parseInt(m),
          models: ms,
          total: ms.reduce((acc, r) => acc + r.total_cost_usd, 0)
        })
      }
      months.sort((a, b) => a.month - b.month)
      setYearData(months)

      // Pricing
      const priceRes = await fetch(`${COST_API}/api/costs/pricing`)
      const priceJson = await priceRes.json()
      setPricing(priceJson.pricing || {})
    } catch (e) {
      console.error('Cost fetch error:', e)
    }
    setLoading(false)
  }

  function formatUsd(v: number) {
    if (v < 0.01) return `$${(v * 100).toFixed(2)}¢`
    return `$${v.toFixed(2)}`
  }

  function shortModel(name: string) {
    const parts = name.split('/')
    return parts[parts.length - 1]
  }

  // Monthly trend data for line chart
  const trendData = yearData.map(m => ({
    name: `${m.month}. hó`,
    cost: parseFloat(m.total.toFixed(4)),
    requests: m.models.reduce((a, r) => a + r.request_count, 0)
  }))

  // Pie chart data
  const pieData = monthData.map(r => ({
    name: shortModel(r.model),
    value: r.total_cost_usd > 0.001 ? r.total_cost_usd : 0.001,
    fullName: r.model,
    tokens: r.total_tokens,
    requests: r.request_count
  }))

  if (loading) {
    return <section><div className="section-header"><div className="section-title">⏳ Cost Analytics betöltése...</div></div></section>
  }

  return (
    <section>
      <div className="section-header" style={{ marginBottom: 16 }}>
        <div className="section-title">💰 Cost Analytics</div>
        <button className="task-btn" onClick={fetchAll} style={{ fontSize: 12, padding: '4px 12px' }}>
          🔄 Frissítés
        </button>
      </div>

      {/* Summary cards */}
      <div className="platforms-row" style={{ marginBottom: 24 }}>
        <div className="platform-card" style={{ flex: 1 }}>
          <div className="platform-header">
            <div className="platform-icon" style={{ background: '#4f7cff20' }}>💵</div>
            <div className="platform-name">Összköltség</div>
          </div>
          <div className="platform-stat-value" style={{ textAlign: 'center', fontSize: 28, marginTop: 8 }}>
            {formatUsd(summary.totalUsd)}
          </div>
          <div className="platform-stat-label" style={{ textAlign: 'center' }}>{currentYear}.{currentMonth}</div>
        </div>
        <div className="platform-card" style={{ flex: 1 }}>
          <div className="platform-header">
            <div className="platform-icon" style={{ background: '#51cf6620' }}>🔤</div>
            <div className="platform-name">Tokenek</div>
          </div>
          <div className="platform-stat-value" style={{ textAlign: 'center', fontSize: 28, marginTop: 8 }}>
            {summary.totalTokens.toLocaleString()}
          </div>
          <div className="platform-stat-label" style={{ textAlign: 'center' }}>összesen</div>
        </div>
        <div className="platform-card" style={{ flex: 1 }}>
          <div className="platform-header">
            <div className="platform-icon" style={{ background: '#ffd43b20' }}>📞</div>
            <div className="platform-name">Kérések</div>
          </div>
          <div className="platform-stat-value" style={{ textAlign: 'center', fontSize: 28, marginTop: 8 }}>
            {summary.totalRequests}
          </div>
          <div className="platform-stat-label" style={{ textAlign: 'center' }}>ebben a hónapban</div>
        </div>
      </div>

      {/* Monthly trend chart */}
      <div className="platform-card" style={{ marginBottom: 16, padding: 20 }}>
        <div className="platform-name" style={{ marginBottom: 12 }}>📈 Havi költség trend</div>
        {trendData.length > 0 ? (
          <>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} />
                  <YAxis stroke="var(--text-dim)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                    formatter={(v: any) => [`$${(v as number).toFixed(4)}`, 'Költség']}
                  />
                  <Line type="monotone" dataKey="cost" stroke="#4f7cff" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ width: '100%', height: 180, marginTop: 16 }}>
              <ResponsiveContainer>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} />
                  <YAxis stroke="var(--text-dim)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                    formatter={(v: any) => [v, 'Kérések']}
                  />
                  <Bar dataKey="requests" fill="#51cf66" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-dim)', padding: 20, textAlign: 'center' }}>
            Még nincs havi adat — használat után jelenik meg.
          </div>
        )}
      </div>

      {/* Model breakdown */}
      <div className="platform-card" style={{ marginBottom: 16, padding: 20 }}>
        <div className="platform-name" style={{ marginBottom: 12 }}>🥧 Modell bontás (jelen hónap)</div>
        {pieData.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 260, height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                    formatter={(v: any, name: any) => [`$${((v as number) < 0.001 ? 0 : v).toFixed(4)}`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {pieData.map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[idx % COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--text)' }}>{item.name}</span>
                  <span style={{ color: 'var(--text-dim)' }}>${(item.value < 0.001 ? 0 : item.value).toFixed(4)}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>({item.requests} hívás)</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-dim)', padding: 20, textAlign: 'center' }}>
            Még nincs modell adat — használat után jelenik meg.
          </div>
        )}
      </div>

      {/* Model table */}
      <div className="platform-card" style={{ padding: 20 }}>
        <div className="platform-name" style={{ marginBottom: 12 }}>📋 Részletes kimutatás</div>
        {monthData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 500 }}>Modell</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 500 }}>Tokenek</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 500 }}>Kérések</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 500 }}>Költség</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 500 }}>$/1M token</th>
                </tr>
              </thead>
              <tbody>
                {monthData.map((r, idx) => {
                  const price = pricing[r.model] || { input: 0, output: 0 }
                  const avgPrice = price.input + price.output
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[idx % COLORS.length], flexShrink: 0 }} />
                          {r.model}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px 12px', fontFamily: 'monospace' }}>{r.total_tokens.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '8px 12px' }}>{r.request_count}</td>
                      <td style={{ textAlign: 'right', padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600 }}>
                        {formatUsd(r.total_cost_usd)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        ${avgPrice.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-dim)', padding: 12, textAlign: 'center' }}>
            Még nincs adat — használat után jelenik meg.
          </div>
        )}
      </div>
    </section>
  )
}

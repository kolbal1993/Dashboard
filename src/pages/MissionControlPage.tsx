import { useState, useEffect } from 'react'
import { agents } from '../data'
import type { AgentName, Task } from '../types'

interface AgentStatus {
  agent: AgentName
  status: 'active' | 'idle' | 'offline'
  tasks: number
  uptime: string
  costMonth: string
  lastActive: string
}

const defaultStatus: AgentStatus[] = [
  { agent: 'Clawdius', status: 'active', tasks: 8, uptime: '10h 23m', costMonth: '$0.42', lastActive: '1 min ago' },
  { agent: 'Contentus', status: 'active', tasks: 3, uptime: '4h 15m', costMonth: '$0.18', lastActive: '3 min ago' },
  { agent: 'Sales', status: 'idle', tasks: 1, uptime: '2h', costMonth: '$0', lastActive: '2h ago' },
  { agent: 'Support', status: 'idle', tasks: 0, uptime: '0h', costMonth: '$0', lastActive: 'never' },
  { agent: 'Balázs', status: 'active', tasks: 5, uptime: 'user', costMonth: '-', lastActive: '5 min ago' },
]

interface Activity {
  agent: AgentName
  action: string
  time: string
}

const sampleActivity: Activity[] = [
  { agent: 'Clawdius', action: 'Created Notion financial database', time: '5m ago' },
  { agent: 'Contentus', action: 'Generated daily post for Telegram', time: '12m ago' },
  { agent: 'Clawdius', action: 'n8n API connection verified', time: '18m ago' },
  { agent: 'Balázs', action: 'Approved new strategy direction', time: '25m ago' },
  { agent: 'Clawdius', action: 'Mission Control page built', time: 'now' },
]

function AgentCard({ status }: { status: AgentStatus }) {
  const agent = agents.find(a => a.name === status.agent)!

  return (
    <div className={`mission-agent-card ${status.status}`}>
      <div className="mission-agent-header">
        <span className="mission-agent-icon">{agent.icon}</span>
        <div className="mission-agent-info">
          <span className="mission-agent-name">{agent.label}</span>
          <span className={`mission-agent-status-dot ${status.status}`} />
          <span className="mission-agent-status-text">{status.status}</span>
        </div>
      </div>
      <div className="mission-agent-stats">
        <div className="mission-stat">
          <span className="mission-stat-value">{status.tasks}</span>
          <span className="mission-stat-label">tasks</span>
        </div>
        <div className="mission-stat">
          <span className="mission-stat-value">{status.costMonth}</span>
          <span className="mission-stat-label">cost</span>
        </div>
        <div className="mission-stat">
          <span className="mission-stat-value">{status.uptime}</span>
          <span className="mission-stat-label">uptime</span>
        </div>
      </div>
    </div>
  )
}

function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <div className="mission-activity-feed">
      <h3>Recent Activity</h3>
      <div className="mission-activity-list">
        {activities.map((a, i) => {
          const agent = agents.find(ag => ag.name === a.agent)!
          return (
            <div key={i} className="mission-activity-item">
              <span className="mission-activity-icon">{agent.icon}</span>
              <div className="mission-activity-content">
                <span className="mission-activity-agent" style={{ color: agent.color }}>{agent.name}</span>
                <span className="mission-activity-action">{a.action}</span>
              </div>
              <span className="mission-activity-time">{a.time}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OrgChart() {
  return (
    <div className="mission-org-chart">
      <h3>Agent Team</h3>
      <div className="mission-org-hierarchy">
        <div className="mission-org-ceo">
          <span className="mission-org-icon">👑</span>
          <span className="mission-org-name">Balázs (CEO)</span>
        </div>
        <div className="mission-org-arrow">↓</div>
        <div className="mission-org-coo">
          <span className="mission-org-icon">🏆</span>
          <span className="mission-org-name">Clawdius (COO)</span>
        </div>
        <div className="mission-org-arrow">↓</div>
        <div className="mission-org-team">
          <div className="mission-org-member">
            <span className="mission-org-icon">✍️</span>
            <span className="mission-org-name">Contentus</span>
          </div>
          <div className="mission-org-member">
            <span className="mission-org-icon">📞</span>
            <span className="mission-org-name">Sales</span>
          </div>
          <div className="mission-org-member">
            <span className="mission-org-icon">🎧</span>
            <span className="mission-org-name">Support</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MissionControlPage() {
  const [agentStatuses] = useState<AgentStatus[]>(defaultStatus)
  const [tasks, setTasks] = useState<Task[]>([])
  const [totalCost, setTotalCost] = useState('$0.60')

  useEffect(() => {
    // Load tasks from dashboard context
    try {
      const saved = localStorage.getItem('clawdius-tasks')
      if (saved) setTasks(JSON.parse(saved))
    } catch {}
  }, [])

  const activeTasks = tasks.filter(t => t.status === 'progress' || t.status === 'plan').length
  const doneTasks = tasks.filter(t => t.status === 'done').length

  return (
    <div className="mission-control-page">
      <div className="mission-control-header">
        <h1>
          <span className="mission-control-icon">🦞</span>
          Mission Control
        </h1>
        <div className="mission-control-summary">
          <div className="mission-summary-item">
            <span className="mission-summary-value">{agents.length}</span>
            <span className="mission-summary-label">Agents</span>
          </div>
          <div className="mission-summary-item">
            <span className="mission-summary-value">{activeTasks}</span>
            <span className="mission-summary-label">Active Tasks</span>
          </div>
          <div className="mission-summary-item">
            <span className="mission-summary-value">{doneTasks}</span>
            <span className="mission-summary-label">Completed</span>
          </div>
          <div className="mission-summary-item">
            <span className="mission-summary-value">{totalCost}</span>
            <span className="mission-summary-label">Month Cost</span>
          </div>
        </div>
      </div>

      <div className="mission-control-grid">
        <div className="mission-column">
          <div className="mission-section-title">🤖 Agent Status</div>
          <div className="mission-agents-grid">
            {agentStatuses.map(s => (
              <AgentCard key={s.agent} status={s} />
            ))}
          </div>
        </div>

        <div className="mission-column">
          <OrgChart />
          <div className="mission-cost-breakdown">
            <h3>Cost Breakdown</h3>
            <div className="mission-cost-bar">
              <div className="mission-cost-fill" style={{width: '70%', background: '#00ACFF'}} />
            </div>
            <div className="mission-cost-legends">
              <span><span className="cost-dot" style={{background: '#00ACFF'}} /> DeepSeek $0.42</span>
              <span><span className="cost-dot" style={{background: '#a855f7'}} /> Contentus $0.18</span>
            </div>
          </div>
        </div>
      </div>

      <ActivityFeed activities={sampleActivity} />
    </div>
  )
}

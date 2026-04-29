import type { AgentName } from '../types'
import { getAgent } from '../data'

export default function AgentBadge({ name, small }: { name: AgentName; small?: boolean }) {
  const agent = getAgent(name)
  return (
    <span
      className={`agent-badge ${small ? 'agent-badge-sm' : ''}`}
      style={{ borderColor: agent.color, color: agent.color }}
    >
      <span className="agent-badge-icon">{agent.icon}</span>
      {agent.name}
    </span>
  )
}

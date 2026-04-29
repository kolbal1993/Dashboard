export type AgentName = 'Clawdius' | 'Contentus' | 'Sales' | 'Support' | 'Balázs'

export interface Comment {
  id: string
  author: AgentName
  text: string
  time: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'plan' | 'progress' | 'review' | 'done' | 'blocked'
  badge: string
  badgeType: string
  assignee: AgentName
  date: string
  cost?: string
  priority: 'high' | 'medium' | 'low'
  comments: Comment[]
}

export interface ChatMessage {
  id: string
  from: AgentName
  text: string
  time: string
}

export interface PlatformData {
  name: string
  icon: string
  color: string
  followers: number
  views: number
  posts: number
  change: number
  engagement: number
}

export interface Agent {
  name: AgentName
  icon: string
  color: string
  label: string
}

export interface Meeting {
  id: string
  title: string
  date: string
  duration: string
  status: 'active' | 'ended'
  summary: string
}

export interface MeetingNote {
  id: string
  sessionId: string
  title: string
  date: string
  duration: string
  status: string
  participants: string[]
  keyDecisions: string[]
  nextSteps: string[]
  importantDetails: string[]
  rawTranscript: string
}

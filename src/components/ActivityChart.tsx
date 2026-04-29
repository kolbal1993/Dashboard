import { useMemo, useState } from 'react'
import { useApp } from '../App'

type Period = 'day' | 'week' | 'month'

export default function ActivityChart() {
  const { tasks } = useApp()
  const [period, setPeriod] = useState<Period>('day')

  const stats = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)

    // Group by date from task data
    const byDate: Record<string, { total: number; done: number; new: number }> = {}
    const allDates: string[] = []

    tasks.forEach(t => {
      // Parse date from task — format like 'Ápr 29' or '2026-04-27'
      let dateStr = ''
      if (t.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateStr = t.date
      } else {
        // Convert "Ápr 29" style to ISO
        const months: Record<string, string> = {
          'Jan':'01','Feb':'02','Már':'03','Ápr':'04','Máj':'05','Jún':'06',
          'Júl':'07','Aug':'08','Szep':'09','Okt':'10','Nov':'11','Dec':'12'
        }
        const parts = t.date.split(' ')
        const m = months[parts[0]] || '01'
        const d = parts[1]?.padStart(2, '0') || '01'
        dateStr = `2026-${m}-${d}`
      }

      if (!byDate[dateStr]) {
        byDate[dateStr] = { total: 0, done: 0, new: 0 }
        allDates.push(dateStr)
      }
      byDate[dateStr].total++
      if (t.status === 'done') byDate[dateStr].done++
    })

    allDates.sort()

    // Determine which dates to show based on period
    let displayDates: string[]
    if (period === 'day') {
      // Last 14 days
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 14)
      displayDates = allDates.filter(d => d >= cutoff.toISOString().slice(0, 10))
      if (displayDates.length === 0) displayDates = allDates.slice(-7)
    } else if (period === 'week') {
      // Group by ISO week — show last 8 weeks
      displayDates = allDates
    } else {
      // Last 6 months
      displayDates = allDates
    }

    // If daily and too few entries, create dummy recent dates
    if (period === 'day' && displayDates.length < 3) {
      const recent: string[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const ds = d.toISOString().slice(0, 10)
        if (!byDate[ds]) {
          byDate[ds] = { total: 0, done: 0, new: 0 }
        }
        recent.push(ds)
      }
      // Merge with existing dates
      const merged = new Set([...recent, ...displayDates])
      displayDates = Array.from(merged).sort()
    }

    // Calculate totals
    const totalAll = tasks.length
    const doneAll = tasks.filter(t => t.status === 'done').length
    const progressAll = tasks.filter(t => t.status === 'progress').length
    const blockedAll = tasks.filter(t => t.status === 'blocked').length
    const planAll = tasks.filter(t => t.status === 'plan').length

    // For week/month grouping, aggregate
    if (period === 'week') {
      const byWeek: Record<string, { label: string; total: number; done: number; new: number }> = {}
      const weekDates: string[] = []
      displayDates.forEach(d => {
        const date = new Date(d + 'T12:00:00Z')
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay() + 1) // Monday
        const weekKey = weekStart.toISOString().slice(0, 10)
        if (!byWeek[weekKey]) {
          byWeek[weekKey] = {
            label: `w${weekStart.toISOString().slice(5, 10)}`,
            total: 0, done: 0, new: 0
          }
          weekDates.push(weekKey)
        }
        byWeek[weekKey].total += byDate[d]?.total || 0
        byWeek[weekKey].done += byDate[d]?.done || 0
      })
      weekDates.sort().slice(-8)
      return {
        labels: weekDates.slice(-8).map(w => byWeek[w]?.label || ''),
        datasets: weekDates.slice(-8).map(w => byWeek[w] || { total: 0, done: 0, new: 0 }),
        summary: { totalAll, doneAll, progressAll, blockedAll, planAll }
      }
    }

    if (period === 'month') {
      const byMonth: Record<string, { label: string; total: number; done: number; new: number }> = {}
      const monthDates: string[] = []
      displayDates.forEach(d => {
        const monthKey = d.slice(0, 7)
        if (!byMonth[monthKey]) {
          byMonth[monthKey] = { label: monthKey, total: 0, done: 0, new: 0 }
          monthDates.push(monthKey)
        }
        byMonth[monthKey].total += byDate[d]?.total || 0
        byMonth[monthKey].done += byDate[d]?.done || 0
      })
      const sortedMonths = monthDates.sort().slice(-6)
      return {
        labels: sortedMonths.map(m => m.replace('2026-', '')),
        datasets: sortedMonths.map(m => byMonth[m] || { total: 0, done: 0, new: 0 }),
        summary: { totalAll, doneAll, progressAll, blockedAll, planAll }
      }
    }

    // Daily view
    return {
      labels: displayDates.map(d => {
        const date = new Date(d + 'T12:00:00Z')
        return `${date.getDate()}. ${date.toLocaleString('hu-HU', { month: 'short' })}`
      }),
      datasets: displayDates.map(d => byDate[d] || { total: 0, done: 0, new: 0 }),
      summary: { totalAll, doneAll, progressAll, blockedAll, planAll }
    }
  }, [tasks, period])

  const maxVal = Math.max(...stats.datasets.map(d => d.total), 1)

  return (
    <div className="activity-chart">
      <div className="activity-chart-header">
        <h3>📊 Aktivitás</h3>
        <div className="period-selector">
          {(['day', 'week', 'month'] as Period[]).map(p => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'day' ? 'Nap' : p === 'week' ? 'Hét' : 'Hónap'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="activity-summary">
        <div className="activity-stat">
          <span className="activity-stat-value">{stats.summary.totalAll}</span>
          <span className="activity-stat-label">Összes</span>
        </div>
        <div className="activity-stat done">
          <span className="activity-stat-value">{stats.summary.doneAll}</span>
          <span className="activity-stat-label">Kész</span>
          <span className="activity-stat-pct">{Math.round(stats.summary.doneAll / stats.summary.totalAll * 100)}%</span>
        </div>
        <div className="activity-stat progress">
          <span className="activity-stat-value">{stats.summary.progressAll}</span>
          <span className="activity-stat-label">Folyamatban</span>
          <span className="activity-stat-pct">{Math.round(stats.summary.progressAll / stats.summary.totalAll * 100)}%</span>
        </div>
        <div className="activity-stat blocked">
          <span className="activity-stat-value">{stats.summary.blockedAll}</span>
          <span className="activity-stat-label">Blokkolt</span>
          <span className="activity-stat-pct">{Math.round(stats.summary.blockedAll / stats.summary.totalAll * 100)}%</span>
        </div>
        <div className="activity-stat plan">
          <span className="activity-stat-value">{stats.summary.planAll}</span>
          <span className="activity-stat-label">Tervezett</span>
          <span className="activity-stat-pct">{Math.round(stats.summary.planAll / stats.summary.totalAll * 100)}%</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="activity-bars">
        <div className="activity-bars-inner">
          {stats.datasets.map((d, i) => (
            <div key={i} className="activity-bar-col">
              <div className="activity-bar-stack">
                <div
                  className="activity-bar activity-bar-done"
                  style={{ height: `${(d.done / maxVal) * 100}%` }}
                  title={`Kész: ${d.done}`}
                />
                <div
                  className="activity-bar activity-bar-remaining"
                  style={{ height: `${((d.total - d.done) / maxVal) * 100}%` }}
                  title={`Folyamatban: ${d.total - d.done}`}
                />
              </div>
              <span className="activity-bar-label">
                {stats.labels[i]?.length > 8 ? stats.labels[i]?.slice(0, 8) : stats.labels[i]}
              </span>
              <span className="activity-bar-count">{d.total} / {d.done}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react';
import { Meeting, MeetingNote } from '../types';

const SAMPLE_MEETINGS: Meeting[] = [
  { id: '1', title: 'Filtranova tárgyalás', date: '2026-04-28', duration: '45min', status: 'ended', summary: 'Árazási stratégia és szolgáltatási csomag' },
  { id: '2', title: 'Reality Alpia bemutatkozás', date: '2026-04-29', duration: '30min', status: 'active', summary: 'Ügynökségi együttműködés' },
  { id: '3', title: 'n8n workflow tervezés', date: '2026-04-27', duration: '60min', status: 'ended', summary: 'Súgó és Automata architektúra' },
  { id: '4', title: 'Heti stratégiai meeting', date: '2026-04-26', duration: '90min', status: 'ended', summary: 'Express Strategy és revenue timeline' },
  { id: '5', title: 'Ügyfél konzultáció - Innovi', date: '2026-04-25', duration: '35min', status: 'ended', summary: 'RAG rendszer telepítés' },
];

const SAMPLE_NOTE: MeetingNote = {
  id: '1',
  sessionId: '1',
  title: 'Filtranova tárgyalás - Árazási stratégia',
  date: '2026-04-28',
  duration: '45 perc',
  status: 'Elkészült',
  participants: ['Balázs', 'Filtranova képviselő'],
  keyDecisions: [
    'Alap csomag: €99/hó (3 workflow)',
    'Prémium csomag: €249/hó (10 workflow)',
    'Enterprise: egyedi árazás'
  ],
  nextSteps: [
    'Balázs elküldi a szerződéstervezetet',
    'Demonstratedélután 14:00-kor',
    'Első számla: május 1.'
  ],
  importantDetails: [
    'Az ügyfél háromszor említette az árat → árérzékenyek',
    'Odoo integrációt kértek első körben',
    '6 hónapos szerződést preferálnak'
  ],
  rawTranscript: `Balázs: Köszönöm hogy eljöttek. A szolgáltatásunk három szinten érhető el.
Ügyfél: Mi az alap csomag ára?
Balázs: €99 havonta, ez 3 workflow-t tartalmaz.
Ügyfél: És ez tartalmazza a támogatást is?
Balázs: Igen, email support 24 órás válaszidővel.
Ügyfél: Nekünk Odoo integráció kellene.
Balázs: Az a prémium csomagban van, €249.

[... teljes átirat további részei ...]`
};

export default function NotesPage() {
  const [meetings] = useState<Meeting[]>(SAMPLE_MEETINGS);
  const [selectedId, setSelectedId] = useState<string>('1');
  const [note] = useState<MeetingNote>(SAMPLE_NOTE);

  return (
    <div className="notes-container">
      {/* Left Sidebar - Meeting List */}
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <h2>
            <span className="icon">📋</span> Jegyzetek
          </h2>
          <div className="search-box">
            <input type="text" placeholder="Keresés..." className="search-input" />
          </div>
        </div>
        <div className="meeting-list">
          {meetings.map(m => (
            <div
              key={m.id}
              className={`meeting-item ${m.id === selectedId ? 'active' : ''}`}
              onClick={() => setSelectedId(m.id)}
            >
              <div className="meeting-item-header">
                <span className="meeting-title">{m.title}</span>
                <span className={`status-badge ${m.status}`}>
                  {m.status === 'active' ? '🔴 Élő' : '✅ Kész'}
                </span>
              </div>
              <div className="meeting-meta">
                <span>📅 {m.date}</span>
                <span>⏱️ {m.duration}</span>
              </div>
              <div className="meeting-summary">{m.summary}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Meeting Detail */}
      <div className="notes-detail">
        <div className="notes-detail-header">
          <div>
            <h2>{note.title}</h2>
            <div className="notes-meta">
              <span>📅 {note.date}</span>
              <span>⏱️ {note.duration}</span>
              <span className={`status-badge ${note.status === 'Elkészült' ? 'ended' : 'active'}`}>
                {note.status}
              </span>
            </div>
          </div>
          <div className="notes-actions">
            <button className="btn btn-secondary">📄 PDF</button>
            <button className="btn btn-secondary">📝 Markdown</button>
            <button className="btn btn-primary">📤 Küldés</button>
          </div>
        </div>

        {/* Participants */}
        <div className="notes-section">
          <h3>👥 Résztvevők</h3>
          <div className="participants-list">
            {note.participants.map((p, i) => (
              <span key={i} className="participant-tag">{p}</span>
            ))}
          </div>
        </div>

        {/* Key Decisions */}
        <div className="notes-section">
          <h3>🎯 Döntések</h3>
          <ul className="notes-list">
            {note.keyDecisions.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        <div className="notes-section">
          <h3>⏭️ Következő lépések</h3>
          <ul className="notes-list next-steps">
            {note.nextSteps.map((s, i) => (
              <li key={i}>
                <input type="checkbox" className="step-checkbox" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Important Details */}
        <div className="notes-section">
          <h3>💡 Fontos részletek</h3>
          <ul className="notes-list">
            {note.importantDetails.map((d, i) => (
              <li key={i}>
                <span className="detail-icon">🔍</span>
                {d}
              </li>
            ))}
          </ul>
        </div>

        {/* Raw Transcript (Collapsible) */}
        <div className="notes-section">
          <details>
            <summary>
              <h3 style={{ display: 'inline' }}>📝 Teljes átirat</h3>
              <span className="expand-hint">(kattints a kibontáshoz)</span>
            </summary>
            <pre className="transcript">{note.rawTranscript}</pre>
          </details>
        </div>

        {/* Integration Settings */}
        <div className="notes-section integrations">
          <h3>🔗 Integrációk</h3>
          <div className="integration-grid">
            {[
              { name: 'Telegram', icon: '✈️', enabled: true, color: '#0088cc' },
              { name: 'E-mail', icon: '📧', enabled: true, color: '#ea4335' },
              { name: 'Notion', icon: '📓', enabled: false, color: '#000' },
              { name: 'Google Docs', icon: '📄', enabled: false, color: '#4285f4' },
              { name: 'Slack', icon: '💬', enabled: false, color: '#4a154b' },
              { name: 'Trello', icon: '📌', enabled: false, color: '#0079bf' },
            ].map((integ, i) => (
              <div key={i} className={`integration-card ${integ.enabled ? 'enabled' : ''}`}>
                <div className="integration-header">
                  <span className="integration-icon" style={{ color: integ.color }}>{integ.icon}</span>
                  <span className="integration-name">{integ.name}</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked={integ.enabled} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

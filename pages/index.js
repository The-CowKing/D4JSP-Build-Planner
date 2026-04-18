import React, { useState, useEffect } from 'react';
import BuildPlanner from '../components/BuildPlanner';
import { DESIGN } from '../lib/constants';

const BUILD_SHA = process.env.NEXT_PUBLIC_GIT_SHA ?? '—';
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME ?? null;

function DeployStatus() {
  const [live, setLive] = useState(null); // null=loading, string=sha, false=error

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setLive(d.commit ?? 'unknown'))
      .catch(() => setLive(false));
  }, []);

  const match = live === BUILD_SHA;
  const color = live === null ? 'rgba(255,255,255,0.3)' : live === false ? '#e53935' : match ? '#4caf50' : '#ff9800';
  const label = live === null ? 'checking…' : live === false ? 'unreachable' : match ? `live @ ${live}` : `deploy mismatch — built ${BUILD_SHA}, live ${live}`;

  return (
    <div
      title={`Built: ${BUILD_TIME ?? 'unknown'} | Live SHA: ${live ?? '…'}`}
      style={{
        position: 'fixed',
        bottom: '12px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontFamily: 'monospace',
        color: 'rgba(255,255,255,0.45)',
        zIndex: 9999,
        userSelect: 'none',
      }}
    >
      <span style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: color, flexShrink: 0,
        boxShadow: `0 0 6px ${color}`,
      }} />
      {label}
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ background: DESIGN.background, minHeight: '100vh', padding: '20px' }}>
      <BuildPlanner />
      <DeployStatus />
    </div>
  );
}

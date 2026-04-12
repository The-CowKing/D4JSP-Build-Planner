import React from 'react';
import BuildPlanner from '../components/BuildPlanner';
import { DESIGN } from '../lib/constants';

export default function Home() {
  return (
    <div style={{ background: DESIGN.background, minHeight: '100vh', padding: '20px' }}>
      <BuildPlanner />
    </div>
  );
}

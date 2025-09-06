import React from 'react'
// Import directly from src for live development
import { SpeakerStatus } from '../src/index.js'

export default function App() {
  return (
    <div style={{
      maxWidth: 860,
      margin: '24px auto',
      padding: 16
    }}>
      <h2 style={{marginTop: 0}}>Speaker Detector – Demo</h2>
      <SpeakerStatus />
    </div>
  )
}

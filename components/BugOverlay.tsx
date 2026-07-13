'use client'

import React, { useEffect, useRef, useState } from 'react'

interface Bug {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  type: 'fly' | 'ant' | 'moth' | 'beetle'
  angle: number
  size: number
  phase: number
  wingFlap: number
}

const BUG_COUNT = 18

function makeBug(id: number): Bug {
  const types: Bug['type'][] = ['fly', 'ant', 'moth', 'beetle']
  return {
    id,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 2.5,
    vy: (Math.random() - 0.5) * 2.5,
    type: types[Math.floor(Math.random() * types.length)],
    angle: Math.random() * 360,
    size: 14 + Math.random() * 12,
    phase: Math.random() * Math.PI * 2,
    wingFlap: 0,
  }
}

function BugSvg({ type, size, wingFlap }: { type: Bug['type']; size: number; wingFlap: number }) {
  const w = wingFlap % 2 > 1 ? -1 : 1
  if (type === 'fly' || type === 'moth') {
    return (
      <svg width={size * 1.8} height={size * 1.6} viewBox="0 0 36 32" style={{ overflow: 'visible' }}>
        <ellipse cx="18" cy="14" rx={12 + wingFlap * 2} ry="7" fill="rgba(80,80,80,0.45)" transform={`skewY(${w * 8})`} />
        <ellipse cx="18" cy="18" rx={10 + wingFlap * 1.5} ry="5" fill="rgba(80,80,80,0.3)" transform={`skewY(${-w * 6})`} />
        <ellipse cx="18" cy="16" rx="4" ry="9" fill={type === 'moth' ? '#5a4a3a' : '#2a2a2a'} />
        <circle cx="18" cy="7" r="3.5" fill={type === 'moth' ? '#5a4a3a' : '#1a1a1a'} />
        <circle cx="16.5" cy="6.5" r="1" fill="#ff4444" />
        <circle cx="19.5" cy="6.5" r="1" fill="#ff4444" />
        <line x1="17" y1="4" x2="13" y2="1" stroke="#2a2a2a" strokeWidth="0.8" />
        <line x1="19" y1="4" x2="23" y2="1" stroke="#2a2a2a" strokeWidth="0.8" />
        <line x1="15" y1="14" x2="10" y2="17" stroke="#333" strokeWidth="0.8" />
        <line x1="15" y1="17" x2="9" y2="20" stroke="#333" strokeWidth="0.8" />
        <line x1="21" y1="14" x2="26" y2="17" stroke="#333" strokeWidth="0.8" />
        <line x1="21" y1="17" x2="27" y2="20" stroke="#333" strokeWidth="0.8" />
      </svg>
    )
  }
  if (type === 'ant') {
    return (
      <svg width={size * 1.4} height={size * 1.8} viewBox="0 0 28 40" style={{ overflow: 'visible' }}>
        <ellipse cx="14" cy="8" rx="3.5" ry="3.5" fill="#1a1a1a" />
        <ellipse cx="14" cy="18" rx="3" ry="5" fill="#2a2a2a" />
        <ellipse cx="14" cy="30" rx="4" ry="6" fill="#1a1a1a" />
        <line x1="11" y1="5" x2="6" y2="2" stroke="#111" strokeWidth="0.8" />
        <line x1="17" y1="5" x2="22" y2="2" stroke="#111" strokeWidth="0.8" />
        <line x1="11" y1="16" x2="5" y2="13" stroke="#333" strokeWidth="1" />
        <line x1="11" y1="19" x2="4" y2="18" stroke="#333" strokeWidth="1" />
        <line x1="11" y1="22" x2="5" y2="25" stroke="#333" strokeWidth="1" />
        <line x1="17" y1="16" x2="23" y2="13" stroke="#333" strokeWidth="1" />
        <line x1="17" y1="19" x2="24" y2="18" stroke="#333" strokeWidth="1" />
        <line x1="17" y1="22" x2="23" y2="25" stroke="#333" strokeWidth="1" />
        <circle cx="12.5" cy="7.5" r="0.8" fill="#444" />
        <circle cx="15.5" cy="7.5" r="0.8" fill="#444" />
      </svg>
    )
  }
  return (
    <svg width={size * 1.5} height={size * 1.8} viewBox="0 0 30 36" style={{ overflow: 'visible' }}>
      <ellipse cx="15" cy="8" rx="4" ry="4" fill="#1a2a1a" />
      <ellipse cx="15" cy="22" rx="8" ry="11" fill="#1a3a1a" />
      <line x1="15" y1="11" x2="15" y2="33" stroke="#0a1a0a" strokeWidth="1.2" />
      <ellipse cx="15" cy="22" rx="6" ry="9" fill="none" stroke="#2a4a2a" strokeWidth="0.5" />
      <circle cx="13" cy="7.5" r="0.9" fill="#ff4444" />
      <circle cx="17" cy="7.5" r="0.9" fill="#ff4444" />
      <line x1="12" y1="5" x2="7" y2="2" stroke="#1a1a1a" strokeWidth="0.9" />
      <line x1="18" y1="5" x2="23" y2="2" stroke="#1a1a1a" strokeWidth="0.9" />
      <line x1="8" y1="18" x2="2" y2="15" stroke="#333" strokeWidth="1" />
      <line x1="8" y1="22" x2="2" y2="22" stroke="#333" strokeWidth="1" />
      <line x1="8" y1="26" x2="3" y2="29" stroke="#333" strokeWidth="1" />
      <line x1="22" y1="18" x2="28" y2="15" stroke="#333" strokeWidth="1" />
      <line x1="22" y1="22" x2="28" y2="22" stroke="#333" strokeWidth="1" />
      <line x1="22" y1="26" x2="27" y2="29" stroke="#333" strokeWidth="1" />
    </svg>
  )
}

export default function BugOverlay({ onKeepLight, onSwitchDark }: { onKeepLight: () => void; onSwitchDark: () => void }) {
  const [bugs, setBugs] = useState<Bug[]>(() => Array.from({ length: BUG_COUNT }, (_, i) => makeBug(i)))
  const [showPopup, setShowPopup] = useState(false)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const timer = setTimeout(() => setShowPopup(true), 1800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let t = 0
    const animate = () => {
      t += 0.05
      setBugs(prev => prev.map(bug => {
        let { x, y, vx, vy, angle, phase, wingFlap } = bug

        if (bug.type === 'fly' || bug.type === 'moth') {
          const cx = window.innerWidth / 2
          const cy = window.innerHeight / 2
          const dx = cx - x
          const dy = cy - y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 80) {
            vx += (dx / dist) * 0.12 + (Math.random() - 0.5) * 0.4
            vy += (dy / dist) * 0.12 + (Math.random() - 0.5) * 0.4
          } else {
            vx += (Math.random() - 0.5) * 0.8
            vy += (Math.random() - 0.5) * 0.8
          }
          const speed = Math.sqrt(vx * vx + vy * vy)
          if (speed > 3.5) { vx = (vx / speed) * 3.5; vy = (vy / speed) * 3.5 }
          wingFlap = (t * 8 + phase) % 4
        } else {
          vx += (Math.random() - 0.5) * 0.3
          vy += (Math.random() - 0.5) * 0.3
          const speed = Math.sqrt(vx * vx + vy * vy)
          if (speed > 1.4) { vx = (vx / speed) * 1.4; vy = (vy / speed) * 1.4 }
          wingFlap = 0
        }

        x += vx
        y += vy
        angle = Math.atan2(vy, vx) * (180 / Math.PI) + 90

        if (x < 0) { x = 0; vx = Math.abs(vx) }
        if (x > window.innerWidth) { x = window.innerWidth; vx = -Math.abs(vx) }
        if (y < 0) { y = 0; vy = Math.abs(vy) }
        if (y > window.innerHeight) { y = window.innerHeight; vy = -Math.abs(vy) }

        return { ...bug, x, y, vx, vy, angle, wingFlap }
      }))
      frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          zIndex: 9990, overflow: 'hidden',
        }}
      >
        {bugs.map(bug => (
          <div
            key={bug.id}
            style={{
              position: 'absolute',
              left: bug.x,
              top: bug.y,
              transform: `translate(-50%,-50%) rotate(${bug.angle}deg)`,
              opacity: 0.88,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
            }}
          >
            <BugSvg type={bug.type} size={bug.size} wingFlap={bug.wingFlap} />
          </div>
        ))}
      </div>

      {showPopup && (
        <div className="bug-popup-overlay">
          <div className="bug-popup">
            <div className="bug-popup-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="56" height="56">
                <ellipse cx="32" cy="34" rx="11" ry="16" fill="#2a2a2a" />
                <line x1="32" y1="20" x2="32" y2="50" stroke="#1a1a1a" strokeWidth="2" />
                <line x1="24" y1="14" x2="18" y2="6" />
                <line x1="40" y1="14" x2="46" y2="6" />
                <circle cx="27" cy="24" r="2.5" fill="#1a1a1a" />
                <circle cx="37" cy="24" r="2.5" fill="#1a1a1a" />
                <path d="M21 30 Q10 28 6 22" />
                <path d="M43 30 Q54 28 58 22" />
                <path d="M21 38 Q8 38 4 34" />
                <path d="M43 38 Q56 38 60 34" />
                <path d="M22 46 Q12 50 8 56" />
                <path d="M42 46 Q52 50 56 56" />
              </svg>
            </div>
            <h2 className="bug-popup-title">Light attracts bugs!</h2>
            <p className="bug-popup-body">
              You switched to light mode... and now your screen is infested.<br />
              Maybe dark mode was better after all.
            </p>
            <div className="bug-popup-actions">
              <button className="btn-primary" onClick={onKeepLight}>
                Keep light mode (I like bugs)
              </button>
              <button className="bug-popup-dark-btn" onClick={onSwitchDark}>
                Switch back to dark mode
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


export default BugOverlay
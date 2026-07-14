import React, { useEffect, useRef, useState } from 'react'
import './BugOverlay.css'

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
  dead: boolean
}

interface Food {
  id: number
  x: number
  y: number
  icon: string
}

const BUG_COUNT = 18
const FOOD_COUNT = 5

function makeFood(id: number): Food {
  const icons = ['🍪', '🍕', '🍎', '🧀', '🍩']
  return {
    id,
    x: 70 + Math.random() * Math.max(100, window.innerWidth - 140),
    y: 90 + Math.random() * Math.max(100, window.innerHeight - 180),
    icon: icons[id % icons.length],
  }
}

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
    dead: false,
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
      </svg>
    )
  }
  if (type === 'ant') {
    return (
      <svg width={size * 1.4} height={size * 1.8} viewBox="0 0 28 40" style={{ overflow: 'visible' }}>
        <ellipse cx="14" cy="8" rx="3.5" ry="3.5" fill="#1a1a1a" />
        <ellipse cx="14" cy="18" rx="3" ry="5" fill="#2a2a2a" />
        <ellipse cx="14" cy="30" rx="4" ry="6" fill="#1a1a1a" />
      </svg>
    )
  }
  return (
    <svg width={size * 1.5} height={size * 1.8} viewBox="0 0 30 36" style={{ overflow: 'visible' }}>
      <ellipse cx="15" cy="8" rx="4" ry="4" fill="#1a2a1a" />
      <ellipse cx="15" cy="22" rx="8" ry="11" fill="#1a3a1a" />
    </svg>
  )
}

export default function BugOverlay({ onKeepLight, onSwitchDark }: { onKeepLight?: () => void; onSwitchDark?: () => void }) {
  const [bugs, setBugs] = useState<Bug[]>(() => Array.from({ length: BUG_COUNT }, (_, i) => makeBug(i)))
  const [food, setFood] = useState<Food[]>(() => Array.from({ length: FOOD_COUNT }, (_, i) => makeFood(i)))
  const [showPopup, setShowPopup] = useState(false)
  const frameRef = useRef<number>(0)
  const nextBugIdRef = useRef(BUG_COUNT)
  const foodRef = useRef(food)
  const draggingFoodRef = useRef<number | null>(null)

  useEffect(() => { foodRef.current = food }, [food])

  useEffect(() => {
    const spawner = window.setInterval(() => {
      setBugs(current => {
        const livingCount = current.filter(bug => !bug.dead).length
        if (livingCount >= BUG_COUNT) return current
        return [...current, makeBug(nextBugIdRef.current++)]
      })
    }, 5000)
    return () => window.clearInterval(spawner)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowPopup(true), 1600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let t = 0
    const animate = () => {
      t += 0.05
      setBugs(prev => prev.map(bug => {
        if (bug.dead) return bug
        let { x, y, vx, vy, angle, phase, wingFlap } = bug
        const nearestFood = foodRef.current.reduce<Food | null>((nearest, item) => {
          if (!nearest) return item
          const itemDistance = (item.x - x) ** 2 + (item.y - y) ** 2
          const nearestDistance = (nearest.x - x) ** 2 + (nearest.y - y) ** 2
          return itemDistance < nearestDistance ? item : nearest
        }, null)
        const targetX = nearestFood?.x ?? window.innerWidth / 2
        const targetY = nearestFood?.y ?? window.innerHeight / 2
        const dx = targetX - x
        const dy = targetY - y
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        if (bug.type === 'fly' || bug.type === 'moth') {
          if (dist > 38) {
            vx += (dx / dist) * 0.16 + (Math.random() - 0.5) * 0.34
            vy += (dy / dist) * 0.16 + (Math.random() - 0.5) * 0.34
          } else {
            vx += (Math.random() - 0.5) * 0.8
            vy += (Math.random() - 0.5) * 0.8
          }
          const speed = Math.sqrt(vx * vx + vy * vy)
          if (speed > 3.5) { vx = (vx / speed) * 3.5; vy = (vy / speed) * 3.5 }
          wingFlap = (t * 8 + phase) % 4
        } else {
          vx += (dx / dist) * 0.075 + (Math.random() - 0.5) * 0.22
          vy += (dy / dist) * 0.075 + (Math.random() - 0.5) * 0.22
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

  const moveFood = (event: React.PointerEvent<HTMLButtonElement>, id: number) => {
    if (draggingFoodRef.current !== id) return
    setFood(current => current.map(item => item.id === id ? {
      ...item,
      x: Math.max(28, Math.min(window.innerWidth - 28, event.clientX)),
      y: Math.max(28, Math.min(window.innerHeight - 28, event.clientY)),
    } : item))
  }

  const stopDraggingFood = (event: React.PointerEvent<HTMLButtonElement>) => {
    draggingFoodRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9990, overflow: 'hidden' }}>
        {food.map(item => (
          <button
            key={`food-${item.id}`}
            type="button"
            aria-label={`Drag food ${item.icon}`}
            title="Drag me — the bugs will follow"
            onPointerDown={event => { draggingFoodRef.current = item.id; event.currentTarget.setPointerCapture(event.pointerId) }}
            onPointerMove={event => moveFood(event, item.id)}
            onPointerUp={stopDraggingFood}
            onPointerCancel={stopDraggingFood}
            style={{ position: 'absolute', zIndex: 2, left: item.x, top: item.y, transform: 'translate(-50%,-50%)', pointerEvents: 'auto', touchAction: 'none', cursor: 'grab', border: 0, padding: 7, borderRadius: '50%', background: 'rgba(255,255,255,.78)', boxShadow: '0 3px 14px rgba(0,0,0,.2)', fontSize: 24, lineHeight: 1 }}
          >
            {item.icon}
          </button>
        ))}
        {bugs.map(bug => (
          <button type="button" aria-label={`${bug.dead ? 'Squashed' : 'Squash'} ${bug.type}`} title={bug.dead ? 'Squashed bug' : 'Click to squash'} disabled={bug.dead} onClick={() => setBugs(current => current.map(item => item.id === bug.id ? { ...item, dead: true, vx: 0, vy: 0 } : item))} key={bug.id} className={`bug-creature ${bug.dead ? 'bug-creature-dead' : ''}`} style={{ position: 'absolute', zIndex: 1, left: bug.x, top: bug.y, '--bug-angle': `${bug.angle}deg` } as React.CSSProperties}>
            {bug.dead && <span className="bug-blood" aria-hidden="true" />}
            <BugSvg type={bug.type} size={bug.size} wingFlap={bug.wingFlap} />
          </button>
        ))}
      </div>

      {showPopup && (
        <div className="bug-popup-overlay">
          <div className="bug-popup">
            <div className="bug-popup-icon" aria-hidden={true}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="4" fill="#fff" />
                <path d="M7 12h10" stroke="#f97316" strokeWidth={1.5} strokeLinecap="round" />
                <path d="M7 8h10" stroke="#f97316" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="bug-popup-title">Light attracts bugs!</h2>
            <p className="bug-popup-body">You switched to light mode... and now your screen is infested. Maybe dark mode was better after all.</p>
            <div className="bug-popup-actions">
              <button className="btn-primary" onClick={() => { setShowPopup(false); onKeepLight?.() }}>
                Keep light mode (I like bugs)
              </button>
              <button className="bug-popup-dark-btn" onClick={() => { setShowPopup(false); onSwitchDark?.() }}>
                Switch back to dark mode
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

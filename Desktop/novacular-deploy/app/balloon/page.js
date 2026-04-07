'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

function BalloonSVG({ twists, onTwistClick }) {
  const released = twists.filter(t => t.released).length
  const smooth = twists.length > 0 ? released / twists.length : 0
  const allDone = smooth >= 1

  const getPath = () => {
    const active = twists.filter(t => !t.released).length
    if (active === 0) return 'M 200,60 C 280,60 320,140 320,200 C 320,280 280,340 200,340 C 120,340 80,280 80,200 C 80,140 120,60 200,60 Z'
    const p = active * 8, w = active * 5
    return `M 200,${55-w} C ${280+w},${70-p} ${315+p},${130+w} ${320+w/2},${185-p/2} C ${325-w},${200+p} ${310+p/2},${220-w/2} ${305+w},${260+p/3} C ${290-p/2},${310+w} ${260+w/2},${345+p/2} 200,${345+w/2} C ${140-w/2},${345+p/2} ${110+p/2},${310+w} ${95-w},${260+p/3} C ${90+w},${220-w/2} ${75+w},${200+p} ${80-w/2},${185-p/2} C ${85-p},${130+w} ${120-w},${70-p} 200,${55-w} Z`
  }

  return (
    <svg viewBox="0 0 400 420" style={{ width: '100%', maxWidth: 340, margin: '0 auto', display: 'block' }}>
      <defs>
        <radialGradient id="bg" cx="40%" cy="35%">
          <stop offset="0%" stopColor={allDone ? '#c4956a' : smooth > 0.5 ? '#8a7a6a' : '#6a4a3a'} stopOpacity="0.9" />
          <stop offset="100%" stopColor={allDone ? 'rgba(196,149,106,0.15)' : 'rgba(60,30,20,0.6)'} stopOpacity="0.4" />
        </radialGradient>
        <filter id="g"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="sg"><feGaussianBlur stdDeviation="8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>      {allDone && <circle cx="200" cy="200" r="160" fill="none" stroke="#c4956a" strokeWidth="0.5" opacity="0.2" filter="url(#sg)" />}
      <path d={getPath()} fill="url(#bg)" stroke={allDone ? '#c4956a' : '#8a8680'} strokeWidth={allDone ? 1.5 : 1} filter={allDone ? 'url(#sg)' : 'none'} style={{ transition: 'all 1.5s cubic-bezier(0.4,0,0.2,1)' }} />
      {allDone && <text x="200" y="205" textAnchor="middle" fill="#c4956a" fontSize="13" fontFamily="Georgia,serif" fontStyle="italic" opacity="0.8">air</text>}
      {!allDone && <line x1="200" y1="345" x2="200" y2="400" stroke="#8a8680" strokeWidth="1.5" opacity="0.4" />}
      {twists.map((t, i) => {
        const angle = ((i + 0.5) / twists.length) * Math.PI * 2 - Math.PI / 2
        const r = 100 + (t.released ? 10 : 25)
        const x = 200 + Math.cos(angle) * r, y = 200 + Math.sin(angle) * r
        return (
          <g key={i} style={{ cursor: t.released ? 'default' : 'pointer', transition: 'all 0.8s ease' }} onClick={() => !t.released && onTwistClick(i)}>
            {!t.released && <line x1="200" y1="200" x2={x} y2={y} stroke="#e85d4a" strokeWidth="1" opacity="0.3" strokeDasharray="3,3" />}
            <circle cx={x} cy={y} r={t.released ? 4 : 10} fill={t.released ? '#6aaa8e' : '#e85d4a'} opacity={t.released ? 0.3 : 0.85} filter={t.released ? 'none' : 'url(#g)'} style={{ transition: 'all 0.8s ease' }} />
            {!t.released && <text x={x} y={y + (y > 200 ? 22 : -15)} textAnchor="middle" fill="#e8e4df" fontSize="10" fontFamily="Georgia,serif" opacity="0.9">{t.name}</text>}
          </g>
        )
      })}
    </svg>
  )
}
export default function BalloonPage() {
  const [phase, setPhase] = useState('entry')
  const [input, setInput] = useState('')
  const [twists, setTwists] = useState([])
  const [selected, setSelected] = useState(null)
  const [releaseText, setReleaseText] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  useEffect(() => { if (phase === 'entry' && ref.current) ref.current.focus() }, [phase])

  async function analyze() {
    if (!input.trim()) return
    setLoading(true); setPhase('analyzing')
    try {
      const res = await fetch('/api/balloon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: input.trim() }) })
      const data = await res.json()
      if (data.twists) { setTwists(data.twists.map(t => ({ ...t, released: false }))); setPhase('balloon') }
      else { setPhase('entry') }
    } catch { setPhase('entry') }
    setLoading(false)
  }

  async function release() {
    if (selected === null) return
    const tw = twists[selected]
    setLoading(true)
    try {
      const res = await fetch('/api/balloon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: input.trim(), mode: 'release', twistName: tw.name, twistConstrains: tw.constrains }) })
      const data = await res.json()
      setReleaseText(data.release || '')
      const updated = [...twists]; updated[selected] = { ...updated[selected], released: true }; setTwists(updated); setSelected(null)
      if (updated.every(t => t.released)) setTimeout(() => setPhase('air'), 2000)
    } catch {}
    setLoading(false)
  }
  const restart = () => { setPhase('entry'); setInput(''); setTwists([]); setSelected(null); setReleaseText('') }
  const allReleased = twists.length > 0 && twists.every(t => t.released)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Crimson Pro', Georgia, serif", padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e8e4df' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>

      {phase === 'entry' && (
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center', animation: 'fadeIn 1s ease-out' }}>
          <Link href="/" style={{ color: '#333', textDecoration: 'none', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>&larr; Novacular</Link>
          <div style={{ marginTop: 48, marginBottom: 8, fontSize: 11, letterSpacing: '0.4em', color: '#e0e0e0', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>THE BALLOON</div>
          <div style={{ fontSize: 14, color: '#555', marginBottom: 48, fontWeight: 300, fontStyle: 'italic' }}>a recognition instrument</div>
          <p style={{ fontSize: 15, color: '#8a8680', marginBottom: 32, lineHeight: 1.7 }}>What are you carrying?</p>
          <textarea ref={ref} value={input} onChange={e => setInput(e.target.value)} placeholder="A fight with someone I love. A decision I can't make. A fear I won't name. Anything."
            style={{ width: '100%', minHeight: 120, background: '#12121a', border: '1px solid rgba(196,149,106,0.2)', borderRadius: 8, color: '#e8e4df', fontSize: 15, fontFamily: 'Georgia,serif', padding: '16px 20px', resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'rgba(196,149,106,0.5)'} onBlur={e => e.target.style.borderColor = 'rgba(196,149,106,0.2)'} />
          <button onClick={analyze} disabled={!input.trim()}
            style={{ marginTop: 24, padding: '12px 48px', background: input.trim() ? '#c4956a' : 'transparent', color: input.trim() ? '#0a0a0f' : '#8a8680', border: input.trim() ? 'none' : '1px solid #8a8680', borderRadius: 6, fontSize: 14, fontFamily: 'Georgia,serif', cursor: input.trim() ? 'pointer' : 'default', letterSpacing: '0.05em' }}>
            show me the twists
          </button>
        </div>
      )}
      {phase === 'analyzing' && (
        <p style={{ color: '#8a8680', fontStyle: 'italic', fontSize: 15, animation: 'pulse 2s infinite' }}>finding the twists...</p>
      )}

      {(phase === 'balloon' || phase === 'air') && (
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center', animation: 'fadeIn 1s ease-out' }}>
          <Link href="/" style={{ color: '#333', textDecoration: 'none', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>&larr; Novacular</Link>
          <div style={{ marginTop: 24 }}>
            <BalloonSVG twists={twists} onTwistClick={i => setSelected(i)} />
          </div>

          {selected !== null && !twists[selected].released && (
            <div style={{ marginTop: 24, padding: 24, background: '#12121a', borderRadius: 12, border: '1px solid rgba(232,93,74,0.3)', textAlign: 'left' }}>
              <p style={{ fontSize: 16, color: '#e85d4a', marginBottom: 8, fontWeight: 600 }}>{twists[selected].name}</p>
              <p style={{ fontSize: 14, color: '#8a8680', lineHeight: 1.7, marginBottom: 20 }}>{twists[selected].constrains}</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={release} disabled={loading} style={{ flex: 1, padding: 10, background: loading ? '#12121a' : '#6aaa8e', color: loading ? '#8a8680' : '#0a0a0f', border: 'none', borderRadius: 6, fontSize: 13, fontFamily: 'Georgia,serif', cursor: loading ? 'wait' : 'pointer' }}>
                  {loading ? 'untwisting...' : 'release'}
                </button>
                <button onClick={() => { setSelected(null); setReleaseText('') }} style={{ flex: 1, padding: 10, background: 'transparent', color: '#8a8680', border: '1px solid rgba(138,134,128,0.3)', borderRadius: 6, fontSize: 13, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                  keep this one
                </button>
              </div>
            </div>
          )}

          {releaseText && (
            <div style={{ marginTop: 16, padding: '20px 24px', background: 'rgba(106,170,142,0.1)', borderRadius: 12, border: '1px solid rgba(106,170,142,0.2)' }}>
              <p style={{ fontSize: 14, color: '#e8e4df', lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>{releaseText}</p>
            </div>
          )}
          {selected === null && !allReleased && !releaseText && (
            <p style={{ marginTop: 24, fontSize: 13, color: '#8a8680', fontStyle: 'italic' }}>tap a twist to examine it</p>
          )}

          {phase === 'air' && (
            <div style={{ marginTop: 32 }}>
              <p style={{ fontSize: 18, color: '#c4956a', fontStyle: 'italic', marginBottom: 8 }}>The air was never the dog.</p>
              <p style={{ fontSize: 13, color: '#8a8680', lineHeight: 1.7 }}>Presence is the topological invariant of consciousness.<br />It survives every twist. It is the air.</p>
            </div>
          )}

          <button onClick={restart} style={{ marginTop: 32, padding: '8px 24px', background: 'transparent', color: '#8a8680', border: '1px solid rgba(138,134,128,0.2)', borderRadius: 6, fontSize: 12, fontFamily: 'Georgia,serif', cursor: 'pointer', opacity: 0.6 }}>begin again</button>
          <p style={{ marginTop: 20, fontSize: 10, color: '#8a8680', opacity: 0.4, fontFamily: "'JetBrains Mono', monospace" }}>R = C − A</p>
        </div>
      )}
    </div>
  )
}
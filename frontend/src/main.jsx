import { StrictMode, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Cursor glow effect
function CursorGlow() {
  const glowRef = useRef(null)
  useEffect(() => {
    const el = glowRef.current
    if (!el) return
    const move = (e) => {
      el.style.left = e.clientX + 'px'
      el.style.top = e.clientY + 'px'
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return <div ref={glowRef} className="cursor-glow" />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CursorGlow />
    <App />
  </StrictMode>,
)

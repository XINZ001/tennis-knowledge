import { useRef, useEffect, useCallback } from 'react'

export default function TiltCard({ children, className, style, onClick, tiltDeg = 8, noShine = false }) {
  const cardRef = useRef(null)
  const shineRef = useRef(null)
  const gyroRef = useRef(null)
  const baseOrientation = useRef(null)

  const applyTilt = useCallback((rotateX, rotateY, shineX, shineY) => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`

    if (!noShine && shineRef.current && shineX != null) {
      shineRef.current.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`
      shineRef.current.style.opacity = '1'
    }
  }, [])

  const resetTilt = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)'
    if (!noShine && shineRef.current) shineRef.current.style.opacity = '0'
  }, [])

  const handleMouseMove = (e) => {
    if (gyroRef.current) return
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    applyTilt(
      (y - centerY) / centerY * -tiltDeg,
      (x - centerX) / centerX * tiltDeg,
      (x / rect.width) * 100,
      (y / rect.height) * 100
    )
  }

  const handleMouseLeave = () => {
    if (gyroRef.current) return
    resetTilt()
  }

  const handleTouchMove = (e) => {
    const card = cardRef.current
    if (!card || e.touches.length === 0) return
    const touch = e.touches[0]
    const rect = card.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    applyTilt(
      (y - centerY) / centerY * -tiltDeg,
      (x - centerX) / centerX * tiltDeg,
      (x / rect.width) * 100,
      (y / rect.height) * 100
    )
  }

  const handleTouchEnd = () => { resetTilt() }

  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) return

    const handleOrientation = (e) => {
      if (e.beta == null || e.gamma == null) return
      if (!baseOrientation.current) {
        baseOrientation.current = { beta: e.beta, gamma: e.gamma }
        gyroRef.current = true
      }
      const dBeta = e.beta - baseOrientation.current.beta
      const dGamma = e.gamma - baseOrientation.current.gamma
      const clamp = (v, max) => Math.max(-max, Math.min(max, v))
      const rotateX = clamp(dBeta * 0.3, tiltDeg)
      const rotateY = clamp(dGamma * 0.3, tiltDeg)
      applyTilt(-rotateX, rotateY, 50 + rotateY / tiltDeg * 40, 50 - rotateX / tiltDeg * 40)
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const requestOnTouch = () => {
        DeviceOrientationEvent.requestPermission().then(state => {
          if (state === 'granted') window.addEventListener('deviceorientation', handleOrientation)
        }).catch(() => {})
        cardRef.current?.removeEventListener('touchstart', requestOnTouch)
      }
      cardRef.current?.addEventListener('touchstart', requestOnTouch, { once: true })
      return () => { window.removeEventListener('deviceorientation', handleOrientation) }
    } else {
      window.addEventListener('deviceorientation', handleOrientation)
      return () => { window.removeEventListener('deviceorientation', handleOrientation) }
    }
  }, [tiltDeg, applyTilt])

  return (
    <div
      ref={cardRef}
      className={className}
      style={{ ...style, transition: 'transform 0.2s ease-out', transformStyle: 'preserve-3d' }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      {!noShine && (
        <div
          ref={shineRef}
          className="absolute inset-0 pointer-events-none rounded-2xl z-10"
          style={{ opacity: 0, transition: 'opacity 0.2s' }}
        />
      )}
    </div>
  )
}

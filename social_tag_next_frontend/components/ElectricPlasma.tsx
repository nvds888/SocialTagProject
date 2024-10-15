'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

const ElectricPlasma: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(true)
  const particlesRef = useRef<{ x: number; y: number; size: number; speedX: number; speedY: number; color: string }[]>([])
  const animationFrameIdRef = useRef<number>()

  const createParticles = useCallback((width: number, height: number) => {
    const particles = []
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speedX: Math.random() * 0.2 - 0.1,
        speedY: Math.random() * 0.2 - 0.1,
        color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)`
      })
    }
    return particles
  }, [])

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2)
    gradient.addColorStop(0, `hsl(${200 + Math.sin(time / 5000) * 20}, 70%, 20%)`)
    gradient.addColorStop(1, `hsl(${220 + Math.sin(time / 5000) * 20}, 70%, 10%)`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }, [])

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    particlesRef.current.forEach(particle => {
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = particle.color
      ctx.globalAlpha = 0.5 + Math.sin(time / 1000 + particle.x + particle.y) * 0.3
      ctx.fill()
      ctx.globalAlpha = 1

      particle.x += particle.speedX
      particle.y += particle.speedY

      if (particle.x < 0) particle.x = width
      if (particle.x > width) particle.x = 0
      if (particle.y < 0) particle.y = height
      if (particle.y > height) particle.y = 0
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      particlesRef.current = createParticles(canvas.width, canvas.height)
    }

    resizeCanvas()

    const animate = (time: number) => {
      if (!isVisible) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawBackground(ctx, canvas.width, canvas.height, time)
      drawParticles(ctx, canvas.width, canvas.height, time)

      animationFrameIdRef.current = requestAnimationFrame(animate)
    }

    animate(0)

    window.addEventListener('resize', resizeCanvas)

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(canvas)

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
      observer.disconnect()
    }
  }, [isVisible, createParticles, drawBackground, drawParticles])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />
}

export default ElectricPlasma
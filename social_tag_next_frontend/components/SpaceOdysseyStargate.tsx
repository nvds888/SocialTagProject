'use client'

import React, { useEffect, useRef } from 'react'

export default function SpaceOdysseyStargateBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    const stars: { x: number; y: number; z: number; size: number }[] = []

    // Generate stars
    for (let i = 0; i < 1000; i++) {
      stars.push({
        x: Math.random() * canvas.width - centerX,
        y: Math.random() * canvas.height - centerY,
        z: Math.random() * 1000,
        size: Math.random() * 2 + 1
      })
    }

    function drawStars(time: number) {
      stars.forEach(star => {
        const x = (star.x / star.z) * 1000 + centerX
        const y = (star.y / star.z) * 1000 + centerY

        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
          const size = (1000 - star.z) / 1000 * star.size
          const brightness = (1000 - star.z) / 1000

          ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`
          ctx.fillRect(x, y, size, size)
        }

        star.z -= 2

        if (star.z <= 0) {
          star.z = 1000
          star.x = Math.random() * canvas.width - centerX
          star.y = Math.random() * canvas.height - centerY
        }
      })
    }

    function drawStargate(time: number) {
      const radius = Math.min(canvas.width, canvas.height) * 0.4
      const thickness = radius * 0.1

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(time * 0.0005)

      for (let i = 0; i < 360; i += 5) {
        const angle = (i * Math.PI) / 180
        const x = radius * Math.cos(angle)
        const y = radius * Math.sin(angle)

        ctx.fillStyle = `hsl(${(i + time * 0.05) % 360}, 100%, 50%)`
        ctx.fillRect(x - thickness / 2, y - thickness / 2, thickness, thickness)
      }

      ctx.restore()
    }

    function drawMonolith() {
      const width = Math.min(canvas.width, canvas.height) * 0.1
      const height = width * 4

      ctx.fillStyle = 'black'
      ctx.fillRect(centerX - width / 2, centerY - height / 2, width, height)

      // Add a subtle reflection
      const gradient = ctx.createLinearGradient(centerX - width / 2, 0, centerX + width / 2, 0)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.fillStyle = gradient
      ctx.fillRect(centerX - width / 2, centerY - height / 2, width, height)
    }

    function animate(time: number) {
      ctx.fillStyle = 'rgba(0, 0, 20, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      drawStars(time)
      drawStargate(time)
      drawMonolith()

      requestAnimationFrame(animate)
    }

    animate(0)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />
}
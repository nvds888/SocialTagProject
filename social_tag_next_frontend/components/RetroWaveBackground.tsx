'use client'

import React, { useEffect, useRef } from 'react'

const RetroWaveGrid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const gridSize = 20
    const perspectiveOffset = canvas.height / 2

    function drawGrid(time: number) {
      if (!ctx || !canvas) return
      ctx.fillStyle = 'rgba(0, 0, 50, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = '#FF00FF'
      ctx.lineWidth = 2

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        const offset = Math.sin(time * 0.001 + y * 0.01) * 20
        ctx.beginPath()
        ctx.moveTo(0, y + perspectiveOffset + offset)
        ctx.lineTo(canvas.width, y + perspectiveOffset + offset)
        ctx.stroke()
      }

      // Draw sun
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, perspectiveOffset, 0,
        canvas.width / 2, perspectiveOffset, 200
      )
      gradient.addColorStop(0, '#FF6B6B')
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(canvas.width / 2, perspectiveOffset, 200, 0, Math.PI * 2)
      ctx.fill()
    }

    function animate(time: number) {
      drawGrid(time)
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

export default RetroWaveGrid
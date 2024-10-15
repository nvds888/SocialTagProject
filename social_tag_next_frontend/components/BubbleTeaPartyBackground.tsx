'use client'

import React, { useEffect, useRef } from 'react'

const BubbleTeaPartyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const bubbles: {
      x: number
      y: number
      radius: number
      speed: number
      color: string
    }[] = []

    const colors = ['#FF9999', '#66B2FF', '#99FF99', '#FFFF99', '#FF99FF']

    for (let i = 0; i < 100; i++) {
      bubbles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        radius: Math.random() * 20 + 10,
        speed: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }

    function drawStraw(x: number, y: number) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y - 200)
      ctx.strokeStyle = '#FFA500'
      ctx.lineWidth = 20
      ctx.stroke()
    }

    function animate() {
      ctx.fillStyle = 'rgba(255, 228, 196, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      bubbles.forEach(bubble => {
        ctx.beginPath()
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2)
        ctx.fillStyle = bubble.color
        ctx.fill()

        bubble.y -= bubble.speed
        bubble.x += Math.sin(bubble.y * 0.02) * 0.5

        if (bubble.y < -bubble.radius) {
          bubble.y = canvas.height + bubble.radius
          bubble.x = Math.random() * canvas.width
        }
      })

      drawStraw(canvas.width / 2, canvas.height)

      requestAnimationFrame(animate)
    }

    animate()

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

export default BubbleTeaPartyBackground
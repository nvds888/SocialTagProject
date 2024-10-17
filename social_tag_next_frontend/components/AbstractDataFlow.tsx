'use client'

import React, { useEffect, useRef } from 'react'

const AbstractDataFlow: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const dataPoints: { x: number; y: number; size: number; speed: number; connections: number[] }[] = []
    const dataCount = 50

    for (let i = 0; i < dataCount; i++) {
      dataPoints.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 2 + 0.5,
        connections: []
      })
    }

    function drawDataFlow(time: number) {
      if (ctx) {  // Add this null check
        ctx.fillStyle = 'rgba(0, 20, 40, 0.1)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

      dataPoints.forEach((point, index) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsl(${(time * 0.05 + index * 10) % 360}, 100%, 50%)`
        ctx.fill()

        point.y += point.speed
        point.x += Math.sin(time * 0.001 + index) * 0.5

        if (point.y > canvas.height) {
          point.y = 0
          point.x = Math.random() * canvas.width
        }

        // Connect nearby points
        dataPoints.forEach((otherPoint, otherIndex) => {
          if (index !== otherIndex) {
            const distance = Math.hypot(point.x - otherPoint.x, point.y - otherPoint.y)
            if (distance < 100) {
              ctx.beginPath()
              ctx.moveTo(point.x, point.y)
              ctx.lineTo(otherPoint.x, otherPoint.y)
              ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / 100})`
              ctx.stroke()
            }
          }
        })
      })
    }

    function animate(time: number) {
      drawDataFlow(time)
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

export default AbstractDataFlow
'use client'

import React, { useEffect, useRef } from 'react'

export default function NeonCitySkylineBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const buildings: {
      x: number
      width: number
      height: number
      windows: { x: number; y: number; width: number; height: number; on: boolean }[]
    }[] = []

    const neonSigns: {
      x: number
      y: number
      text: string
      color: string
    }[] = []

    // Generate buildings
    for (let i = 0; i < canvas.width; i += 50) {
      const height = Math.random() * canvas.height * 0.6 + canvas.height * 0.2
      const width = Math.random() * 30 + 30
      const windows = []
      for (let j = 0; j < height; j += 20) {
        for (let k = 0; k < width; k += 15) {
          windows.push({
            x: k,
            y: j,
            width: 10,
            height: 15,
            on: Math.random() > 0.5
          })
        }
      }
      buildings.push({ x: i, width, height, windows })
    }

    // Generate neon signs
    const neonTexts = ['OPEN', '24/7', 'BAR', 'HOTEL', 'DINER']
    const neonColors = ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0000', '#00FF00']
    for (let i = 0; i < 5; i++) {
      neonSigns.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5 + canvas.height * 0.2,
        text: neonTexts[Math.floor(Math.random() * neonTexts.length)],
        color: neonColors[Math.floor(Math.random() * neonColors.length)]
      })
    }

    function drawRain() {
      if (!ctx || !canvas) return;
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)'
      ctx.lineWidth = 1
      for (let i = 0; i < 100; i++) {
        ctx.beginPath()
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        ctx.moveTo(x, y)
        ctx.lineTo(x - 5, y + 10)
        ctx.stroke()
      }
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(0, 0, 10, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw buildings
      buildings.forEach(building => {
        ctx.fillStyle = '#111'
        ctx.fillRect(building.x, canvas.height - building.height, building.width, building.height)
        building.windows.forEach(window => {
          ctx.fillStyle = window.on ? 'rgba(255, 255, 200, 0.7)' : 'rgba(40, 40, 40, 0.6)'
          ctx.fillRect(
            building.x + window.x,
            canvas.height - building.height + window.y,
            window.width,
            window.height
          )
          if (Math.random() < 0.001) window.on = !window.on
        })
      })

      // Draw neon signs
      neonSigns.forEach(sign => {
        ctx.font = '20px Arial'
        ctx.fillStyle = sign.color
        ctx.shadowColor = sign.color
        ctx.shadowBlur = 10
        ctx.fillText(sign.text, sign.x, sign.y)
        ctx.shadowBlur = 0
      })

      drawRain()

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

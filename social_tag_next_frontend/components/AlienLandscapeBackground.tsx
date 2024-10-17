'use client'

import React, { useEffect, useRef } from 'react'

const AlienLandscapeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const alienPlants: {
      x: number
      y: number
      height: number
      width: number
      color: string
      swaySpeed: number
      swayAmount: number
    }[] = []

    const colors = ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA', '#AA00FF']

    for (let i = 0; i < 20; i++) {
      alienPlants.push({
        x: Math.random() * canvas.width,
        y: canvas.height,
        height: Math.random() * 200 + 100,
        width: Math.random() * 20 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        swaySpeed: Math.random() * 0.05 + 0.01,
        swayAmount: Math.random() * 20 + 10
      })
    }

    function drawAlienPlant(plant: typeof alienPlants[0], time: number) {
      if (!ctx) return
      ctx.beginPath()
      ctx.moveTo(plant.x, plant.y)
      for (let i = 0; i < plant.height; i += 10) {
        const sway = Math.sin(time * plant.swaySpeed + i * 0.1) * plant.swayAmount
        ctx.lineTo(plant.x + sway, plant.y - i)
      }
      ctx.strokeStyle = plant.color
      ctx.lineWidth = plant.width
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    function animate(time: number) {
      if (!ctx || !canvas) return
      ctx.fillStyle = 'rgba(50, 0, 50, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      alienPlants.forEach(plant => drawAlienPlant(plant, time))

      // Draw alien moons
      ctx.beginPath()
      ctx.arc(100, 100, 50, 0, Math.PI * 2)
      ctx.fillStyle = '#00FF00'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(canvas.width - 150, 200, 75, 0, Math.PI * 2)
      ctx.fillStyle = '#FF00FF'
      ctx.fill()

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

export default AlienLandscapeBackground
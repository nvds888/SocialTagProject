'use client'

import React, { useEffect, useRef } from 'react'

interface CoffeeItem {
  x: number
  y: number
  size: number
  rotation: number
  speed: number
  direction: number
}

const SustainableCoffeeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const coffeeBeansRef = useRef<CoffeeItem[]>([])
  const leavesRef = useRef<CoffeeItem[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()

    const initializeItems = () => {
      coffeeBeansRef.current = Array.from({ length: 20 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 20 + 10,
        rotation: Math.random() * Math.PI,
        speed: Math.random() * 0.2 + 0.1,
        direction: Math.random() * Math.PI * 2
      }))

      leavesRef.current = Array.from({ length: 15 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 30 + 15,
        rotation: Math.random() * Math.PI,
        speed: Math.random() * 0.1 + 0.05,
        direction: Math.random() * Math.PI * 2
      }))
    }

    initializeItems()

    const drawCoffeeBean = (item: CoffeeItem) => {
      ctx.save()
      ctx.translate(item.x, item.y)
      ctx.rotate(item.rotation)
      ctx.beginPath()
      ctx.ellipse(0, 0, item.size, item.size / 2, 0, 0, 2 * Math.PI)
      ctx.fillStyle = '#4A2C2A'
      ctx.fill()
      ctx.restore()
    }

    const drawLeaf = (item: CoffeeItem) => {
      ctx.save()
      ctx.translate(item.x, item.y)
      ctx.rotate(item.rotation)
      ctx.beginPath()
      ctx.ellipse(0, 0, item.size, item.size / 3, 0, 0, 2 * Math.PI)
      ctx.fillStyle = '#2E8B57'
      ctx.fill()
      ctx.restore()
    }

    const updatePosition = (item: CoffeeItem) => {
      item.x += Math.cos(item.direction) * item.speed
      item.y += Math.sin(item.direction) * item.speed
      item.rotation += 0.01

      if (item.x < -item.size) item.x = canvas.width + item.size
      if (item.x > canvas.width + item.size) item.x = -item.size
      if (item.y < -item.size) item.y = canvas.height + item.size
      if (item.y > canvas.height + item.size) item.y = -item.size
    }

    const animate = () => {
      ctx.fillStyle = '#F5F5DC'  // Beige background
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      coffeeBeansRef.current.forEach(bean => {
        updatePosition(bean)
        drawCoffeeBean(bean)
      })

      leavesRef.current.forEach(leaf => {
        updatePosition(leaf)
        drawLeaf(leaf)
      })

      // Draw text
      ctx.font = 'bold 24px Arial'
      ctx.fillStyle = '#333333'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText('Lavazza Coffee Traceability', canvas.width - 20, canvas.height - 20)

      requestAnimationFrame(animate)
    }

    animate()

    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />
}

export default SustainableCoffeeBackground
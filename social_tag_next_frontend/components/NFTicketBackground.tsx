'use client'

import React, { useEffect, useRef } from 'react'

const NFTicketBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const airplanes: {
      x: number
      y: number
      size: number
      speed: number
      direction: number
    }[] = []

    for (let i = 0; i < 10; i++) {
      airplanes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 30 + 20,
        speed: Math.random() * 2 + 1,
        direction: Math.random() * Math.PI * 2
      })
    }

    function drawAirplane(x: number, y: number, size: number, direction: number) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(direction)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(-size, size / 2)
      ctx.lineTo(-size * 0.8, 0)
      ctx.lineTo(-size, -size / 2)
      ctx.closePath()
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.restore()
    }

    function drawTravelXLogo() {
      ctx.font = 'bold 24px Arial'
      ctx.fillStyle = '#FFFFFF'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText('NFTicket by TravelX', canvas.width - 20, canvas.height - 20)
    }

    function animate() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      airplanes.forEach(airplane => {
        drawAirplane(airplane.x, airplane.y, airplane.size, airplane.direction)

        airplane.x += Math.cos(airplane.direction) * airplane.speed
        airplane.y += Math.sin(airplane.direction) * airplane.speed

        if (airplane.x < -airplane.size) airplane.x = canvas.width + airplane.size
        if (airplane.x > canvas.width + airplane.size) airplane.x = -airplane.size
        if (airplane.y < -airplane.size) airplane.y = canvas.height + airplane.size
        if (airplane.y > canvas.height + airplane.size) airplane.y = -airplane.size
      })

      drawTravelXLogo()

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

export default NFTicketBackground
'use client'

import React, { useEffect, useRef } from 'react'

const OrangeMemeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Updated theme colors - more pure orange
    const orangeLight = '#FF9933'
    const orangeDark = '#FF6600'
    const leafGreen = '#2EA831'  // Slightly darker, more vibrant green
    const sparkleColor = '#FFE5B4'
    const bgColor = '#FFF9E5'

    // Sparkles
    const sparkles: {
      x: number
      y: number
      size: number
      opacity: number
      rotationSpeed: number
      rotation: number
    }[] = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 8 + 4,
      opacity: Math.random() * 0.5 + 0.3,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      rotation: Math.random() * Math.PI * 2
    }))

    // Orange characters
    const oranges: {
      x: number
      y: number
      size: number
      speed: number
      bobPhase: number
    }[] = Array.from({ length: 5 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 30 + 40,
      speed: Math.random() * 0.3 + 0.1,
      bobPhase: Math.random() * Math.PI * 2
    }))

    function drawSparkle(x: number, y: number, size: number, rotation: number, opacity: number) {
      if (!ctx) return
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.globalAlpha = opacity

      ctx.beginPath()
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size)
      }
      ctx.strokeStyle = sparkleColor
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.restore()
    }

    function drawOrangeCharacter(x: number, y: number, size: number, phase: number) {
      if (!ctx) return
      ctx.save()
      ctx.translate(x, y + Math.sin(phase) * 3)

      // Main orange body
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
      gradient.addColorStop(0, orangeLight)
      gradient.addColorStop(1, orangeDark)
      
      ctx.beginPath()
      ctx.arc(0, 0, size, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Enhanced leaf - made larger and more prominent
      ctx.beginPath()
      ctx.moveTo(-size * 0.1, -size)
      // Main leaf curve
      ctx.quadraticCurveTo(
        size * 0.4, -size * 1.4,  // Control point moved further out
        size * 0.5, -size * 1.1    // End point
      )
      // Return curve
      ctx.quadraticCurveTo(
        size * 0.2, -size * 1.3,
        -size * 0.1, -size
      )
      ctx.fillStyle = leafGreen
      ctx.fill()

      // Add leaf detail
      ctx.beginPath()
      ctx.moveTo(-size * 0.05, -size * 1.1)
      ctx.quadraticCurveTo(
        size * 0.2, -size * 1.25,
        size * 0.3, -size * 1.15
      )
      ctx.strokeStyle = '#1E7B22'
      ctx.lineWidth = 2
      ctx.stroke()

      // Shine on leaf
      ctx.beginPath()
      ctx.moveTo(size * 0.1, -size * 1.2)
      ctx.quadraticCurveTo(
        size * 0.2, -size * 1.25,
        size * 0.3, -size * 1.15
      )
      ctx.strokeStyle = '#45CF4A'
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.5
      ctx.stroke()

      // Eyes
      const eyeSize = size * 0.15
      ctx.globalAlpha = 1
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(-eyeSize * 1.5, -eyeSize, eyeSize, 0, Math.PI * 2)
      ctx.arc(eyeSize * 1.5, -eyeSize, eyeSize, 0, Math.PI * 2)
      ctx.fill()

      // Smile
      ctx.beginPath()
      ctx.arc(0, eyeSize, size * 0.3, 0, Math.PI, false)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 3
      ctx.stroke()

      // Cheeks
      ctx.fillStyle = '#FF6B6B'
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.arc(-size * 0.5, eyeSize * 0.5, size * 0.15, 0, Math.PI * 2)
      ctx.arc(size * 0.5, eyeSize * 0.5, size * 0.15, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    function animate() {
      if (!ctx || !canvas) return

      // Clear and fill background
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Animate sparkles
      sparkles.forEach(sparkle => {
        sparkle.rotation += sparkle.rotationSpeed
        sparkle.y -= 0.5
        sparkle.opacity = 0.3 + Math.sin(sparkle.rotation) * 0.2

        if (sparkle.y < -sparkle.size) {
          sparkle.y = canvas.height + sparkle.size
          sparkle.x = Math.random() * canvas.width
        }

        drawSparkle(
          sparkle.x,
          sparkle.y,
          sparkle.size,
          sparkle.rotation,
          sparkle.opacity
        )
      })

      // Animate orange characters
      oranges.forEach(orange => {
        orange.bobPhase += 0.02
        orange.y += orange.speed

        if (orange.y > canvas.height + orange.size) {
          orange.y = -orange.size
          orange.x = Math.random() * canvas.width
        }

        drawOrangeCharacter(
          orange.x,
          orange.y,
          orange.size,
          orange.bobPhase
        )
      })

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

export default OrangeMemeBackground
'use client'

import React, { useEffect, useRef } from 'react'

const PeraWalletBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // More accurate Pera colors
    const peraYellow = '#FFE800'
    const peraBlack = '#000000'
    
    const logos: {
      x: number
      y: number
      size: number
      speed: number
      rotation: number
      opacity: number
    }[] = Array.from({ length: 6 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 30 + 35,
      speed: Math.random() * 0.15 + 0.05,
      rotation: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.2 + 0.1
    }))

    // Curved background lines
    const curves: {
      startX: number
      startY: number
      controlX: number
      controlY: number
      endX: number
      endY: number
      opacity: number
      phase: number
    }[] = Array.from({ length: 8 }, () => ({
      startX: Math.random() * canvas.width,
      startY: Math.random() * canvas.height,
      controlX: Math.random() * canvas.width,
      controlY: Math.random() * canvas.height,
      endX: Math.random() * canvas.width,
      endY: Math.random() * canvas.height,
      opacity: Math.random() * 0.03 + 0.01,
      phase: Math.random() * Math.PI * 2
    }))

    function drawPeraLogo(x: number, y: number, size: number, rotation: number, opacity: number) {
      if (!ctx) return
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.globalAlpha = opacity

      // Draw the dots in a circular pattern
      const dots = 6
      const radius = size / 2
      const dotSize = size * 0.12
      
      for (let i = 0; i < dots; i++) {
        const angle = (i / dots) * Math.PI * 2
        const dotX = Math.cos(angle) * radius
        const dotY = Math.sin(angle) * radius
        
        ctx.beginPath()
        ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2)
        ctx.fillStyle = peraYellow
        ctx.fill()
      }

      // Center dot
      ctx.beginPath()
      ctx.arc(0, 0, dotSize, 0, Math.PI * 2)
      ctx.fillStyle = peraYellow
      ctx.fill()

      ctx.restore()
    }

    function drawCurvedLines(time: number) {
      if (!ctx) return
      
      curves.forEach(curve => {
        ctx.beginPath()
        
        // Animate control points for subtle movement
        const offsetX = Math.sin(curve.phase + time * 0.0005) * 50
        const offsetY = Math.cos(curve.phase + time * 0.0005) * 50
        
        ctx.moveTo(curve.startX, curve.startY)
        ctx.quadraticCurveTo(
          curve.controlX + offsetX,
          curve.controlY + offsetY,
          curve.endX,
          curve.endY
        )
        
        ctx.strokeStyle = `rgba(255, 232, 0, ${curve.opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      })
    }

    let animationTime = 0
    function animate() {
      if (!ctx || !canvas) return
      
      // Clear and fill background
      ctx.fillStyle = peraBlack
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw animated curved lines
      drawCurvedLines(animationTime)

      // Animate and draw logos
      logos.forEach(logo => {
        drawPeraLogo(logo.x, logo.y, logo.size, logo.rotation, logo.opacity)

        // Update position with more subtle movement
        logo.y += logo.speed
        logo.x += Math.sin(logo.y * 0.01) * 0.15
        logo.rotation += 0.0008

        // Reset position when out of view
        if (logo.y > canvas.height + logo.size) {
          logo.y = -logo.size
          logo.x = Math.random() * canvas.width
        }
      })

      animationTime++
      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />
}

export default PeraWalletBackground
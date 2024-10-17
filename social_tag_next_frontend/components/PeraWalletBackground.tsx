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

    const peraYellow = '#FFEE55'
    const peraBlack = '#000000'

    const logos: {
      x: number
      y: number
      size: number
      speed: number
      rotation: number
    }[] = []

    for (let i = 0; i < 10; i++) {
      logos.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 60 + 40,
        speed: Math.random() * 0.5 + 0.1,
        rotation: Math.random() * Math.PI * 2
      })
    }

    function drawPeraLogo(x: number, y: number, size: number, rotation: number) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)

      const petalCount = 6
      const centerSize = size * 0.2

      // Draw petals
      ctx.fillStyle = peraBlack
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2
        ctx.save()
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.ellipse(size * 0.3, 0, size * 0.2, size * 0.1, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Draw center
      ctx.beginPath()
      ctx.arc(0, 0, centerSize, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    function drawPeraWalletText() {
      ctx.font = 'bold 24px Arial'
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText('Pera Wallet', canvas.width - 20, canvas.height - 20)
    }

    function animate() {
      ctx.fillStyle = peraYellow
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      logos.forEach(logo => {
        drawPeraLogo(logo.x, logo.y, logo.size, logo.rotation)

        logo.y += logo.speed
        logo.x += Math.sin(logo.y * 0.05) * 0.5
        logo.rotation += 0.005

        if (logo.y > canvas.height + logo.size) {
          logo.y = -logo.size
          logo.x = Math.random() * canvas.width
        }
      })

      drawPeraWalletText()

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

export default PeraWalletBackground
import React, { useEffect, useRef } from 'react'

const TropicalIslandBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const palmTrees: { x: number; y: number; height: number }[] = []
    for (let i = 0; i < 5; i++) {
      palmTrees.push({
        x: Math.random() * canvas.width,
        y: canvas.height,
        height: Math.random() * 100 + 100
      })
    }

    function drawSun() {
      if (!ctx || !canvas) return
      const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.8, 0, canvas.width / 2, canvas.height * 0.8, canvas.height * 0.5)
      gradient.addColorStop(0, 'rgba(255, 255, 0, 1)')
      gradient.addColorStop(1, 'rgba(255, 165, 0, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height * 0.8, canvas.height * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }

    function drawPalmTree(x: number, y: number, height: number) {
      if (!ctx) return
      ctx.fillStyle = '#8B4513'
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - 10, y - height)
      ctx.lineTo(x + 10, y - height)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#00FF00'
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.ellipse(x + Math.cos(i * Math.PI / 2.5) * 30, y - height + Math.sin(i * Math.PI / 2.5) * 30, 40, 20, i * Math.PI / 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      drawSun()

      ctx.fillStyle = '#00CED1'
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3)

      palmTrees.forEach(tree => drawPalmTree(tree.x, tree.y, tree.height))

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

export default TropicalIslandBackground
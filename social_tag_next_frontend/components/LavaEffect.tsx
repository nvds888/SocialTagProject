'use client'

import React, { useEffect, useRef } from 'react'

const retroColors = [
  '#FFB3BA', // Light Pink
  '#BAFFC9', // Light Mint
  '#BAE1FF', // Light Blue
  '#FFFFBA', // Light Yellow
  '#FFD9BA'  // Light Peach
];

const LavaEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const blocks: { x: number; y: number; width: number; height: number; color: string; targetY: number }[] = [];
    const blockSize = 50;
    const blockGap = 10;
    const chainLength = Math.floor(canvas.width / (blockSize + blockGap));

    for (let i = 0; i < chainLength; i++) {
      blocks.push({
        x: canvas.width - (i * (blockSize + blockGap) + blockSize),
        y: canvas.height + blockSize,
        width: blockSize,
        height: blockSize,
        color: retroColors[i % retroColors.length],
        targetY: canvas.height / 4 + Math.sin(i * 0.2) * 60 // Adjusted to rise higher
      });
    }

    let time = 0;

    const drawLavaEffect = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      blocks.forEach((block, index) => {
        if (block.y > block.targetY) {
          block.y -= 0.5;
        }

        const oscillation = Math.sin(time + index * 0.2) * 5;
        const drawX = block.x + oscillation;

        ctx.fillStyle = block.color;
        ctx.fillRect(drawX, block.y, block.width, block.height);

        if (index > 0) {
          ctx.beginPath();
          ctx.moveTo(blocks[index - 1].x + blockSize / 2, blocks[index - 1].y + blockSize / 2);
          ctx.lineTo(drawX + blockSize / 2, block.y + blockSize / 2);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.stroke();
        }
      });
    };

    const animate = () => {
      drawLavaEffect();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

export default LavaEffect;
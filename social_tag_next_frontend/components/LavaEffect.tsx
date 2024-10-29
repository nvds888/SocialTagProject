'use client'

import React, { useEffect, useRef } from 'react'

const cyberpunkColors = [
  '#FFB951', // Yellow/Gold
  '#40E0D0', // Turquoise/Teal
  '#FF6B6B', // Coral/Red
  '#9B8AC4', // Purple (from previous theme)
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

    // Add retro styling to blocks
    const blocks: {
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      targetY: number;
      borderColor: string;
      shadowColor: string;
      borderWidth: number;
      borderRadius: number;
    }[] = [];

    const blockSize = 50;
    const blockGap = 15; // Increased gap for more retro feel
    const chainLength = Math.floor(canvas.width / (blockSize + blockGap));

    for (let i = 0; i < chainLength; i++) {
      blocks.push({
        x: canvas.width - (i * (blockSize + blockGap) + blockSize),
        y: canvas.height + blockSize,
        width: blockSize,
        height: blockSize,
        color: cyberpunkColors[i % cyberpunkColors.length],
        targetY: canvas.height / 4 + Math.sin(i * 0.2) * 60,
        borderColor: '#000000',
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 2,
        borderRadius: 8
      });
    }

    let time = 0;

    const drawRetroBlock = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      color: string,
      borderColor: string,
      borderWidth: number,
      borderRadius: number
    ) => {
      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, width, height, borderRadius);
      ctx.fill();

      // Draw main block
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, borderRadius);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, borderRadius);
      ctx.stroke();

      // Add shine effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(x + borderWidth, y + borderWidth, width / 3, height / 3, borderRadius);
      ctx.fill();
    };

    const drawLavaEffect = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      blocks.forEach((block, index) => {
        if (block.y > block.targetY) {
          block.y -= 0.5;
        }

        const oscillation = Math.sin(time + index * 0.2) * 5;
        const drawX = block.x + oscillation;

        // Draw retro-styled block
        drawRetroBlock(
          ctx,
          drawX,
          block.y,
          block.width,
          block.height,
          block.color,
          block.borderColor,
          block.borderWidth,
          block.borderRadius
        );

        // Draw connecting lines with glow effect
        if (index > 0) {
          ctx.beginPath();
          ctx.moveTo(blocks[index - 1].x + blockSize / 2, blocks[index - 1].y + blockSize / 2);
          ctx.lineTo(drawX + blockSize / 2, block.y + blockSize / 2);
          
          // Create gradient for line
          const gradient = ctx.createLinearGradient(
            blocks[index - 1].x + blockSize / 2,
            blocks[index - 1].y + blockSize / 2,
            drawX + blockSize / 2,
            block.y + blockSize / 2
          );
          gradient.addColorStop(0, blocks[index - 1].color);
          gradient.addColorStop(1, block.color);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.stroke();

          // Add glow effect
          ctx.shadowColor = block.color;
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
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

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full rounded-lg border-2 border-black shadow-lg" 
    />
  );
};

export default LavaEffect;
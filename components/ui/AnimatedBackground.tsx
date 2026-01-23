'use client';

import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  opacity: number;
  phase: number;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initPoints();
    };

    const initPoints = () => {
      const points: Point[] = [];
      const spacing = 50;
      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          points.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: 0,
            opacity: 0.15 + Math.random() * 0.25,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
      pointsRef.current = points;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    let startTime = Date.now();
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      // Dark background
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const points = pointsRef.current;
      const mouse = mouseRef.current;

      // Draw grid lines first (very subtle)
      ctx.strokeStyle = 'rgba(0, 255, 245, 0.03)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let i = 0; i < Math.ceil(canvas.width / 50) + 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 50, 0);
        ctx.lineTo(i * 50, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let j = 0; j < Math.ceil(canvas.height / 50) + 1; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * 50);
        ctx.lineTo(canvas.width, j * 50);
        ctx.stroke();
      }

      // Draw and update points
      points.forEach((point) => {
        // Gentle breathing animation
        const breathe = Math.sin(elapsed * 0.001 + point.phase) * 5;

        // Mouse interaction
        const dx = point.baseX - mouse.x;
        const dy = point.baseY - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        let repelX = 0;
        let repelY = 0;
        let glowIntensity = 0;

        if (distance < maxDistance && distance > 0) {
          const force = ((maxDistance - distance) / maxDistance) * 30;
          repelX = (dx / distance) * force;
          repelY = (dy / distance) * force;
          glowIntensity = (maxDistance - distance) / maxDistance;
        }

        // Elastic return
        point.vx += repelX * 0.05;
        point.vy += repelY * 0.05;
        point.vx *= 0.9;
        point.vy *= 0.9;

        // Update position
        point.x = point.baseX + breathe + point.vx;
        point.y = point.baseY + breathe + point.vy;

        // Draw point with glow
        const baseOpacity = point.opacity;
        const finalOpacity = Math.min(baseOpacity + glowIntensity * 0.5, 1);

        // Glow effect for nearby points
        if (glowIntensity > 0) {
          const gradient = ctx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, 15
          );
          gradient.addColorStop(0, `rgba(0, 255, 245, ${glowIntensity * 0.3})`);
          gradient.addColorStop(1, 'rgba(0, 255, 245, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw the point
        ctx.fillStyle = `rgba(0, 255, 245, ${finalOpacity})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw connections to nearby points
        points.forEach((other) => {
          if (other === point) return;
          const connDx = other.x - point.x;
          const connDy = other.y - point.y;
          const connDist = Math.sqrt(connDx * connDx + connDy * connDy);

          if (connDist < 70) {
            const connOpacity = (1 - connDist / 70) * 0.15;
            ctx.strokeStyle = `rgba(0, 255, 245, ${connOpacity})`;
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0a0f]">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 255, 245, 0.05) 0%, transparent 50%)'
      }} />
    </div>
  );
}

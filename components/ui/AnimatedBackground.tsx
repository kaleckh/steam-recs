'use client';

import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  phase: number;
  swaySpeed: number;
  swayAmount: number;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initPoints();
    };

    // Initialize points in a grid
    const initPoints = () => {
      const points: Point[] = [];
      const spacing = 40;
      const cols = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);

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
            radius: 1.2,
            opacity: 0.5 + Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2,
            swaySpeed: 0.0005 + Math.random() * 0.001,
            swayAmount: 10 + Math.random() * 20,
          });
        }
      }
      pointsRef.current = points;
    };

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    // Animation loop
    let startTime = Date.now();
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      ctx.fillStyle = '#1b2838';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const points = pointsRef.current;
      const mouse = mouseRef.current;

      points.forEach((point, index) => {
        // Expansion/contraction cycle (4 second cycle)
        const cycleTime = (elapsed + index * 50) % 4000;
        const expansionPhase = Math.sin((cycleTime / 4000) * Math.PI * 2);
        const expansionAmount = expansionPhase * 15;

        // Sway motion
        const swayX = Math.sin(elapsed * point.swaySpeed + point.phase) * point.swayAmount;
        const swayY = Math.cos(elapsed * point.swaySpeed * 0.8 + point.phase) * point.swayAmount;

        // Mouse repulsion
        const dx = point.baseX - mouse.x;
        const dy = point.baseY - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 120;

        let repelX = 0;
        let repelY = 0;
        if (distance < maxDistance && distance > 0) {
          const force = ((maxDistance - distance) / maxDistance) * 50;
          repelX = (dx / distance) * force;
          repelY = (dy / distance) * force;
        }

        // Apply elastic damping to velocity
        point.vx += repelX * 0.1;
        point.vy += repelY * 0.1;
        point.vx *= 0.85;
        point.vy *= 0.85;

        // Update position
        point.x = point.baseX + swayX + expansionAmount + point.vx;
        point.y = point.baseY + swayY + expansionAmount + point.vy;

        // Draw point
        ctx.fillStyle = `rgba(103, 193, 245, ${point.opacity * (0.5 + Math.abs(expansionPhase) * 0.5)})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#1b2838]">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

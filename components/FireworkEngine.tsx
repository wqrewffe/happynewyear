
import React, { useEffect, useRef } from 'react';
import { Particle, Firework } from '../types';
import { audioService } from '../utils/audio';

const POSH_COLORS = [
  '#FFD700', // Gold
  '#F4A460', // Sandy Brown
  '#DAA520', // Goldenrod
  '#B8860B', // Dark Goldenrod
  '#FFFFFF', // White Sparkle
  '#C0C0C0', // Silver
  '#E5E4E2', // Platinum
];

const FireworkEngine: React.FC<{ soundEnabled: boolean }> = ({ soundEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireworks = useRef<Firework[]>([]);

  const createParticles = (x: number, y: number, color: string): Particle[] => {
    const count = 100 + Math.random() * 50;
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: Math.random() * 2 + 1,
        gravity: 0.1,
        friction: 0.95
      });
    }
    return particles;
  };

  const spawnFirework = () => {
    const x = Math.random() * window.innerWidth;
    const y = window.innerHeight;
    const targetY = Math.random() * (window.innerHeight * 0.5);
    const color = POSH_COLORS[Math.floor(Math.random() * POSH_COLORS.length)];
    
    if (soundEnabled) {
      audioService.playLaunch();
    }

    fireworks.current.push({
      x,
      y,
      targetY,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 10 - 8,
      color,
      reached: false,
      particles: []
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const loop = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      fireworks.current.forEach((fw, index) => {
        if (!fw.reached) {
          fw.x += fw.vx;
          fw.y += fw.vy;
          fw.vy += 0.05;

          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = fw.color;
          ctx.fill();

          if (fw.vy >= 0 || fw.y <= fw.targetY) {
            fw.reached = true;
            fw.particles = createParticles(fw.x, fw.y, fw.color);
            if (soundEnabled) {
              audioService.playExplosion();
            }
          }
        } else {
          fw.particles.forEach((p, pIndex) => {
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.01;

            if (p.alpha > 0) {
              ctx.globalAlpha = p.alpha;
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          ctx.globalAlpha = 1;

          if (fw.particles.every(p => p.alpha <= 0)) {
            fireworks.current.splice(index, 1);
          }
        }
      });

      if (Math.random() < 0.05) {
        spawnFirework();
      }

      animationFrame = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [soundEnabled]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
};

export default FireworkEngine;

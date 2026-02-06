"use client";

import { useEffect, useRef } from "react";

interface Ant {
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  trail: { x: number; y: number }[];
  turnTimer: number;
  nearCenter: boolean;
}

export function WanderingAnts() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const maxTrailLength = 120;
    const antCount = 14;
    const ants: Ant[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    resize();
    window.addEventListener("resize", resize);

    // Initialize ants - most spawn near center, a few roam freely
    const cx = canvas.offsetWidth / 2;
    const cy = canvas.offsetHeight / 2;
    for (let i = 0; i < antCount; i++) {
      const nearCenter = i < 10; // 10 near center, 4 roam freely
      const spread = nearCenter ? 0.25 : 1;
      ants.push({
        x: cx + (Math.random() - 0.5) * canvas.offsetWidth * spread,
        y: cy + (Math.random() - 0.5) * canvas.offsetHeight * spread,
        angle: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8,
        size: 6 + Math.random() * 3,
        trail: [],
        turnTimer: Math.random() * 100,
        nearCenter,
      });
    }

    function drawAnt(ant: Ant) {
      if (!ctx) return;
      const { x, y, angle, size } = ant;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.fillStyle = "#e88a00";

      // Body (back circle)
      ctx.beginPath();
      ctx.arc(-size * 0.55, 0, size * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Head (front circle, connected/overlapping)
      ctx.beginPath();
      ctx.arc(size * 0.45, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Antennae
      ctx.strokeStyle = "#e88a00";
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(size * 0.8, -size * 0.3);
      ctx.quadraticCurveTo(size * 1.6, -size * 1.2, size * 1.9, -size * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size * 0.8, size * 0.3);
      ctx.quadraticCurveTo(size * 1.6, size * 1.2, size * 1.9, size * 0.8);
      ctx.stroke();

      ctx.restore();
    }

    function drawTrail(ant: Ant) {
      if (!ctx || ant.trail.length < 2) return;

      for (let i = 1; i < ant.trail.length; i++) {
        const opacity = (i / ant.trail.length) * 0.12;
        ctx.beginPath();
        ctx.arc(ant.trail[i].x, ant.trail[i].y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 138, 0, ${opacity})`;
        ctx.fill();
      }
    }

    function update() {
      if (!canvas || !ctx) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      ctx.clearRect(0, 0, w, h);

      for (const ant of ants) {
        // Wandering behavior - gentle random turns
        ant.turnTimer--;
        if (ant.turnTimer <= 0) {
          ant.angle += (Math.random() - 0.5) * 1.2;
          ant.turnTimer = 30 + Math.random() * 80;
        }

        // Slight continuous wiggle
        ant.angle += (Math.random() - 0.5) * 0.08;

        // Gentle pull toward center for center-bound ants
        if (ant.nearCenter) {
          const dx = w / 2 - ant.x;
          const dy = h / 2 - ant.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDrift = Math.min(w, h) * 0.3;
          if (dist > maxDrift) {
            const pullAngle = Math.atan2(dy, dx);
            ant.angle += (pullAngle - ant.angle) * 0.03;
          }
        }

        // Move
        ant.x += Math.cos(ant.angle) * ant.speed;
        ant.y += Math.sin(ant.angle) * ant.speed;

        // Wrap around edges with margin
        const margin = 20;
        if (ant.x < -margin) ant.x = w + margin;
        if (ant.x > w + margin) ant.x = -margin;
        if (ant.y < -margin) ant.y = h + margin;
        if (ant.y > h + margin) ant.y = -margin;

        // Record trail
        ant.trail.push({ x: ant.x, y: ant.y });
        if (ant.trail.length > maxTrailLength) {
          ant.trail.shift();
        }

        drawTrail(ant);
        drawAnt(ant);
      }

      animationId = requestAnimationFrame(update);
    }

    animationId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-80"
    />
  );
}

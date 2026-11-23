"use client";

import React, { useEffect, useRef } from "react";

interface GalaxyStar {
  radius: number;
  maxRadius: number;
  angle: number;
  angularSpeed: number;
  size: number;
  color: string;
  alpha: number;
  offsetX: number;
  offsetY: number;
  dispX: number;
  dispY: number;
}

interface BackgroundStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
}

const GALAXY_COLORS = [
  "#ffffff",
  "#ffffff",
  "#a5d8ff",
  "#60a5fa",
  "#a5d8ff",
  "#fbbf24",
  "#fdba74",
];

const BG_STAR_COLORS = ["#ffffff", "#a5d8ff", "#60a5fa", "#fdba74"];

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId = 0;

    let galaxyStars: GalaxyStar[] = [];
    let bgStars: BackgroundStar[] = [];

    // Posición normalizada del cursor para paralaje e inclinación
    const pointer = {
      x: -9999,
      y: -9999,
      normX: 0,
      normY: 0,
      active: false,
    };

    const parallax = {
      x: 0,
      y: 0,
      tilt: 0.72,
    };

    const initStars = () => {
      const maxGalaxyRadius = Math.min(width, height) * (width < 768 ? 0.56 : 0.62);
      const arms = 3;
      const starCount = 1200;

      galaxyStars = Array.from({ length: starCount }, (_, i) => {
        const armIndex = i % arms;
        // Distribución concentrada hacia el núcleo y expandida en los brazos
        const t = Math.pow(Math.random(), 1.35);
        const radius = t * maxGalaxyRadius;
        const normalizedR = radius / Math.max(maxGalaxyRadius, 1);

        // Espiral logarítmica + dispersión orgánica creciente con el radio
        const armBaseAngle = (armIndex * Math.PI * 2) / arms;
        const spiralTwist = Math.log(1 + normalizedR * 5.2) * 2.55;
        const scatter = (Math.random() - 0.5) * (0.42 + normalizedR * 0.75);
        const angle = armBaseAngle + spiralTwist + scatter;

        // Estrellas interiores orbitan más rápido que las exteriores
        const angularSpeed = 0.00055 + 0.00145 / (0.25 + normalizedR * 1.8);

        // Núcleo más blanco/dorado cálido, brazos más azul hielo
        let color = GALAXY_COLORS[Math.floor(Math.random() * GALAXY_COLORS.length)];
        if (normalizedR < 0.16 && Math.random() < 0.7) {
          color = Math.random() < 0.65 ? "#ffffff" : "#fdba74";
        } else if (normalizedR > 0.45 && Math.random() < 0.65) {
          color = Math.random() < 0.5 ? "#a5d8ff" : "#60a5fa";
        }

        return {
          radius,
          maxRadius: maxGalaxyRadius,
          angle,
          angularSpeed,
          size: normalizedR < 0.2 ? 1.1 + Math.random() * 1.4 : 0.75 + Math.random() * 1.35,
          color,
          alpha: 0.42 + Math.random() * 0.58,
          offsetX: (Math.random() - 0.5) * (10 + normalizedR * 28),
          offsetY: (Math.random() - 0.5) * (10 + normalizedR * 28),
          dispX: 0,
          dispY: 0,
        };
      });

      // ~150 estrellas lejanas de fondo
      bgStars = Array.from({ length: 150 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.5 + Math.random() * 1.2,
        alpha: 0.18 + Math.random() * 0.45,
        twinkleSpeed: 0.01 + Math.random() * 0.025,
        phase: Math.random() * Math.PI * 2,
        color: BG_STAR_COLORS[Math.floor(Math.random() * BG_STAR_COLORS.length)],
      }));
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initStars();
    };

    const renderFrame = (animate: boolean, time: number) => {
      // Fondo espacial profundo #05070d
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#05070d";
      ctx.fillRect(0, 0, width, height);

      // Paralaje e inclinación suave (lerp) hacia el cursor
      const targetParallaxX = pointer.active ? pointer.normX * 28 : 0;
      const targetParallaxY = pointer.active ? pointer.normY * 22 : 0;
      const targetTilt = pointer.active ? 0.72 + pointer.normY * 0.12 : 0.72;

      if (animate) {
        parallax.x += (targetParallaxX - parallax.x) * 0.05;
        parallax.y += (targetParallaxY - parallax.y) * 0.05;
        parallax.tilt += (targetTilt - parallax.tilt) * 0.05;
      }

      const centerX = width * 0.5 + parallax.x;
      const centerY = height * 0.44 + parallax.y;

      // 1. Estrellas lejanas de fondo
      for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        const twinkle = animate
          ? 0.65 + 0.35 * Math.sin(time * s.twinkleSpeed + s.phase)
          : 1;
        ctx.globalAlpha = s.alpha * twinkle;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x + parallax.x * 0.25, s.y + parallax.y * 0.25, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Brillo aditivo para el núcleo y cúmulos estelares
      ctx.globalCompositeOperation = "lighter";

      // 2. Núcleo central brillante (radialGradient blanco-azulado intenso)
      const coreRadius = Math.min(width, height) * 0.24;
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
      coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.55)");
      coreGrad.addColorStop(0.18, "rgba(165, 216, 255, 0.28)");
      coreGrad.addColorStop(0.48, "rgba(96, 165, 250, 0.10)");
      coreGrad.addColorStop(1, "rgba(5, 7, 13, 0)");

      ctx.globalAlpha = 1;
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Partículas de los 3 brazos espirales logarítmicos
      const interactionRadius = 140;
      const galaxyRotationTilt = -0.22; // Ligera inclinación diagonal estética
      const cosRot = Math.cos(galaxyRotationTilt);
      const sinRot = Math.sin(galaxyRotationTilt);

      for (let i = 0; i < galaxyStars.length; i++) {
        const star = galaxyStars[i];

        if (animate) {
          star.angle += star.angularSpeed;
        }

        // Coordenadas locales en el plano de la galaxia inclinada
        const lx = Math.cos(star.angle) * star.radius + star.offsetX;
        const ly = (Math.sin(star.angle) * star.radius + star.offsetY) * parallax.tilt;

        // Rotación diagonal sutil de la galaxia completa
        const rx = lx * cosRot - ly * sinRot;
        const ry = lx * sinRot + ly * cosRot;

        const baseX = centerX + rx;
        const baseY = centerY + ry;

        // Onda gravitacional / repulsión elástica suave cerca del cursor (~140 px)
        if (animate && pointer.active) {
          const dx = baseX + star.dispX - pointer.x;
          const dy = baseY + star.dispY - pointer.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 0.001 && dist < interactionRadius) {
            const force = (1 - dist / interactionRadius) * 10.5;
            star.dispX += (dx / dist) * force;
            star.dispY += (dy / dist) * force;
          }
        }

        // Retorno elástico gradual a la órbita original
        if (animate) {
          star.dispX *= 0.9;
          star.dispY *= 0.9;
        }

        const drawX = baseX + star.dispX;
        const drawY = baseY + star.dispY;

        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    let frameTick = 0;
    const loop = () => {
      frameTick += 1;
      renderFrame(true, frameTick);
      animationFrameId = window.requestAnimationFrame(loop);
    };

    const updatePointer = (clientX: number, clientY: number) => {
      pointer.x = clientX;
      pointer.y = clientY;
      pointer.normX = (clientX / Math.max(width, 1) - 0.5) * 2;
      pointer.normY = (clientY / Math.max(height, 1) - 0.5) * 2;
      pointer.active = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    resizeCanvas();

    if (prefersReducedMotion) {
      renderFrame(false, 0);
    } else {
      animationFrameId = window.requestAnimationFrame(loop);
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("mouseleave", handlePointerLeave);
      window.addEventListener("touchend", handlePointerLeave);
    }

    window.addEventListener("resize", resizeCanvas);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("touchend", handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}

"use client";

import React, { useEffect, useRef } from "react";

interface BgStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
  vx: number;
  vy: number;
  color: string;
}

interface HelixNode {
  t: number; // Posición normalizada a lo largo de la hélice [-1, 1]
  strand: 0 | 1; // 0 = Cian (#22d3ee), 1 = Índigo/Azul (#818cf8)
  radialJitter: number;
  angleJitter: number;
  size: number;
  alpha: number;
  color: string;
}

const STRAND_A_COLORS = ["#22d3ee", "#22d3ee", "#38bdf8", "#ffffff"];
const STRAND_B_COLORS = ["#818cf8", "#818cf8", "#3b82f6", "#ffffff"];
const STAR_COLORS = ["#ffffff", "#a5d8ff", "#22d3ee", "#818cf8"];

export function DashboardDnaBackground() {
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

    let bgStars: BgStar[] = [];
    let helixNodes: HelixNode[] = [];
    const rungCount = 32;

    const pointer = {
      normX: 0,
      normY: 0,
      active: false,
    };

    const view = {
      offsetX: 0,
      offsetY: 0,
      yaw: 0,
      pitch: 0,
    };

    const initScene = () => {
      // ~150 estrellas periféricas
      bgStars = Array.from({ length: 150 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.55 + Math.random() * 1.25,
        alpha: 0.2 + Math.random() * 0.5,
        twinkleSpeed: 0.012 + Math.random() * 0.025,
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      }));

      // Partículas de las dos cadenas espirales de la Doble Hélice 3D
      const nodesPerStrand = width < 768 ? 220 : 320;
      const nodes: HelixNode[] = [];

      for (let s = 0; s < 2; s++) {
        const strand = s as 0 | 1;
        const palette = strand === 0 ? STRAND_A_COLORS : STRAND_B_COLORS;
        for (let i = 0; i < nodesPerStrand; i++) {
          const t = (i / (nodesPerStrand - 1)) * 2 - 1;
          nodes.push({
            t,
            strand,
            radialJitter: (Math.random() - 0.5) * 14,
            angleJitter: (Math.random() - 0.5) * 0.28,
            size: 1.0 + Math.random() * 1.5,
            alpha: 0.45 + Math.random() * 0.55,
            color: palette[Math.floor(Math.random() * palette.length)],
          });
        }
      }

      helixNodes = nodes;
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
      initScene();
    };

    const renderFrame = (animate: boolean, tick: number) => {
      // Fondo espacial profundo #050811
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#050811";
      ctx.fillRect(0, 0, width, height);

      // Interpolación suave (lerp) de perspectiva hacia el cursor
      const targetOffsetX = pointer.active ? pointer.normX * 26 : 0;
      const targetOffsetY = pointer.active ? pointer.normY * 20 : 0;
      const targetYaw = pointer.active ? pointer.normX * 0.16 : 0;
      const targetPitch = pointer.active ? pointer.normY * 0.14 : 0;

      if (animate) {
        view.offsetX += (targetOffsetX - view.offsetX) * 0.05;
        view.offsetY += (targetOffsetY - view.offsetY) * 0.05;
        view.yaw += (targetYaw - view.yaw) * 0.05;
        view.pitch += (targetPitch - view.pitch) * 0.05;
      }

      // 1. Campo estelar periférico
      for (let i = 0; i < bgStars.length; i++) {
        const star = bgStars[i];
        if (animate) {
          star.x += star.vx;
          star.y += star.vy;
          if (star.x < 0) star.x = width;
          if (star.x > width) star.x = 0;
          if (star.y < 0) star.y = height;
          if (star.y > height) star.y = 0;
        }
        const twinkle = animate
          ? 0.65 + 0.35 * Math.sin(tick * star.twinkleSpeed + star.phase)
          : 1;
        ctx.globalAlpha = star.alpha * twinkle;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x + view.offsetX * 0.25, star.y + view.offsetY * 0.25, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Brillo aditivo para las partículas de energía
      ctx.globalCompositeOperation = "lighter";

      const centerX = width * 0.55 + view.offsetX;
      const centerY = height * 0.5 + view.offsetY;

      // Halo ambiental muy suave detrás de la hélice
      const ambientR = Math.min(width, height) * 0.45;
      const ambientGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ambientR);
      ambientGrad.addColorStop(0, "rgba(34, 211, 238, 0.08)");
      ambientGrad.addColorStop(0.5, "rgba(129, 140, 248, 0.05)");
      ambientGrad.addColorStop(1, "rgba(5, 8, 17, 0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = ambientGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ambientR, 0, Math.PI * 2);
      ctx.fill();

      // Parámetros 3D de la Doble Hélice diagonal
      const helixLength = Math.hypot(width, height) * 0.85;
      const helixRadius = Math.min(width, height) * (width < 768 ? 0.16 : 0.14);
      const turns = 2.8;
      const spinPhase = animate ? tick * 0.012 : 0;
      const diagonalAngle = -0.46 + view.yaw * 0.25; // Inclinación diagonal suave
      const cosDiag = Math.cos(diagonalAngle);
      const sinDiag = Math.sin(diagonalAngle);
      const fov = 720;

      const project3D = (t: number, theta: number, radiusOffset = 0) => {
        // Coordenada axial a lo largo de la hélice
        const axial = t * (helixLength * 0.5);
        const r = helixRadius + radiusOffset;

        // Posición 3D local alrededor del eje X de la hélice
        const lx = axial;
        const ly = Math.cos(theta) * r;
        const lz = Math.sin(theta) * r;

        // Inclinación de perspectiva con el mouse (pitch)
        const cosPitch = Math.cos(view.pitch);
        const sinPitch = Math.sin(view.pitch);
        const py = ly * cosPitch - lz * sinPitch;
        const pz = ly * sinPitch + lz * cosPitch;

        // Rotación diagonal en pantalla
        const rx = lx * cosDiag - py * sinDiag;
        const ry = lx * sinDiag + py * cosDiag;

        const scale = fov / Math.max(120, fov + pz);
        return {
          x: centerX + rx * scale,
          y: centerY + ry * scale,
          z: pz,
          scale,
        };
      };

      // 2. Peldaños / puentes de puntos de luz entre ambas hélices
      const dotsPerRung = 7;
      for (let r = 0; r < rungCount; r++) {
        const t = ((r + 0.5) / rungCount) * 2 - 1;
        const baseTheta = t * Math.PI * 2 * turns + spinPhase;

        const pA = project3D(t, baseTheta);
        const pB = project3D(t, baseTheta + Math.PI);

        for (let d = 1; d < dotsPerRung; d++) {
          const frac = d / dotsPerRung;
          const x = pA.x + (pB.x - pA.x) * frac;
          const y = pA.y + (pB.y - pA.y) * frac;
          const avgScale = pA.scale + (pB.scale - pA.scale) * frac;
          const depthAlpha = Math.min(1, Math.max(0.15, (avgScale - 0.65) * 0.85));

          ctx.globalAlpha = 0.28 * depthAlpha;
          ctx.fillStyle = frac < 0.5 ? "#22d3ee" : "#818cf8";
          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.7, 1.05 * avgScale), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Partículas de las dos cadenas espirales principales
      for (let i = 0; i < helixNodes.length; i++) {
        const node = helixNodes[i];
        const strandOffset = node.strand === 0 ? 0 : Math.PI;
        const theta = node.t * Math.PI * 2 * turns + strandOffset + spinPhase + node.angleJitter;
        const p = project3D(node.t, theta, node.radialJitter);

        const depthFade = Math.min(1, Math.max(0.22, (p.scale - 0.62) * 1.15));
        ctx.globalAlpha = node.alpha * depthFade;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.8, node.size * p.scale), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    let tick = 0;
    const loop = () => {
      tick += 1;
      renderFrame(true, tick);
      animationFrameId = window.requestAnimationFrame(loop);
    };

    const updatePointer = (clientX: number, clientY: number) => {
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

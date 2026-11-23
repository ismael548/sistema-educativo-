"use client";

import React, { useEffect, useRef } from "react";

interface PanoramicNode {
  nx: number;
  ny: number;
  nz: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  haloColor: string;
  baseRadius: number;
  hasHalo: boolean;
  pulsePhase: number;
  pulseSpeed: number;
}

interface GalacticParticle {
  streamPos: number;
  spread: number;
  depth: number;
  speed: number;
  size: number;
  color: string;
  alpha: number;
  hasHalo: boolean;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface EdgePulse {
  t: number;
  speed: number;
}

const NODE_COUNT = 220;
const GALAXY_PARTICLE_COUNT = 500;

const STELLAR_PALETTE = [
  "#ffffff",
  "#ffffff",
  "#ffffff",
  "#e0f2fe",
  "#7dd3fc",
];

const HALO_MAP: Record<string, string> = {
  "#ffffff": "rgba(255, 255, 255, 0.55)",
  "#e0f2fe": "rgba(224, 242, 254, 0.48)",
  "#7dd3fc": "rgba(125, 211, 252, 0.42)",
};

function rotatePerspective(
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number
): { x: number; y: number; z: number } {
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const y1 = y * cosX - z * sinX;
  const z1 = y * sinX + z * cosX;

  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const x2 = x * cosY + z1 * sinY;
  const z2 = -x * sinY + z1 * cosY;

  return { x: x2, y: y1, z: z2 };
}

export function DashboardNeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    // 1. Constelación Neuronal Panorámica en 3D (~220 nodos blanco estelar en toda la pantalla)
    const nodes: PanoramicNode[] = Array.from({ length: NODE_COUNT }, (_, i) => {
      const colorRoll = Math.random();
      const color =
        colorRoll < 0.62
          ? "#ffffff"
          : colorRoll < 0.85
            ? "#e0f2fe"
            : "#7dd3fc";

      return {
        nx: (Math.random() - 0.5) * 2.24,
        ny: (Math.random() - 0.5) * 2.24,
        nz: (Math.random() - 0.5) * 1.4,
        vx: (Math.random() - 0.5) * 0.00055,
        vy: (Math.random() - 0.5) * 0.00055,
        vz: (Math.random() - 0.5) * 0.00045,
        color,
        haloColor: HALO_MAP[color],
        baseRadius: i % 5 === 0 ? 2.1 + Math.random() * 1.4 : 1.1 + Math.random() * 1.3,
        hasHalo: i % 4 === 0,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 1.4 + Math.random() * 2.0,
      };
    });

    const edgePulses = new Map<string, EdgePulse>();

    // 2. Corriente Galáctica / Nebulosa de Partículas (~500 estrellas blanco brillante en diagonal)
    const galaxyParticles: GalacticParticle[] = Array.from(
      { length: GALAXY_PARTICLE_COUNT },
      (_, i) => {
        const color = STELLAR_PALETTE[i % STELLAR_PALETTE.length];
        const inBand = Math.random() < 0.72;
        const spread = inBand
          ? (Math.random() - 0.5) * 0.62 + (Math.random() - 0.5) * 0.25
          : (Math.random() - 0.5) * 2.1;

        return {
          streamPos: (Math.random() - 0.5) * 2.6,
          spread,
          depth: (Math.random() - 0.5) * 1.8,
          speed: 0.022 + Math.random() * 0.045,
          size: i % 10 === 0 ? 1.8 + Math.random() * 1.4 : 0.75 + Math.random() * 1.35,
          color,
          alpha: 0.5 + Math.random() * 0.45,
          hasHalo: i % 10 === 0,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 1.2 + Math.random() * 2.2,
        };
      }
    );

    const pointer = {
      x: -9999,
      y: -9999,
      normX: 0,
      normY: 0,
      tiltX: 0,
      tiltY: 0,
      active: false,
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      pointer.x = clientX;
      pointer.y = clientY;
      pointer.normX = (clientX / Math.max(width, 1) - 0.5) * 2;
      pointer.normY = (clientY / Math.max(height, 1) - 0.5) * 2;
      pointer.active = true;
    };

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onMouseLeave = () => {
      pointer.active = false;
      pointer.normX = 0;
      pointer.normY = 0;
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave);

    let animationFrameId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;

    const projX = new Float32Array(NODE_COUNT);
    const projY = new Float32Array(NODE_COUNT);
    const projZ = new Float32Array(NODE_COUNT);
    const projScale = new Float32Array(NODE_COUNT);
    const pointerBoost = new Float32Array(NODE_COUNT);

    const renderFrame = (now: number) => {
      const dt = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;
      const elapsed = prefersReducedMotion ? 0 : (now - startTime) * 0.001;

      pointer.tiltX += (pointer.normY * 0.18 - pointer.tiltX) * 0.05;
      pointer.tiltY += (pointer.normX * 0.24 - pointer.tiltY) * 0.05;

      // 1. Fondo espacial profundo idéntico a la portada (#05070d)
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#05070d";
      ctx.fillRect(0, 0, width, height);

      // Brillo aditivo estelar
      ctx.globalCompositeOperation = "lighter";

      const halfW = width * 0.5;
      const halfH = height * 0.5;
      const fov = Math.max(width, height) * 1.15;

      // Resplandores estelares suaves blanco-azulado en diagonal
      const neb1 = ctx.createRadialGradient(
        width * 0.28 - pointer.tiltY * 80,
        height * 0.28 - pointer.tiltX * 80,
        0,
        width * 0.28 - pointer.tiltY * 80,
        height * 0.28 - pointer.tiltX * 80,
        Math.max(width, height) * 0.52
      );
      neb1.addColorStop(0, "rgba(224, 242, 254, 0.10)");
      neb1.addColorStop(0.42, "rgba(125, 211, 252, 0.05)");
      neb1.addColorStop(1, "rgba(5, 7, 13, 0)");
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, width, height);

      const neb2 = ctx.createRadialGradient(
        width * 0.72 + pointer.tiltY * 80,
        height * 0.72 + pointer.tiltX * 80,
        0,
        width * 0.72 + pointer.tiltY * 80,
        height * 0.72 + pointer.tiltX * 80,
        Math.max(width, height) * 0.54
      );
      neb2.addColorStop(0, "rgba(255, 255, 255, 0.08)");
      neb2.addColorStop(0.45, "rgba(125, 211, 252, 0.04)");
      neb2.addColorStop(1, "rgba(5, 7, 13, 0)");
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, width, height);

      // 2. Corriente Galáctica (~500 estrellas blanco estelar cruzando en diagonal)
      const diagAngle = -0.52 + Math.sin(elapsed * 0.08) * 0.04;
      const cosD = Math.cos(diagAngle);
      const sinD = Math.sin(diagAngle);

      for (let i = 0; i < GALAXY_PARTICLE_COUNT; i++) {
        const p = galaxyParticles[i];
        if (!prefersReducedMotion) {
          p.streamPos += p.speed * dt;
          if (p.streamPos > 1.35) {
            p.streamPos = -1.35;
          }
        }

        const swirl = elapsed * 0.14 + p.streamPos * 1.6;
        const localX = p.streamPos;
        const localY = p.spread + Math.sin(swirl) * 0.04;
        const localZ = p.depth + Math.cos(swirl) * 0.18;

        const rx = localX * cosD - localY * sinD;
        const ry = localX * sinD + localY * cosD;

        const tilted = rotatePerspective(
          rx * halfW,
          ry * halfH,
          localZ * 260,
          pointer.tiltX,
          pointer.tiltY
        );
        const scale = fov / (fov + tilted.z + 320);
        const sx = halfW + tilted.x * scale;
        const sy = halfH + tilted.y * scale;

        if (sx < -40 || sx > width + 40 || sy < -40 || sy > height + 40) continue;

        const twinkle =
          0.7 + 0.3 * Math.sin(elapsed * p.twinkleSpeed + p.twinklePhase);
        const depthAlpha = Math.max(0.45, Math.min(0.95, scale * 0.92));

        if (p.hasHalo) {
          const haloR = p.size * scale * 5.2;
          const haloGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
          haloGrad.addColorStop(0, HALO_MAP[p.color]);
          haloGrad.addColorStop(1, "rgba(5, 7, 13, 0)");
          ctx.globalAlpha = p.alpha * twinkle * depthAlpha * 0.85;
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = Math.min(0.95, p.alpha * twinkle * depthAlpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.6, p.size * scale), 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Actualizar y proyectar Constelación Neuronal Panorámica (~220 nodos)
      const rotX = pointer.tiltX + Math.sin(elapsed * 0.12) * 0.06;
      const rotY = pointer.tiltY + Math.cos(elapsed * 0.1) * 0.08;
      const pointerRadius = Math.min(width, height) * 0.24;

      for (let i = 0; i < NODE_COUNT; i++) {
        const n = nodes[i];
        if (!prefersReducedMotion) {
          n.nx += n.vx;
          n.ny += n.vy;
          n.nz += n.vz;

          if (n.nx > 1.15 || n.nx < -1.15) n.vx *= -1;
          if (n.ny > 1.15 || n.ny < -1.15) n.vy *= -1;
          if (n.nz > 0.75 || n.nz < -0.75) n.vz *= -1;
        }

        const world = rotatePerspective(
          n.nx * halfW * 1.05,
          n.ny * halfH * 1.05,
          n.nz * 260,
          rotX,
          rotY
        );
        const scale = fov / (fov + world.z + 280);
        const sx = halfW + world.x * scale;
        const sy = halfH + world.y * scale;

        projX[i] = sx;
        projY[i] = sy;
        projZ[i] = world.z;
        projScale[i] = scale;

        if (pointer.active) {
          const dist = Math.hypot(sx - pointer.x, sy - pointer.y);
          pointerBoost[i] = dist < pointerRadius ? 1 - dist / pointerRadius : 0;
        } else {
          pointerBoost[i] = 0;
        }
      }

      // 4. Líneas sinápticas blanco estelar / blanco-azulado (opacidad 0.45..0.95 según profundidad)
      const maxConnectDist = Math.max(135, Math.min(width, height) * 0.17);
      const maxConnectDistSq = maxConnectDist * maxConnectDist;

      for (let i = 0; i < NODE_COUNT; i++) {
        const ax = projX[i];
        const ay = projY[i];
        if (ax < -80 || ax > width + 80 || ay < -80 || ay > height + 80) continue;

        let linkCount = 0;
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const bx = projX[j];
          const by = projY[j];
          const dx = bx - ax;
          const dy = by - ay;
          const dSq = dx * dx + dy * dy;

          if (dSq < maxConnectDistSq) {
            const dist = Math.sqrt(dSq);
            const proximity = 1 - dist / maxConnectDist;
            const depthFactor = Math.max(
              0.45,
              Math.min(0.95, (projScale[i] + projScale[j]) * 0.5)
            );
            const boost = Math.max(pointerBoost[i], pointerBoost[j]);
            const alpha = Math.min(0.95, proximity * depthFactor * (0.52 + boost * 0.43));

            const lineGrad = ctx.createLinearGradient(ax, ay, bx, by);
            lineGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            lineGrad.addColorStop(0.5, `rgba(224, 242, 254, ${alpha * 0.92})`);
            lineGrad.addColorStop(1, `rgba(125, 211, 252, ${alpha * 0.88})`);

            ctx.globalAlpha = 1;
            ctx.lineWidth = 0.85 + boost * 0.75;
            ctx.strokeStyle = lineGrad;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();

            // Pulso luminoso blanco viajando por las conexiones
            if ((i + j) % 4 === 0 || boost > 0.25) {
              const key = `${i}-${j}`;
              let pulse = edgePulses.get(key);
              if (!pulse) {
                pulse = {
                  t: ((i * 17 + j * 31) % 100) / 100,
                  speed: 0.35 + ((i + j) % 4) * 0.12,
                };
                edgePulses.set(key, pulse);
              }
              if (!prefersReducedMotion) {
                pulse.t = (pulse.t + pulse.speed * dt) % 1;
              }
              const px = ax + dx * pulse.t;
              const py = ay + dy * pulse.t;

              ctx.globalAlpha = Math.min(0.95, proximity * (0.72 + boost * 0.25));
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(px, py, 1.5 + boost * 0.9, 0, Math.PI * 2);
              ctx.fill();
            }

            linkCount++;
            if (linkCount >= 4) break;
          }
        }
      }

      // 5. Filamentos luminosos blanco estelar hacia el cursor
      if (pointer.active) {
        for (let i = 0; i < NODE_COUNT; i++) {
          const boost = pointerBoost[i];
          if (boost <= 0.05) continue;

          const nx = projX[i];
          const ny = projY[i];
          const pGrad = ctx.createLinearGradient(nx, ny, pointer.x, pointer.y);
          pGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.95, 0.45 + boost * 0.5)})`);
          pGrad.addColorStop(0.55, `rgba(224, 242, 254, ${Math.min(0.9, 0.4 + boost * 0.45)})`);
          pGrad.addColorStop(1, `rgba(125, 211, 252, ${Math.min(0.95, 0.45 + boost * 0.5)})`);

          ctx.globalAlpha = 1;
          ctx.lineWidth = 0.95 + boost * 0.85;
          ctx.strokeStyle = pGrad;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }

        const cursorHalo = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          95
        );
        cursorHalo.addColorStop(0, "rgba(255, 255, 255, 0.22)");
        cursorHalo.addColorStop(0.45, "rgba(125, 211, 252, 0.10)");
        cursorHalo.addColorStop(1, "rgba(5, 7, 13, 0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = cursorHalo;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 95, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Dibujar los ~220 nodos blanco brillante estelar con shadowBlur / halo
      ctx.shadowColor = "rgba(224, 242, 254, 0.9)";
      for (let i = 0; i < NODE_COUNT; i++) {
        const n = nodes[i];
        const sx = projX[i];
        const sy = projY[i];
        if (sx < -40 || sx > width + 40 || sy < -40 || sy > height + 40) continue;

        const scale = projScale[i];
        const boost = pointerBoost[i];
        const pulse =
          0.78 + 0.22 * Math.sin(elapsed * n.pulseSpeed + n.pulsePhase);
        const radius = n.baseRadius * scale * (1 + boost * 0.75);
        const depthOpacity = Math.max(0.45, Math.min(0.95, scale * 0.9));

        if (n.hasHalo || boost > 0.2) {
          const haloRadius = radius * (4.8 + boost * 2.5);
          const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloRadius);
          halo.addColorStop(0, n.haloColor);
          halo.addColorStop(1, "rgba(5, 7, 13, 0)");
          ctx.shadowBlur = 0;
          ctx.globalAlpha = Math.min(0.95, (0.62 + boost * 0.33) * pulse);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(sx, sy, haloRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.shadowBlur = n.hasHalo || boost > 0.25 ? 10 + boost * 8 : 4;
        ctx.globalAlpha = Math.min(0.95, depthOpacity * pulse + boost * 0.25);
        ctx.fillStyle = boost > 0.35 ? "#ffffff" : n.color;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(renderFrame);
      }
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseleave", onMouseLeave);
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

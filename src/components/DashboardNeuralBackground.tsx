"use client";

import React, { useEffect, useRef } from "react";

interface PanoramicNode {
  // Normalized 3D coordinates spanning full viewport (-1.15..1.15)
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
  // Diagonal galactic stream across full viewport
  streamPos: number; // -1.3 .. 1.3 along diagonal
  spread: number; // perpendicular offset
  depth: number; // -1 .. 1
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

const COSMIC_PALETTE = [
  "#38bdf8", // cian eléctrico
  "#22d3ee", // cian brillante
  "#6366f1", // índigo profundo
  "#a855f7", // violeta luminoso
  "#d946ef", // destello magenta
  "#f0f9ff", // núcleo blanco-azulado
];

const HALO_MAP: Record<string, string> = {
  "#38bdf8": "rgba(56, 189, 248, 0.35)",
  "#22d3ee": "rgba(34, 211, 238, 0.35)",
  "#6366f1": "rgba(99, 102, 241, 0.35)",
  "#a855f7": "rgba(168, 85, 247, 0.35)",
  "#d946ef": "rgba(217, 70, 239, 0.32)",
  "#f0f9ff": "rgba(240, 249, 255, 0.4)",
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

    // 1. Constelación Neuronal Panorámica en 3D (~220 nodos distribuidos por toda la pantalla)
    const nodes: PanoramicNode[] = Array.from({ length: NODE_COUNT }, (_, i) => {
      const colorRoll = Math.random();
      const color =
        colorRoll < 0.26
          ? "#38bdf8"
          : colorRoll < 0.48
            ? "#22d3ee"
            : colorRoll < 0.68
              ? "#6366f1"
              : colorRoll < 0.85
                ? "#a855f7"
                : colorRoll < 0.94
                  ? "#d946ef"
                  : "#f0f9ff";

      return {
        nx: (Math.random() - 0.5) * 2.24,
        ny: (Math.random() - 0.5) * 2.24,
        nz: (Math.random() - 0.5) * 1.4,
        vx: (Math.random() - 0.5) * 0.00055,
        vy: (Math.random() - 0.5) * 0.00055,
        vz: (Math.random() - 0.5) * 0.00045,
        color,
        haloColor: HALO_MAP[color],
        baseRadius: i % 6 === 0 ? 2.1 + Math.random() * 1.4 : 1.0 + Math.random() * 1.3,
        hasHalo: i % 5 === 0,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 1.4 + Math.random() * 2.0,
      };
    });

    // Pulsos de luz que recorren las conexiones cercanas
    const edgePulses = new Map<string, EdgePulse>();

    // 2. Corriente Galáctica / Nebulosa de Partículas (~500 partículas cruzando en diagonal)
    const galaxyParticles: GalacticParticle[] = Array.from(
      { length: GALAXY_PARTICLE_COUNT },
      (_, i) => {
        const color = COSMIC_PALETTE[i % COSMIC_PALETTE.length];
        // Distribución concentrada a lo largo de la banda diagonal + dispersión periférica
        const inBand = Math.random() < 0.72;
        const spread = inBand
          ? (Math.random() - 0.5) * 0.58 + (Math.random() - 0.5) * 0.25
          : (Math.random() - 0.5) * 2.1;

        return {
          streamPos: (Math.random() - 0.5) * 2.6,
          spread,
          depth: (Math.random() - 0.5) * 1.8,
          speed: 0.022 + Math.random() * 0.045,
          size: i % 12 === 0 ? 1.8 + Math.random() * 1.4 : 0.65 + Math.random() * 1.35,
          color,
          alpha: 0.35 + Math.random() * 0.65,
          hasHalo: i % 14 === 0,
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

      // Suave inclinación 3D hacia el puntero
      pointer.tiltX += (pointer.normY * 0.18 - pointer.tiltX) * 0.05;
      pointer.tiltY += (pointer.normX * 0.24 - pointer.tiltY) * 0.05;

      // 1. Fondo espacial profundo idéntico a la portada (#05070d)
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#05070d";
      ctx.fillRect(0, 0, width, height);

      // Brillo aditivo idéntico a la galaxia de inicio
      ctx.globalCompositeOperation = "lighter";

      const halfW = width * 0.5;
      const halfH = height * 0.5;
      const fov = Math.max(width, height) * 1.15;

      // Resplandores nebulosos ambientales en diagonal (cian eléctrico + índigo/violeta)
      const neb1 = ctx.createRadialGradient(
        width * 0.22 - pointer.tiltY * 80,
        height * 0.24 - pointer.tiltX * 80,
        0,
        width * 0.22 - pointer.tiltY * 80,
        height * 0.24 - pointer.tiltX * 80,
        Math.max(width, height) * 0.52
      );
      neb1.addColorStop(0, "rgba(56, 189, 248, 0.11)");
      neb1.addColorStop(0.45, "rgba(99, 102, 241, 0.05)");
      neb1.addColorStop(1, "rgba(5, 7, 13, 0)");
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, width, height);

      const neb2 = ctx.createRadialGradient(
        width * 0.78 + pointer.tiltY * 80,
        height * 0.76 + pointer.tiltX * 80,
        0,
        width * 0.78 + pointer.tiltY * 80,
        height * 0.76 + pointer.tiltX * 80,
        Math.max(width, height) * 0.55
      );
      neb2.addColorStop(0, "rgba(168, 85, 247, 0.12)");
      neb2.addColorStop(0.42, "rgba(217, 70, 239, 0.05)");
      neb2.addColorStop(1, "rgba(5, 7, 13, 0)");
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, width, height);

      // 2. Corriente Galáctica / Nebulosa de Partículas (~500 partículas diagonales de extremo a extremo)
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

        // Rotación sutil de la corriente alrededor del eje diagonal
        const swirl = elapsed * 0.14 + p.streamPos * 1.6;
        const localX = p.streamPos;
        const localY = p.spread + Math.sin(swirl) * 0.04;
        const localZ = p.depth + Math.cos(swirl) * 0.18;

        // Rotación diagonal panorámica
        const rx = localX * cosD - localY * sinD;
        const ry = localX * sinD + localY * cosD;

        // Perspectiva 3D con inclinación del cursor
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
          0.62 + 0.38 * Math.sin(elapsed * p.twinkleSpeed + p.twinklePhase);
        const depthAlpha = Math.max(0.18, Math.min(1, scale * 0.85));

        if (p.hasHalo) {
          const haloR = p.size * scale * 4.5;
          const haloGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
          haloGrad.addColorStop(0, HALO_MAP[p.color]);
          haloGrad.addColorStop(1, "rgba(5, 7, 13, 0)");
          ctx.globalAlpha = p.alpha * twinkle * depthAlpha * 0.75;
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = p.alpha * twinkle * depthAlpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.5, p.size * scale), 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Actualizar y proyectar Constelación Neuronal Panorámica (~220 nodos en todo el viewport)
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

      // 4. Líneas sinápticas finas en degradado cian-violeta + pulsos de luz viajeros
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
            const boost = Math.max(pointerBoost[i], pointerBoost[j]);
            const alpha = proximity * (0.24 + boost * 0.42);

            const lineGrad = ctx.createLinearGradient(ax, ay, bx, by);
            lineGrad.addColorStop(0, `rgba(56, 189, 248, ${alpha})`);
            lineGrad.addColorStop(0.5, `rgba(99, 102, 241, ${alpha * 0.95})`);
            lineGrad.addColorStop(1, `rgba(168, 85, 247, ${alpha})`);

            ctx.globalAlpha = 1;
            ctx.lineWidth = 0.75 + boost * 0.75;
            ctx.strokeStyle = lineGrad;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();

            // Pulso luminoso viajando por algunas conexiones
            if ((i + j) % 5 === 0 || boost > 0.25) {
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

              ctx.globalAlpha = proximity * (0.65 + boost * 0.35);
              ctx.fillStyle = "#f0f9ff";
              ctx.beginPath();
              ctx.arc(px, py, 1.35 + boost * 0.9, 0, Math.PI * 2);
              ctx.fill();
            }

            linkCount++;
            if (linkCount >= 4) break;
          }
        }
      }

      // 5. Filamentos luminosos hacia el cursor desde los nodos cercanos
      if (pointer.active) {
        for (let i = 0; i < NODE_COUNT; i++) {
          const boost = pointerBoost[i];
          if (boost <= 0.05) continue;

          const nx = projX[i];
          const ny = projY[i];
          const pGrad = ctx.createLinearGradient(nx, ny, pointer.x, pointer.y);
          pGrad.addColorStop(0, `rgba(34, 211, 238, ${boost * 0.58})`);
          pGrad.addColorStop(0.55, `rgba(168, 85, 247, ${boost * 0.45})`);
          pGrad.addColorStop(1, `rgba(217, 70, 239, ${boost * 0.65})`);

          ctx.globalAlpha = 1;
          ctx.lineWidth = 0.85 + boost * 0.8;
          ctx.strokeStyle = pGrad;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }

        // Halo sutil en la posición del cursor
        const cursorHalo = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          95
        );
        cursorHalo.addColorStop(0, "rgba(56, 189, 248, 0.16)");
        cursorHalo.addColorStop(0.45, "rgba(168, 85, 247, 0.08)");
        cursorHalo.addColorStop(1, "rgba(5, 7, 13, 0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = cursorHalo;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 95, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Dibujar los ~220 nodos luminosos con halo suave
      for (let i = 0; i < NODE_COUNT; i++) {
        const n = nodes[i];
        const sx = projX[i];
        const sy = projY[i];
        if (sx < -40 || sx > width + 40 || sy < -40 || sy > height + 40) continue;

        const scale = projScale[i];
        const boost = pointerBoost[i];
        const pulse =
          0.72 + 0.28 * Math.sin(elapsed * n.pulseSpeed + n.pulsePhase);
        const radius = n.baseRadius * scale * (1 + boost * 0.75);

        if (n.hasHalo || boost > 0.2) {
          const haloRadius = radius * (4.4 + boost * 2.5);
          const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloRadius);
          halo.addColorStop(0, n.haloColor);
          halo.addColorStop(1, "rgba(5, 7, 13, 0)");
          ctx.globalAlpha = Math.min(1, (0.55 + boost * 0.45) * pulse);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(sx, sy, haloRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = Math.min(1, (0.65 + boost * 0.35) * pulse);
        ctx.fillStyle = boost > 0.45 ? "#f0f9ff" : n.color;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

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

"use client";

import React, { useEffect, useRef } from "react";

interface SphereNode {
  x: number;
  y: number;
  z: number;
  color: string;
  baseRadius: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface SynapticEdge {
  a: number;
  b: number;
  pulseOffset: number;
  color: string;
}

interface OrbitalParticle {
  ringIndex: number;
  angle: number;
  speed: number;
  radiusScale: number;
  size: number;
  color: string;
  alpha: number;
}

interface RingConfig {
  tiltX: number;
  tiltY: number;
  tiltZ: number;
  rxScale: number;
  ryScale: number;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  vx: number;
  vy: number;
  color: string;
}

const NODE_COUNT = 420;
const STAR_COUNT = 150;
const ORBITAL_PARTICLES_PER_RING = 90;

const PALETTE = ["#22d3ee", "#3b82f6", "#818cf8", "#ffffff"];

function rotate3D(
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number,
  rz: number
): { x: number; y: number; z: number } {
  // Rotate around X
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const y1 = y * cosX - z * sinX;
  const z1 = y * sinX + z * cosX;

  // Rotate around Y
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const x2 = x * cosY + z1 * sinY;
  const z2 = -x * sinY + z1 * cosY;

  // Rotate around Z
  const cosZ = Math.cos(rz);
  const sinZ = Math.sin(rz);
  const x3 = x2 * cosZ - y1 * sinZ;
  const y3 = x2 * sinZ + y1 * cosZ;

  return { x: x3, y: y3, z: z2 };
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

    // 1. Fibonacci Sphere Nodes (~420)
    const nodes: SphereNode[] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < NODE_COUNT; i++) {
      const y = 1 - (i / (NODE_COUNT - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const colorRoll = Math.random();
      const color =
        colorRoll < 0.42
          ? "#22d3ee"
          : colorRoll < 0.72
            ? "#3b82f6"
            : colorRoll < 0.94
              ? "#818cf8"
              : "#ffffff";

      nodes.push({
        x,
        y,
        z,
        color,
        baseRadius: 1.1 + Math.random() * 1.4,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 1.2 + Math.random() * 1.8,
      });
    }

    // 2. Precompute nearby synaptic edges on unit sphere
    const edges: SynapticEdge[] = [];
    const maxDistSq = 0.24 * 0.24;
    for (let i = 0; i < NODE_COUNT; i++) {
      let connections = 0;
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const dSq = dx * dx + dy * dy + dz * dz;
        if (dSq < maxDistSq) {
          edges.push({
            a: i,
            b: j,
            pulseOffset: Math.random() * Math.PI * 2,
            color: (i + j) % 2 === 0 ? "#22d3ee" : "#818cf8",
          });
          connections++;
          if (connections >= 4) break;
        }
      }
    }

    // 3. Three tilted 3D orbital rings (Atom / Energy)
    const ringConfigs: RingConfig[] = [
      { tiltX: 0.95, tiltY: 0.35, tiltZ: 0.25, rxScale: 1.45, ryScale: 1.45 },
      { tiltX: -0.75, tiltY: 0.85, tiltZ: -0.4, rxScale: 1.6, ryScale: 1.6 },
      { tiltX: 0.3, tiltY: -1.05, tiltZ: 0.7, rxScale: 1.72, ryScale: 1.72 },
    ];

    const orbitalParticles: OrbitalParticle[] = [];
    for (let r = 0; r < ringConfigs.length; r++) {
      for (let p = 0; p < ORBITAL_PARTICLES_PER_RING; p++) {
        const isHead = p % 15 === 0;
        orbitalParticles.push({
          ringIndex: r,
          angle: (p / ORBITAL_PARTICLES_PER_RING) * Math.PI * 2,
          speed: (r === 1 ? -1 : 1) * (0.28 + r * 0.06),
          radiusScale: 0.98 + (Math.random() - 0.5) * 0.04,
          size: isHead ? 2.2 : 0.9 + Math.random() * 0.9,
          color: isHead
            ? "#ffffff"
            : r === 0
              ? "#22d3ee"
              : r === 1
                ? "#818cf8"
                : "#3b82f6",
          alpha: isHead ? 0.9 : 0.3 + Math.random() * 0.45,
        });
      }
    }

    // 4. Peripheral starfield (~150 stars)
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      radius: 0.5 + Math.random() * 1.4,
      alpha: 0.25 + Math.random() * 0.55,
      twinkleSpeed: 0.8 + Math.random() * 2.0,
      twinklePhase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.00004,
      vy: (Math.random() - 0.5) * 0.00004,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    }));

    // Pointer interactivity with smooth lerp
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handlePointerMove = (clientX: number, clientY: number) => {
      pointer.targetX = (clientX / Math.max(width, 1) - 0.5) * 2;
      pointer.targetY = (clientY / Math.max(height, 1) - 0.5) * 2;
    };

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    let animationFrameId = 0;
    const startTime = performance.now();

    const projectedX = new Float32Array(NODE_COUNT);
    const projectedY = new Float32Array(NODE_COUNT);
    const projectedZ = new Float32Array(NODE_COUNT);
    const projectedScale = new Float32Array(NODE_COUNT);

    const renderFrame = (now: number) => {
      const elapsed = prefersReducedMotion ? 0 : (now - startTime) * 0.001;

      pointer.x += (pointer.targetX - pointer.x) * 0.05;
      pointer.y += (pointer.targetY - pointer.y) * 0.05;

      // Deep-space base fill
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#050811";
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "lighter";

      const centerX = width * 0.5 - pointer.x * 26;
      const centerY = height * 0.5 - pointer.y * 18;
      const sphereRadius = Math.min(width, height) * 0.25;
      const fov = Math.max(width, height) * 0.95;

      // Ambient core glow
      const coreGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        sphereRadius * 1.9
      );
      coreGlow.addColorStop(0, "rgba(34, 211, 238, 0.14)");
      coreGlow.addColorStop(0.35, "rgba(59, 130, 246, 0.08)");
      coreGlow.addColorStop(0.7, "rgba(129, 140, 248, 0.03)");
      coreGlow.addColorStop(1, "rgba(5, 8, 17, 0)");
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius * 1.9, 0, Math.PI * 2);
      ctx.fill();

      // 1. Render peripheral starfield
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (!prefersReducedMotion) {
          s.x = (s.x + s.vx + 1) % 1;
          s.y = (s.y + s.vy + 1) % 1;
        }
        const twinkle =
          0.55 + 0.45 * Math.sin(elapsed * s.twinkleSpeed + s.twinklePhase);
        const sx = s.x * width - pointer.x * 8 * s.radius;
        const sy = s.y * height - pointer.y * 8 * s.radius;

        ctx.globalAlpha = s.alpha * twinkle;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(sx, sy, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Global rotation angles (continuous + pointer tilt)
      const rotX = elapsed * 0.14 + pointer.y * 0.35;
      const rotY = elapsed * 0.22 + pointer.x * 0.45;
      const rotZ = elapsed * 0.05;

      // 2. Project Neural Sphere Nodes
      for (let i = 0; i < NODE_COUNT; i++) {
        const n = nodes[i];
        const r = rotate3D(n.x, n.y, n.z, rotX, rotY, rotZ);
        const worldZ = r.z * sphereRadius;
        const scale = fov / (fov + worldZ + sphereRadius * 0.8);
        projectedX[i] = centerX + r.x * sphereRadius * scale;
        projectedY[i] = centerY + r.y * sphereRadius * scale;
        projectedZ[i] = r.z;
        projectedScale[i] = scale;
      }

      // 3. Draw Synaptic Edges with traveling energy pulses
      ctx.lineWidth = 0.85;
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        const avgZ = (projectedZ[e.a] + projectedZ[e.b]) * 0.5;
        const depthAlpha = Math.max(0.05, Math.min(0.42, (1 - avgZ) * 0.22));
        const pulse =
          0.55 + 0.45 * Math.sin(elapsed * 2.2 + e.pulseOffset + avgZ * 2.0);

        ctx.globalAlpha = depthAlpha * pulse;
        ctx.strokeStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(projectedX[e.a], projectedY[e.a]);
        ctx.lineTo(projectedX[e.b], projectedY[e.b]);
        ctx.stroke();
      }

      // 4. Draw Neural Sphere Nodes
      for (let i = 0; i < NODE_COUNT; i++) {
        const n = nodes[i];
        const depthAlpha = Math.max(
          0.14,
          Math.min(0.95, (1 - projectedZ[i]) * 0.48)
        );
        const pulse =
          0.7 + 0.3 * Math.sin(elapsed * n.pulseSpeed + n.pulsePhase);

        ctx.globalAlpha = depthAlpha * pulse;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(
          projectedX[i],
          projectedY[i],
          n.baseRadius * projectedScale[i],
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // 5. Draw 3D Orbital Atom Rings
      for (let i = 0; i < orbitalParticles.length; i++) {
        const p = orbitalParticles[i];
        const cfg = ringConfigs[p.ringIndex];
        const a = p.angle + elapsed * p.speed;

        const localX = Math.cos(a) * cfg.rxScale * p.radiusScale;
        const localY = Math.sin(a) * cfg.ryScale * p.radiusScale;
        const localZ = 0;

        // First apply the ring's own 3D inclination
        const tilted = rotate3D(
          localX,
          localY,
          localZ,
          cfg.tiltX,
          cfg.tiltY,
          cfg.tiltZ
        );
        // Then apply subtle global pointer/scene rotation
        const world = rotate3D(
          tilted.x,
          tilted.y,
          tilted.z,
          pointer.y * 0.28 + elapsed * 0.04,
          pointer.x * 0.38 + elapsed * 0.06,
          0
        );

        const worldZ = world.z * sphereRadius;
        const scale = fov / (fov + worldZ + sphereRadius * 0.8);
        const sx = centerX + world.x * sphereRadius * scale;
        const sy = centerY + world.y * sphereRadius * scale;
        const depthAlpha = Math.max(0.12, Math.min(1, (1 - world.z * 0.5) * 0.65));

        ctx.globalAlpha = p.alpha * depthAlpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * scale, 0, Math.PI * 2);
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

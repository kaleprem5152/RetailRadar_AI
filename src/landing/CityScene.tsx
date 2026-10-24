import React, { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "../components/chrome";

/* A floating miniature trade-area: the "radar table" that anchors
   the RetailRadar identity. Pure R3F + three, no postprocessing. */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const BODY_COLORS = ["#1b202a", "#202634", "#232936", "#191e27", "#262c3a", "#1d2531"];

interface BuildingSpec {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  colorIdx: number;
  glow: number; // 0 none, else light warmth
}

function buildCity(): { bodies: BuildingSpec[]; lights: { x: number; y: number; z: number; s: number }[] } {
  const r = rng(44123);
  const bodies: BuildingSpec[] = [];
  const lights: { x: number; y: number; z: number; s: number }[] = [];
  const cell = 1.02;
  const n = 13;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const gx = (i - (n - 1) / 2) * cell;
      const gz = (j - (n - 1) / 2) * cell;
      const dist = Math.hypot(gx, gz);
      // carve streets + a plaza around the subject site
      if (i % 5 === 2 || j % 5 === 3) continue;
      if (dist < 1.5) continue;
      if (dist > 6.9) continue;
      const centerBoost = Math.max(0, 1 - dist / 7) * 1.6;
      const h = 0.35 + r() * 1.15 + centerBoost;
      const w = cell * (0.52 + r() * 0.3);
      const d = cell * (0.52 + r() * 0.3);
      const spec: BuildingSpec = {
        x: gx + (r() - 0.5) * 0.16,
        z: gz + (r() - 0.5) * 0.16,
        w,
        d,
        h,
        colorIdx: Math.floor(r() * BODY_COLORS.length),
        glow: r() > 0.62 ? 0.4 + r() * 0.6 : 0,
      };
      bodies.push(spec);
      if (spec.glow > 0) lights.push({ x: spec.x, y: h + 0.03, z: spec.z, s: w * 0.42 });
      if (r() > 0.86) lights.push({ x: spec.x, y: h * (0.4 + r() * 0.4), z: spec.z + (d / 2 + 0.01), s: w * 0.34 });
    }
  }
  return { bodies, lights };
}

function Buildings() {
  const { bodies, lights } = useMemo(buildCity, []);
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    bodies.forEach((b, i) => {
      m.makeScale(b.w, b.h, b.d).setPosition(b.x, b.h / 2, b.z);
      body.setMatrixAt(i, m);
      body.setColorAt(i, c.set(BODY_COLORS[b.colorIdx]));
    });
    body.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;

    const lm = lightRef.current;
    if (lm) {
      lights.forEach((l, i) => {
        m.makeScale(l.s, 0.012, l.s).setPosition(l.x, l.y, l.z);
        lm.setMatrixAt(i, m);
      });
      lm.instanceMatrix.needsUpdate = true;
    }
  }, [bodies, lights]);

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, bodies.length]} key={bodies.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.55} metalness={0.25} flatShading />
      </instancedMesh>
      <instancedMesh ref={lightRef} args={[undefined, undefined, lights.length]} key={lights.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#e9b95c" toneMapped={false} transparent opacity={0.85} />
      </instancedMesh>
    </group>
  );
}

/* Canvas-texture radar sweep wedge */
function makeSweepTexture(): THREE.CanvasTexture {
  const cnv = document.createElement("canvas");
  cnv.width = 256;
  cnv.height = 256;
  const ctx = cnv.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 128, 256, 128);
  g.addColorStop(0, "rgba(217,164,65,0.55)");
  g.addColorStop(0.75, "rgba(217,164,65,0.10)");
  g.addColorStop(1, "rgba(217,164,65,0)");
  ctx.translate(128, 128);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 126, -0.34, 0);
  ctx.closePath();
  ctx.fill();
  // bright leading edge
  ctx.strokeStyle = "rgba(236,192,105,0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(126 * Math.cos(-0.34), 126 * Math.sin(-0.34));
  ctx.stroke();
  const tex = new THREE.CanvasTexture(cnv);
  return tex;
}

function Radar({ intensity }: { intensity: React.MutableRefObject<number> }) {
  const sweepMat = useRef<THREE.MeshBasicMaterial>(null);
  const sweep = useRef<THREE.Group>(null);
  const pulseA = useRef<THREE.Mesh>(null);
  const pulseB = useRef<THREE.Mesh>(null);
  const tex = useMemo(makeSweepTexture, []);
  const reduced = useReducedMotion();

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (!reduced && sweep.current) {
      sweep.current.rotation.y -= dt * (0.55 + intensity.current * 0.75);
    }
    const pulse = (m: THREE.Mesh | null, phase: number) => {
      if (!m) return;
      const cyc = ((t * (0.42 + intensity.current * 0.3) + phase) % 1);
      const s = 0.5 + cyc * 6.2;
      m.scale.set(s, s, s);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - cyc) * 0.34;
    };
    pulse(pulseA.current, 0);
    pulse(pulseB.current, 0.5);
    if (sweepMat.current) sweepMat.current.opacity = 0.16 + intensity.current * 0.22;
  });

  return (
    <group position={[0, 0.32, 0]}>
      <group ref={sweep}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[12.4, 12.4]} />
          <meshBasicMaterial ref={sweepMat} map={tex} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      {/* pulsing range rings around the subject */}
      <mesh ref={pulseA} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.96, 1, 72]} />
        <meshBasicMaterial color="#d9a441" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={pulseB} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.96, 1, 72]} />
        <meshBasicMaterial color="#d9a441" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* static survey rings */}
      {[2.2, 3.9, 5.6].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015 + i * 0.002, 0]}>
          <ringGeometry args={[r - 0.012, r, 96]} />
          <meshBasicMaterial color="#5f6c85" transparent opacity={0.32 - i * 0.07} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function SubjectSite({ intensity }: { intensity: React.MutableRefObject<number> }) {
  const glow = useRef<THREE.PointLight>(null);
  const beam = useRef<THREE.Mesh>(null);
  const reduced = useReducedMotion();
  useFrame((state) => {
    const k = 0.75 + intensity.current * 0.9 + (reduced ? 0 : Math.sin(state.clock.elapsedTime * 2.2) * 0.12);
    if (glow.current) glow.current.intensity = 26 * k;
    if (beam.current) {
      const mat = beam.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.10 * k + 0.05;
    }
  });
  return (
    <group>
      {/* subject building */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.72, 1.7, 0.72]} />
        <meshStandardMaterial color="#2c2417" roughness={0.4} metalness={0.35} emissive="#d9a441" emissiveIntensity={0.32} />
      </mesh>
      <mesh position={[0, 1.76, 0]}>
        <boxGeometry args={[0.5, 0.12, 0.5]} />
        <meshStandardMaterial color="#d9a441" emissive="#e9b95c" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {/* beacon beam */}
      <mesh ref={beam} position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.05, 0.22, 1.8, 16, 1, true]} />
        <meshBasicMaterial color="#e9b95c" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <pointLight ref={glow} position={[0, 2.1, 0]} color="#e9b95c" intensity={26} distance={7.5} decay={2.1} />
      {/* competitor pins */}
      {[
        [2.2, 0, 1.4], [-2.6, 0, 2.0], [1.6, 0, -2.8], [-1.9, 0, -2.2], [3.4, 0, -1.2], [-3.2, 0, -0.6],
      ].map((p, i) => (
        <group key={i} position={[p[0] as number, 0, p[2] as number]}>
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.84]} />
            <meshBasicMaterial color="#7f8ba0" transparent opacity={0.7} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshBasicMaterial color="#9cb8d4" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Table({ intensity }: { intensity: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const baseTilt = useRef({ x: 0, z: 0 });
  const reduced = useReducedMotion();

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const p = state.pointer;
    // ease pointer tilt
    const targetX = reduced ? 0 : p.y * 0.13;
    const targetZ = reduced ? 0 : -p.x * 0.09;
    baseTilt.current.x += (targetX - baseTilt.current.x) * Math.min(1, dt * 4);
    baseTilt.current.z += (targetZ - baseTilt.current.z) * Math.min(1, dt * 4);
    g.rotation.x = baseTilt.current.x;
    g.rotation.z = baseTilt.current.z;
    if (!reduced) {
      g.rotation.y += dt * 0.07;
      g.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.12;
    }
  });

  return (
    <group ref={group} rotation={[0, 0.5, 0]}>
      {/* floating plinth */}
      <mesh position={[0, -0.46, 0]}>
        <boxGeometry args={[13.6, 0.55, 13.6]} />
        <meshStandardMaterial color="#101319" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[13.62, 0.06, 13.62]} />
        <meshStandardMaterial color="#1a1f28" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* edge glow strip */}
      <mesh position={[0, -0.72, 0]}>
        <boxGeometry args={[13.65, 0.03, 13.65]} />
        <meshBasicMaterial color="#d9a441" transparent opacity={0.22} toneMapped={false} />
      </mesh>
      {/* etched street grid */}
      <gridHelper args={[12.6, 18, "#2c3547", "#1a2029"]} position={[0, -0.125, 0]} />
      <Buildings />
      <SubjectSite intensity={intensity} />
      <Radar intensity={intensity} />
    </group>
  );
}

function Dust() {
  const ref = useRef<THREE.Points>(null);
  const reduced = useReducedMotion();
  const { positions, count } = useMemo(() => {
    const r = rng(9021);
    const count = 130;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (r() - 0.5) * 17;
      arr[i * 3 + 1] = r() * 7 - 1;
      arr[i * 3 + 2] = (r() - 0.5) * 17;
    }
    return { positions: arr, count };
  }, []);
  useFrame((state) => {
    if (reduced || !ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.012;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial color="#c9a963" size={0.045} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ── Public component with fallbacks ─────────────────────── */
export default function CityScene({ className }: { className?: string }) {
  const [supported] = useState(() => {
    try {
      const c = document.createElement("canvas");
      return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      return false;
    }
  });
  const [crashed, setCrashed] = useState(false);
  const intensity = useRef(0);
  const hoverTarget = useRef(0);

  useFramelessHover(intensity, hoverTarget);

  if (!supported || crashed) {
    return (
      <div className={className}>
        <StaticDiorama />
      </div>
    );
  }

  return (
    <div
      className={className}
      onPointerEnter={() => (hoverTarget.current = 1)}
      onPointerLeave={() => (hoverTarget.current = 0)}
      aria-hidden="true"
    >
      <GLBoundary onError={() => setCrashed(true)}>
        <Canvas
          dpr={[1, 1.8]}
          camera={{ position: [11.8, 9.2, 11.8], fov: 34 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ background: "transparent" }}
        >
          <fog attach="fog" args={["#0a0b0e", 22, 38]} />
          <ambientLight intensity={0.32} color="#aeb9cf" />
          <directionalLight position={[7, 12, 4]} intensity={1.6} color="#f3e3c0" />
          <directionalLight position={[-6, 5, -7]} intensity={0.5} color="#7fa1c4" />
          <CameraRig />
          <React.Suspense fallback={null}>
            <Table intensity={intensity} />
            <Dust />
          </React.Suspense>
        </Canvas>
      </GLBoundary>
    </div>
  );
}

class GLBoundary extends React.Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function useFramelessHover(intensity: React.MutableRefObject<number>, target: React.MutableRefObject<number>) {
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      intensity.current += (target.current - intensity.current) * 0.06;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [intensity, target]);
}

function CameraRig() {
  const reduced = useReducedMotion();
  useFrame((state, dt) => {
    if (reduced) return;
    const p = state.pointer;
    const cam = state.camera;
    cam.position.x += (11.8 + p.x * 0.9 - cam.position.x) * Math.min(1, dt * 2.4);
    cam.position.y += (9.2 - p.y * 0.7 - cam.position.y) * Math.min(1, dt * 2.4);
    cam.lookAt(0, 0.4, 0);
  });
  return null;
}

/* Static isometric fallback when WebGL is unavailable */
function StaticDiorama() {
  return (
    <svg viewBox="0 0 640 520" className="h-full w-full" role="img" aria-label="Isometric illustration of a city trade area under radar scan">
      <defs>
        <linearGradient id="slab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1f28" />
          <stop offset="1" stopColor="#101319" />
        </linearGradient>
      </defs>
      <g transform="translate(320 250)">
        <ellipse rx="300" ry="150" fill="none" stroke="#2c3547" strokeWidth="1" opacity="0.5" />
        <ellipse rx="220" ry="108" fill="none" stroke="#2c3547" strokeWidth="1" opacity="0.4" />
        <ellipse rx="140" ry="68" fill="none" stroke="#3a445a" strokeWidth="1" opacity="0.45" />
        <path d="M-300 0 L0 150 L300 0 L0 -150 Z" fill="url(#slab)" stroke="#2b3341" />
        {([
          [-180, -40, 46, 26, "#202634"], [-120, -70, 60, 40, "#232936"], [-60, -95, 52, 30, "#1b202a"],
          [60, -90, 66, 44, "#202634"], [140, -60, 48, 28, "#191e27"], [200, -30, 40, 22, "#232936"],
          [-220, 10, 40, 22, "#1d2531"], [-140, 30, 56, 34, "#202634"], [-70, 60, 44, 26, "#191e27"],
          [80, 55, 58, 36, "#262c3a"], [160, 25, 42, 24, "#1b202a"], [220, 10, 36, 20, "#202634"],
        ] as Array<[number, number, number, number, string]>).map(([x, y, h, w, fill], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d={`M0 0 L${w / 2} ${w / 4} L${w / 2} ${w / 4 - h} L0 ${-h} Z`} fill={fill} />
            <path d={`M0 0 L${-w / 2} ${w / 4} L${-w / 2} ${w / 4 - h} L0 ${-h} Z`} fill="#141821" />
            <path d={`M0 ${-h} L${w / 2} ${w / 4 - h} L0 ${w / 2 - h} L${-w / 2} ${w / 4 - h} Z`} fill="#2a3140" />
          </g>
        ))}
        <g>
          <path d="M0 0 L26 13 L26 -47 L0 -60 Z" fill="#3a2e18" />
          <path d="M0 0 L-26 13 L-26 -47 L0 -60 Z" fill="#2c2417" />
          <path d="M0 -60 L26 -47 L0 -34 L-26 -47 Z" fill="#d9a441" />
          <line x1="0" y1="-60" x2="0" y2="-92" stroke="#d9a441" strokeWidth="2" />
          <circle cx="0" cy="-96" r="4" fill="#e9b95c" />
        </g>
      </g>
    </svg>
  );
}

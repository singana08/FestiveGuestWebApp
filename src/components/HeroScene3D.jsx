import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 100;
const STAR_COUNT = 280;

// ── Glowing orb with layered halos ──
const GlowOrb = ({ position, color, size = 0.8, floatSpeed = 1.5 }) => (
  <Float speed={floatSpeed} rotationIntensity={0.2} floatIntensity={0.8}>
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.0}
          transparent
          opacity={0.88}
          roughness={0.1}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[size * 1.4, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.18}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  </Float>
);

// ── Rotating torus ring ──
const FestivalRing = ({ position, color, radius = 1.2, tube = 0.06, speed = 0.4, rotation = [0, 0, 0] }) => {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.getElapsedTime() * speed;
  });
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <torusGeometry args={[radius, tube, 6, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        transparent
        opacity={0.7}
        metalness={0.4}
        roughness={0.25}
      />
    </mesh>
  );
};

// ── Rising particle sparks ──
const FestivalParticles = ({ count = PARTICLE_COUNT }) => {
  const ref = useRef();

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1;
      spd[i] = 0.07 + Math.random() * 0.14;
    }
    return { positions: pos, speeds: spd };
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.attributes.position;
    if (!attr) return;
    for (let i = 0; i < count; i++) {
      attr.array[i * 3 + 1] += speeds[i] * delta;
      if (attr.array[i * 3 + 1] > 5.5) {
        attr.array[i * 3 + 1] = -5.5;
        attr.array[i * 3]     = (Math.random() - 0.5) * 14;
        attr.array[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#FFD700" size={0.07} sizeAttenuation transparent opacity={0.9} />
    </points>
  );
};

// ── Mouse-responsive scene wrapper (desktop only) ──
const SceneGroup = ({ children, parallaxEnabled }) => {
  const groupRef = useRef();
  const mouse = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!parallaxEnabled) return;
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [parallaxEnabled]);

  useFrame(() => {
    if (!groupRef.current || !parallaxEnabled) return;
    current.current.x += (mouse.current.y * 0.08 - current.current.x) * 0.03;
    current.current.y += (mouse.current.x * 0.12 - current.current.y) * 0.03;
    groupRef.current.rotation.x = current.current.x;
    groupRef.current.rotation.y = current.current.y;
  });

  return <group ref={groupRef}>{children}</group>;
};

// ── The full scene ──
const Scene = ({ parallaxEnabled }) => (
  <SceneGroup parallaxEnabled={parallaxEnabled}>
    <ambientLight intensity={0.8} />
    <pointLight position={[5, 5, 4]} color="#FF6B35" intensity={6} />
    <pointLight position={[-5, -3, 3]} color="#FFB347" intensity={4} />
    <pointLight position={[0, 4, 2]} color="#ffffff" intensity={1.5} />

    <GlowOrb position={[4.2, 1.8, -3.0]} color="#FF6B35" size={1.4} floatSpeed={1.0} />
    <GlowOrb position={[-3.8, -1.6, -2.0]} color="#FFB347" size={0.95} floatSpeed={1.3} />
    <GlowOrb position={[1.5, 3.0, -3.5]} color="#FF8C5E" size={0.65} floatSpeed={1.5} />
    <GlowOrb position={[-1.5, -2.8, -1.2]} color="#FFC837" size={0.5} floatSpeed={1.1} />

    <FestivalRing
      position={[3.6, 0.2, -2]}
      color="#FF6B35" radius={1.5} tube={0.06}
      rotation={[Math.PI / 3, 0, 0.3]} speed={0.28}
    />
    <FestivalRing
      position={[-2.6, 2.2, -3]}
      color="#FFB347" radius={1.0} tube={0.05}
      rotation={[Math.PI / 5, 0, -0.5]} speed={-0.18}
    />

    <FestivalParticles count={PARTICLE_COUNT} />
    <Stars radius={60} depth={30} count={STAR_COUNT} factor={2.5} saturation={0.25} fade speed={0.15} />
  </SceneGroup>
);

// ── Exported component — pauses WebGL when hero scrolls out of view ──
export default function HeroScene3D() {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const [parallaxEnabled, setParallaxEnabled] = useState(false);
  // World-space orb positions are tuned for wide desktop aspect ratios — on a
  // narrow/coarse-pointer (mobile) viewport the camera's horizontal FOV shrinks
  // and orbs swing into the center, overlapping the hero text. Skip the whole
  // scene there rather than re-tuning positions per aspect ratio.
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setParallaxEnabled(!coarse && !reduced);
    setSkip(coarse);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '80px 0px', threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (skip) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      <Canvas
        camera={{ fov: 55, position: [0, 0, 7], near: 0.1, far: 120 }}
        dpr={[1, 1.25]}
        frameloop={visible ? 'always' : 'never'}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene parallaxEnabled={parallaxEnabled} />
        </Suspense>
      </Canvas>
    </div>
  );
}

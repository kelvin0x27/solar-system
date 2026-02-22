import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import type { PlanetData } from '@/data/planets';
import { useSolarSystemStore } from '@/stores/solarSystemStore';
import { MOONS } from '@/data/moons';

// Sun glow sprite texture
function createGlowTexture(innerColor: string, outerColor: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, innerColor);
  g.addColorStop(0.3, outerColor);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

export function getTextureUrl(id: string) {
  if (['venus'].includes(id)) {
    return `/textures/2k_${id}_surface.jpg`;
  }
  const nameMap: Record<string, string> = {
    earth: '2k_earth_daymap.jpg',
    venus: '2k_venus_surface.jpg',
    sun: '2k_sun.jpg',
    mercury: '2k_mercury.jpg',
    mars: '2k_mars.jpg',
    jupiter: '2k_jupiter.jpg',
    saturn: '2k_saturn.jpg',
    uranus: '2k_uranus.jpg',
    neptune: '2k_neptune.jpg',
    moon: '2k_moon.jpg',
  };
  return `/textures/${nameMap[id] || '2k_moon.jpg'}`;
}

const BODY_MAP: Record<string, string> = {
  mercury: 'Mercury',
  venus: 'Venus',
  earth: 'Earth',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
};

export function Sun() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const showGlow = useSolarSystemStore((s) => s.showGlow);
  const showLabels = useSolarSystemStore((s) => s.showLabels);
  const selectPlanet = useSolarSystemStore((s) => s.selectPlanet);

  const glowTex = useMemo(
    () => createGlowTexture('rgba(255,220,100,0.8)', 'rgba(255,120,20,0.15)'),
    [],
  );
  const coronaTex = useMemo(
    () => createGlowTexture('rgba(255,200,80,0.3)', 'rgba(255,100,30,0.03)'),
    [],
  );

  const sunTex = useTexture(getTextureUrl('sun'));

  useFrame(({ clock }) => {
    if (meshRef.current)
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.002;
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={() => selectPlanet('sun')}
        userData={{ planetId: 'sun' }}
      >
        <sphereGeometry args={[5, 64, 64]} />
        <meshBasicMaterial map={sunTex} />
      </mesh>
      <pointLight
        position={[0, 0, 0]}
        intensity={2}
        distance={300}
        decay={0.5}
        color={0xffeedd}
      />
      {showGlow && (
        <>
          <sprite scale={[22, 22, 1]}>
            <spriteMaterial
              map={glowTex}
              blending={THREE.AdditiveBlending}
              transparent
              depthWrite={false}
            />
          </sprite>
          <sprite scale={[35, 35, 1]}>
            <spriteMaterial
              map={coronaTex}
              blending={THREE.AdditiveBlending}
              transparent
              depthWrite={false}
            />
          </sprite>
        </>
      )}
      {showLabels && (
        <Html
          position={[0, 6.5, 0]}
          center
          style={{ pointerEvents: 'none', zIndex: 1 }}
          zIndexRange={[0, 100]}
        >
          <div className='glass-sm px-2 py-0.5 text-xs text-text-secondary font-display whitespace-nowrap'>
            Mặt Trời
          </div>
        </Html>
      )}
    </group>
  );
}

export function Planet({ data }: { data: PlanetData }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const angleRef = useRef(Math.random() * Math.PI * 2);

  const speed = useSolarSystemStore((s) => s.speedMultiplier);
  const showOrbits = useSolarSystemStore((s) => s.showOrbits);
  const showLabels = useSolarSystemStore((s) => s.showLabels);
  const showGlow = useSolarSystemStore((s) => s.showGlow);
  const showMoons = useSolarSystemStore((s) => s.showMoons);
  const isRealTime = useSolarSystemStore((s) => s.isRealTime);
  const selectPlanet = useSolarSystemStore((s) => s.selectPlanet);
  const selectedPlanetId = useSolarSystemStore((s) => s.selectedPlanetId);

  const planetMoons = useMemo(
    () => MOONS.filter((m) => m.parentId === data.id),
    [data.id],
  );

  // Orbit line points
  const orbitPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * data.orbitRadius,
          0,
          Math.sin(a) * data.orbitRadius,
        ),
      );
    }
    return pts;
  }, [data.orbitRadius]);

  const orbitGeometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(orbitPoints),
    [orbitPoints],
  );

  const planetTex = useTexture(getTextureUrl(data.id));

  useFrame((_, delta) => {
    if (isRealTime && BODY_MAP[data.id]) {
      try {
        const date = new Date();
        // In real-time mode, get exact ecliptic longitude from Astronomy
        const ec = Astronomy.EclipticLongitude(BODY_MAP[data.id] as any, date);
        // Astronomy returns degrees (0-360), convert to radians
        angleRef.current = (ec * Math.PI) / 180;
      } catch (e) {
        /* ignore */
      }
    } else {
      angleRef.current += data.orbitSpeed * speed * delta * 60;
    }

    const x = Math.cos(angleRef.current) * data.orbitRadius;
    const z = Math.sin(angleRef.current) * data.orbitRadius;
    if (groupRef.current) {
      groupRef.current.position.x = x;
      groupRef.current.position.z = z;
    }
    if (meshRef.current)
      meshRef.current.rotation.y += data.rotationSpeed * speed * delta * 60;
  });

  return (
    <>
      {/* Orbit line */}
      {showOrbits && (
        <line>
          <primitive attach='geometry' object={orbitGeometry} />
          {/* SolarSystemScope style: cyan/teal thin line */}
          <lineBasicMaterial
            color={
              ['jupiter', 'saturn', 'uranus', 'neptune'].includes(data.id)
                ? 0x00ffff
                : 0x00cccc
            }
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </line>
      )}

      <group ref={groupRef}>
        {/* Planet mesh */}
        <mesh
          ref={meshRef}
          rotation-z={data.tilt}
          onClick={() => selectPlanet(data.id)}
          name={data.id}
          userData={{ planetId: data.id }}
        >
          <sphereGeometry args={[data.sceneRadius, 48, 48]} />
          <meshStandardMaterial
            map={planetTex}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>

        {/* Ring */}
        {data.hasRing && data.ringColor && (
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry
              args={[data.sceneRadius * 1.4, data.sceneRadius * 2.4, 64]}
            />
            {data.id === 'saturn' ? (
              <meshBasicMaterial
                map={useTexture('/textures/2k_saturn_ring_alpha.png')}
                side={THREE.DoubleSide}
                transparent
                opacity={0.8}
              />
            ) : (
              <meshBasicMaterial
                color={data.ringColor}
                side={THREE.DoubleSide}
                transparent
                opacity={0.6}
              />
            )}
          </mesh>
        )}

        {/* Atmosphere halo */}
        {showGlow &&
          ['earth', 'venus', 'jupiter', 'saturn', 'uranus', 'neptune'].includes(
            data.id,
          ) && (
            <mesh>
              <sphereGeometry args={[data.sceneRadius * 1.15, 32, 32]} />
              <meshBasicMaterial
                color={data.colorHex}
                transparent
                opacity={0.1}
                side={THREE.BackSide}
              />
            </mesh>
          )}

        {/* Moons */}
        {showMoons &&
          planetMoons.map((moon) => (
            <MoonMesh key={moon.id} moon={moon} speed={speed} />
          ))}

        {/* Label */}
        {showLabels && !selectedPlanetId && (
          <Html
            position={[0, data.sceneRadius + 1, 0]}
            center
            style={{ pointerEvents: 'none' }}
            zIndexRange={[0, 100]} // Keep under modal z-200
          >
            <div className='px-2 py-0.5 text-[10px] text-white/80 font-display whitespace-nowrap bg-black/40 backdrop-blur-md rounded border border-[#00ffff]/20 shadow-[0_0_10px_rgba(0,255,255,0.1)]'>
              {data.nameVi}
            </div>
          </Html>
        )}
      </group>
    </>
  );
}

function MoonMesh({
  moon,
  speed,
}: {
  moon: (typeof MOONS)[number];
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const moonTex = useTexture(
    getTextureUrl(moon.id === 'Luna' ? 'moon' : 'moon'),
  );

  useFrame((_, delta) => {
    angleRef.current += moon.orbitSpeed * speed * delta * 60;
    if (ref.current) {
      ref.current.position.x = Math.cos(angleRef.current) * moon.orbitRadius;
      ref.current.position.z = Math.sin(angleRef.current) * moon.orbitRadius;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[moon.sceneRadius, 24, 24]} />
      <meshStandardMaterial map={moonTex} roughness={0.8} />
    </mesh>
  );
}

export function AsteroidBelt() {
  const ref = useRef<THREE.Points>(null!);
  const count = 2000;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 36 + Math.random() * 4; // between Mars and Jupiter
      const y = (Math.random() - 0.5) * 1.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.0005;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach='attributes-position' args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={0x888877}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

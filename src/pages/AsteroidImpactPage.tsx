import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { fetchNeoFeed } from '@/lib/api';
import Starfield from '@/components/three/Starfield';
import { getTextureUrl } from '@/components/three/SolarSystem';
import { cn } from '@/lib/utils';

interface NeoData {
  id: string;
  name: string;
  diameterMaxKm: number;
  velocityKmS: number;
  missDistanceKm: number;
  isHazardous: boolean;
  closeApproachDate: string;
}

import { getToday } from '@/lib/utils';

// Impact explosion animation component
function ImpactEffect({
  position,
  normal,
  size,
  onComplete,
}: {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  size: number;
  onComplete: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const time = useRef(0);

  // Create a lookAt rotation for the ring so it lies flat on the surface
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    // normal is pointing OUT of the sphere. We want the ring to face OUT.
    // RingGeometry default faces +Z.
    const up = new THREE.Vector3(0, 0, 1);
    q.setFromUnitVectors(up, normal);
    return q;
  }, [normal]);

  useFrame((_, delta) => {
    time.current += delta;
    const t = time.current;

    // Blast sphere expansion
    if (meshRef.current) {
      const scale = 1 + t * 5 * size;
      meshRef.current.scale.set(scale, scale, scale);
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - t * 1.5);
    }

    // Shockwave ring expansion
    if (ringRef.current) {
      const scale = 1 + t * 15 * size;
      ringRef.current.scale.set(scale, scale, scale);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.8 - t * 1.2);
    }

    // Impact over after ~1.5 seconds
    if (t > 1.5) {
      onComplete();
    }
  });

  return (
    <group position={position}>
      {/* Blast Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.2 * size, 32, 32]} />
        <meshBasicMaterial
          color='#ffaa00'
          transparent
          opacity={1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Shockwave Ring */}
      <mesh ref={ringRef} quaternion={quaternion}>
        <ringGeometry args={[0.2 * size, 0.3 * size, 64]} />
        <meshBasicMaterial
          color='#ffeedd'
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Earth Model with onClick handler for impact
function Earth({
  onImpact,
}: {
  onImpact: (point: THREE.Vector3, normal: THREE.Vector3) => void;
}) {
  const earthTex = useTexture(getTextureUrl('earth'));
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation();
        if (e.point && e.face?.normal) {
          // Transform normal to world space because Earth might be rotated
          const normalWorld = e.face.normal
            .clone()
            .applyMatrix3(
              new THREE.Matrix3().getNormalMatrix(meshRef.current.matrixWorld),
            )
            .normalize();
          onImpact(e.point, normalWorld);
        }
      }}
    >
      <sphereGeometry args={[10, 64, 64]} />
      <meshStandardMaterial map={earthTex} roughness={0.7} metalness={0.1} />
    </mesh>
  );
}

export default function AsteroidImpactPage() {
  const [neos, setNeos] = useState<NeoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeo, setSelectedNeo] = useState<NeoData | null>(null);

  // List of active impacts to render
  const [impacts, setImpacts] = useState<
    { id: string; pos: THREE.Vector3; normal: THREE.Vector3; size: number }[]
  >([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const today = getToday();
        const data = await fetchNeoFeed(today, today);
        const neoList: NeoData[] = [];

        Object.keys(data.near_earth_objects).forEach((date) => {
          data.near_earth_objects[date].forEach((neo: any) => {
            neoList.push({
              id: neo.id,
              name: neo.name,
              diameterMaxKm:
                neo.estimated_diameter.kilometers.estimated_diameter_max,
              velocityKmS: parseFloat(
                neo.close_approach_data[0].relative_velocity
                  .kilometers_per_second,
              ),
              missDistanceKm: parseFloat(
                neo.close_approach_data[0].miss_distance.kilometers,
              ),
              isHazardous: neo.is_potentially_hazardous_asteroid,
              closeApproachDate:
                neo.close_approach_data[0].close_approach_date_full,
            });
          });
        });

        // Sort by size
        neoList.sort((a, b) => b.diameterMaxKm - a.diameterMaxKm);
        setNeos(neoList);
        if (neoList.length > 0) setSelectedNeo(neoList[0]);
      } catch (err) {
        console.error('Failed to load NEO data', err);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleImpact = (point: THREE.Vector3, normal: THREE.Vector3) => {
    if (!selectedNeo) return;

    // Impact size coefficient roughly based on kinetic energy (m * v^2)
    // We treat diameter as relative to mass (volume ~ d^3). And scale it down for visual purposes.
    const massFactor = Math.pow(selectedNeo.diameterMaxKm, 3);
    const energy = massFactor * Math.pow(selectedNeo.velocityKmS, 2);

    // Increase visual scaling significantly to ensure the user can clearly see the impact
    const visualSize = Math.max(1.5, Math.log10(energy + 1) * 2);

    const id = Math.random().toString(36).substring(7);
    setImpacts((prev) => [
      ...prev,
      { id, pos: point, normal, size: visualSize },
    ]);
  };

  const removeImpact = (id: string) => {
    setImpacts((prev) => prev.filter((imp) => imp.id !== id));
  };

  return (
    <div className='w-full h-full relative overflow-hidden bg-void flex flex-col md:flex-row'>
      {/* Sidebar List */}
      <div className='z-10 w-full md:w-[350px] shrink-0 p-6 flex flex-col gap-3 h-[45vh] md:h-full overflow-y-auto glass border-none rounded-none bg-black/40 border-r border-glass-border skyline-scrollbar'>
        <h1 className='text-3xl font-display font-bold text-white mb-1'>
          Thiên thạch rơi ☄️
        </h1>
        <p className='text-sm text-text-secondary mb-4'>
          Dữ liệu trực tiếp từ NASA NEO. Chọn một thiên thạch và{' '}
          <strong className='text-accent-coral'>click vào Trái Đất</strong> để
          quan sát vụ va chạm.
        </p>

        {loading ? (
          <div className='text-accent-blue text-sm'>
            Đang tải dữ liệu NEO...
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            {neos.map((neo) => (
              <button
                key={neo.id}
                onClick={() => setSelectedNeo(neo)}
                className={cn(
                  'text-left p-3 rounded-xl transition-all border',
                  selectedNeo?.id === neo.id
                    ? 'bg-accent-coral/15 border-accent-coral/40 shadow-[0_0_15px_rgba(255,100,60,0.15)]'
                    : 'bg-white/5 border-white/5 hover:bg-white/10',
                )}
              >
                <div className='flex justify-between items-start mb-1'>
                  <h3
                    className={cn(
                      'font-display font-bold text-base',
                      selectedNeo?.id === neo.id
                        ? 'text-accent-coral'
                        : 'text-white',
                    )}
                  >
                    {neo.name}
                  </h3>
                  {neo.isHazardous && (
                    <span className='text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold border border-red-500/30'>
                      Nguy hiểm
                    </span>
                  )}
                </div>
                <div className='grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-text-muted mt-2'>
                  <div>
                    Đường kính:{' '}
                    <span className='text-white font-mono'>
                      {neo.diameterMaxKm.toFixed(2)} km
                    </span>
                  </div>
                  <div>
                    Vận tốc:{' '}
                    <span className='text-white font-mono'>
                      {neo.velocityKmS.toFixed(1)} km/s
                    </span>
                  </div>
                  <div className='col-span-2'>
                    Tiếp cận: {neo.closeApproachDate}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3D Viewport */}
      <div className='flex-1 relative h-[55vh] md:h-full cursor-crosshair'>
        <Canvas camera={{ position: [0, 0, 25], fov: 45 }}>
          <Starfield />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 20]} intensity={1.5} />
          <Suspense fallback={null}>
            <group rotation={[0.2, -0.5, 0]}>
              <Earth onImpact={handleImpact} />
              {impacts.map((imp) => (
                <ImpactEffect
                  key={imp.id}
                  position={imp.pos}
                  normal={imp.normal}
                  size={imp.size}
                  onComplete={() => removeImpact(imp.id)}
                />
              ))}
            </group>
          </Suspense>
          <OrbitControls
            enablePan={false}
            minDistance={12}
            maxDistance={80}
            // Auto rotate slightly, but stop when dragged
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>

        {/* Selected Neo Indicator in 3D View */}
        {selectedNeo && (
          <div className='absolute top-6 right-6 z-10 glass p-4 rounded-xl text-center pointer-events-none animate-fade-in'>
            <div className='text-2xl mb-1'>🎯</div>
            <div className='text-xs text-text-muted uppercase tracking-wider mb-1'>
              Đạn chờ bắn
            </div>
            <div className='font-display font-bold text-accent-coral text-lg'>
              {selectedNeo.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

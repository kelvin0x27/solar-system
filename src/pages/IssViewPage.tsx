import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  Stars,
  useTexture,
} from '@react-three/drei';
import * as THREE from 'three';
import { fetchISSPosition } from '@/lib/api';
import { getTextureUrl } from '@/components/three/SolarSystem';
import Starfield from '@/components/three/Starfield';

// ISS Altitude is approx 420km. Earth radius is 6371km.
const EARTH_RADIUS = 6371;
const ISS_ALTITUDE = 420;
// We scale down the whole scene so floats don't go crazy
const SCALE = 0.01;

function EarthFromISS({ lat, lng }: { lat: number; lng: number }) {
  const earthRef = useRef<THREE.Group>(null!);
  const earthTex = useTexture(getTextureUrl('earth'));

  useFrame(() => {
    if (earthRef.current) {
      // Rotate the Earth so the target lat/lng is facing exactly UP (+Y axis)
      // Because we placed the Earth exactly below the camera (-Y axis), facing UP means it directly faces the camera.

      // Standard latitude/longitude to Euler angles
      // A point at lat, lng on a standard sphere (poles on Y axis, Prime Meridian on +Z axis):
      // Rotation around Y (longitude): -lng
      // Rotation around X (latitude): lat

      // We want to bring (lat, lng) to the top (0, R, 0).
      // Standard sphere has (0,0) at (0, 0, R).

      earthRef.current.rotation.set(
        lat * (Math.PI / 180),
        -lng * (Math.PI / 180),
        0,
      );
    }
  });

  return (
    // Position the Earth's center directly below the camera by its radius + altitude
    <group position={[0, -(EARTH_RADIUS + ISS_ALTITUDE) * SCALE, 0]}>
      <group ref={earthRef}>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS * SCALE, 128, 128]} />
          <meshStandardMaterial
            map={earthTex}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      </group>

      {/* Atmosphere rim */}
      <mesh scale={1.02}>
        <sphereGeometry args={[EARTH_RADIUS * SCALE, 64, 64]} />
        <meshBasicMaterial
          color='#88ccff'
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// Highly detailed ISS Model for external view
function ISSModel() {
  return (
    <group scale={[2, 2, 2]}>
      {/* Main truss/body */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 5, 32]} />
        <meshStandardMaterial color='#eeeeee' metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Central Module */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.4, 0.4, 1.5, 32]} />
        <meshStandardMaterial color='#aaaaaa' metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Cupola Module (bottom) */}
      <mesh position={[0, -0.6, 0.5]}>
        <cylinderGeometry args={[0.2, 0.3, 0.4, 16]} />
        <meshStandardMaterial color='#333333' metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Left Solar Arrays */}
      <mesh position={[0, 0, 1.5]}>
        <boxGeometry args={[6, 0.05, 1.2]} />
        <meshStandardMaterial color='#1a3355' metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, 2.8]}>
        <boxGeometry args={[6, 0.05, 1.2]} />
        <meshStandardMaterial color='#1a3355' metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Right Solar Arrays */}
      <mesh position={[0, 0, -1.5]}>
        <boxGeometry args={[6, 0.05, 1.2]} />
        <meshStandardMaterial color='#1a3355' metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, -2.8]}>
        <boxGeometry args={[6, 0.05, 1.2]} />
        <meshStandardMaterial color='#1a3355' metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Radiator Panels */}
      <mesh position={[1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[3, 0.05, 0.5]} />
        <meshStandardMaterial color='#cccccc' metalness={0.4} roughness={0.8} />
      </mesh>
      <mesh position={[-1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[3, 0.05, 0.5]} />
        <meshStandardMaterial color='#cccccc' metalness={0.4} roughness={0.8} />
      </mesh>
    </group>
  );
}

// Draw a simple window frame overlay
function CupolaWindow() {
  return (
    <div className='absolute inset-0 pointer-events-none z-20 flex items-center justify-center opacity-80 mix-blend-overlay'>
      <div className='w-[90vh] h-[90vh] rounded-full border-[40px] border-[#111] relative shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]'>
        <div className='absolute inset-0 border-[2px] border-white/10 rounded-full' />
        {/* Window struts */}
        <div className='absolute top-0 bottom-0 left-1/2 w-4 -ml-2 bg-[#1a1a1a]' />
        <div className='absolute left-0 right-0 top-1/2 h-4 -mt-2 bg-[#1a1a1a]' />
        <div className='absolute top-0 bottom-0 left-1/2 w-4 -ml-2 bg-[#1a1a1a] rotate-45' />
        <div className='absolute top-0 bottom-0 left-1/2 w-4 -ml-2 bg-[#1a1a1a] -rotate-45' />
      </div>
    </div>
  );
}

export default function IssViewPage() {
  const [viewMode, setViewMode] = useState<'cupola' | 'external'>('cupola');
  const [issData, setIssData] = useState<{
    lat: number;
    lng: number;
    timestamp: number;
  } | null>(null);

  // Polling ISS coordinates
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetchISSPosition();
        setIssData({
          lat: parseFloat(res.iss_position.latitude),
          lng: parseFloat(res.iss_position.longitude),
          timestamp: res.timestamp,
        });
      } catch (err) {
        console.error('Failed to fetch ISS data:', err);
      }

      // Update every 3 seconds to get a smooth real-time feel
      timeout = setTimeout(poll, 3000);
    };

    poll();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className='w-full h-full relative overflow-hidden bg-black'>
      {/* UI Overlay */}
      <div className='absolute top-24 left-6 z-30 glass p-6 rounded-2xl max-w-sm animate-fade-in-up border-accent-blue/20'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]' />
          <h1 className='text-2xl font-display font-bold text-white tracking-tight uppercase'>
            Trạm ISS Trực tiếp
          </h1>
        </div>

        <p className='text-sm text-text-secondary mb-6 leading-relaxed'>
          Góc nhìn thứ nhất từ cửa sổ vòm (Cupola) của Trạm vũ trụ Quốc tế
          (ISS), bay cách mặt đất khoảng 420km với vận tốc 28,000 km/h. Kéo thả
          chuột để nhìn quanh.
        </p>

        <div className='grid grid-cols-2 gap-3'>
          <div className='bg-black/40 p-3 rounded-xl border border-white/5'>
            <div className='text-[10px] text-text-muted uppercase tracking-wider mb-1'>
              Vĩ độ
            </div>
            <div className='font-mono text-accent-cyan text-lg'>
              {issData?.lat.toFixed(4) || '---'}°
            </div>
          </div>
          <div className='bg-black/40 p-3 rounded-xl border border-white/5'>
            <div className='text-[10px] text-text-muted uppercase tracking-wider mb-1'>
              Kinh độ
            </div>
            <div className='font-mono text-accent-blue text-lg'>
              {issData?.lng.toFixed(4) || '---'}°
            </div>
          </div>
          <div className='col-span-2 bg-black/40 p-3 rounded-xl border border-white/5'>
            <div className='text-[10px] text-text-muted uppercase tracking-wider mb-1'>
              Độ cao
            </div>
            <div className='font-mono text-white text-lg'>~420.00 km</div>
          </div>
        </div>

        <div className='mt-4 flex gap-2'>
          <button
            onClick={() => setViewMode('cupola')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              viewMode === 'cupola'
                ? 'bg-accent-blue text-white shadow-[0_0_15px_rgba(0,150,255,0.4)]'
                : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'
            }`}
          >
            Nhìn Từ Trạm
          </button>
          <button
            onClick={() => setViewMode('external')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              viewMode === 'external'
                ? 'bg-accent-blue text-white shadow-[0_0_15px_rgba(0,150,255,0.4)]'
                : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'
            }`}
          >
            Nhìn Góc Ngoài
          </button>
        </div>
      </div>

      {/* Visual Window Overlay only in Cupola Mode */}
      {viewMode === 'cupola' && <CupolaWindow />}

      <Canvas
        camera={{
          position: viewMode === 'external' ? [8, 4, 8] : [0, 0, 0],
          fov: 60,
          near: 0.1,
          far: 10000,
        }}
      >
        <color attach='background' args={['#000000']} />

        <Starfield />
        <ambientLight intensity={0.4} />
        {/* Directional light to simulate Sun. In reality it should be calculated, but fixed for now */}
        <directionalLight position={[100, 50, -50]} intensity={1.5} />

        <Suspense fallback={null}>
          {issData && <EarthFromISS lat={issData.lat} lng={issData.lng} />}
          {viewMode === 'external' && <ISSModel />}
        </Suspense>

        <OrbitControls
          enableZoom={viewMode === 'external'}
          enablePan={false}
          minDistance={viewMode === 'external' ? 5 : undefined}
          maxDistance={viewMode === 'external' ? 30 : undefined}
          target={viewMode === 'external' ? [0, 0, 0] : [0, -1, 0.1]}
        />
      </Canvas>
    </div>
  );
}

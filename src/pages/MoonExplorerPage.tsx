import { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import Starfield from '@/components/three/Starfield';

import { getTextureUrl } from '@/components/three/SolarSystem';
import { useTexture } from '@react-three/drei';

function MoonModel({ sunDirection }: { sunDirection: THREE.Vector3 }) {
  const moonTex = useTexture(getTextureUrl('moon'));
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame(() => {
    // We don't need a custom shader anymore, standard material will react to the directional light automatically
  });

  return (
    <group>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[5, 128, 128]} />
        <meshStandardMaterial
          ref={materialRef}
          map={moonTex}
          bumpMap={moonTex}
          bumpScale={0.05}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
      {/* Directional light representing the Sun from calculated phase angle */}
      <directionalLight
        position={sunDirection.clone().multiplyScalar(100)}
        intensity={2.5}
        castShadow
      />
    </group>
  );
}

export default function MoonExplorerPage() {
  const [viewMode, setViewMode] = useState<'live' | 'explore'>('live');
  const [moonData, setMoonData] = useState<{
    phaseName: string;
    phaseFraction: number;
    phaseAngle: number;
    illumination: number;
    sunDir: THREE.Vector3;
    date: Date;
  } | null>(null);

  useEffect(() => {
    // Calculate live lunar phase
    const updatePhase = () => {
      const now = new Date();
      // Phase angle: 0 = New Moon, 90 = First Quarter, 180 = Full Moon, 270 = Last Quarter
      const illum = Astronomy.Illumination(Astronomy.Body.Moon, now);
      // astronomy-engine MoonPhase returns the true lunar phase angle from 0 to 360 degrees
      const phaseAngle = Astronomy.MoonPhase(now);
      const phaseFraction = illum.phase_fraction;

      // Classify phase
      let phaseName = 'Trăng hiếm';
      const angle = phaseAngle;
      if (angle < 5 || angle > 355) phaseName = 'Trăng Non (New Moon)';
      else if (angle < 85)
        phaseName = 'Trăng Lợi Liềm Đầu Tháng (Waxing Crescent)';
      else if (angle < 95) phaseName = 'Bán Nguyệt Đầu Tháng (First Quarter)';
      else if (angle < 175)
        phaseName = 'Trăng Khuyết Đầu Tháng (Waxing Gibbous)';
      else if (angle < 185) phaseName = 'Trăng Tròn (Full Moon)';
      else if (angle < 265)
        phaseName = 'Trăng Khuyết Cuối Tháng (Waning Gibbous)';
      else if (angle < 275) phaseName = 'Bán Nguyệt Cuối Tháng (Last Quarter)';
      else phaseName = 'Trăng Lưỡi Liềm Cuối Tháng (Waning Crescent)';

      // Calculate directional light vector
      // Angle 0 = New Moon (Sun behind Moon) -> Z = -1
      // Angle 90 = First Quarter (Right side lit) -> X = 1
      // Angle 180 = Full Moon (Sun behind Earth) -> Z = 1
      // Angle 270 = Third Quarter (Left side lit) -> X = -1
      const rad = angle * (Math.PI / 180);
      const sunDir = new THREE.Vector3(
        Math.sin(rad),
        0.1, // Slight Y elevation for better shadows
        -Math.cos(rad),
      ).normalize();

      setMoonData({
        phaseName,
        phaseFraction,
        phaseAngle,
        illumination: illum.mag,
        sunDir,
        date: now,
      });
    };

    updatePhase();
    const interval = setInterval(updatePhase, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='w-full h-full relative overflow-hidden bg-void flex flex-col md:flex-row'>
      {/* UI Overlay */}
      <div className='absolute top-24 left-6 z-10 glass p-6 rounded-2xl max-w-sm border-white/10 animate-fade-in-up md:w-[350px]'>
        <h1 className='text-3xl font-display font-bold text-white mb-2 tracking-tight'>
          Mặt Trăng 🌕
        </h1>
        <p className='text-sm text-text-secondary mb-6 leading-relaxed'>
          Quan sát chu kỳ pha và địa hình Mặt Trăng theo thời gian thực (Live).
          Ánh sáng mặt trời được mô phỏng chính xác dựa trên vị trí quỹ đạo hiện
          tại.
        </p>

        {moonData ? (
          <div className='flex flex-col gap-3'>
            <div className='bg-white/5 p-4 rounded-xl border border-white/5'>
              <div className='text-[10px] text-text-muted uppercase tracking-wider mb-2'>
                Pha hiện tại
              </div>
              <div className='font-display text-xl font-bold text-white leading-tight mb-1 cursor-default'>
                {moonData.phaseName}
              </div>
              <div className='text-sm font-mono text-accent-cyan'>
                {(moonData.phaseFraction * 100).toFixed(1)}% Độ sáng
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='bg-white/5 p-3 rounded-xl border border-white/5'>
                <div className='text-[10px] text-text-muted uppercase tracking-wider mb-1'>
                  Góc Pha
                </div>
                <div className='font-mono text-white text-lg'>
                  {moonData.phaseAngle.toFixed(1)}°
                </div>
              </div>
              <div className='bg-white/5 p-3 rounded-xl border border-white/5'>
                <div className='text-[10px] text-text-muted uppercase tracking-wider mb-1'>
                  Cập nhật lúc
                </div>
                <div className='font-mono text-white text-md'>
                  {moonData.date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='text-accent-blue text-sm animate-pulse'>
            Đang đồng bộ quỹ đạo...
          </div>
        )}

        <div className='mt-6 flex gap-2'>
          <button
            onClick={() => setViewMode('live')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              viewMode === 'live'
                ? 'bg-accent-blue text-white shadow-[0_0_15px_rgba(0,150,255,0.4)]'
                : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'
            }`}
          >
            Nhìn Từ Trái Đất (Live)
          </button>
          <button
            onClick={() => setViewMode('explore')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              viewMode === 'explore'
                ? 'bg-accent-blue text-white shadow-[0_0_15px_rgba(0,150,255,0.4)]'
                : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'
            }`}
          >
            Khám Phá (3D)
          </button>
        </div>
      </div>

      <div className='absolute bottom-8 right-8 z-10 glass p-4 rounded-xl text-xs font-medium text-text-muted'>
        {viewMode === 'explore'
          ? 'Kéo chuột để quan sát các vùng khuyết'
          : 'Góc nhìn cố định trực diện từ Trái Đất'}
      </div>

      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <Starfield />
        {/* Slightly higher ambient light so the dark side is visible enough when exploring */}
        <ambientLight intensity={viewMode === 'explore' ? 0.08 : 0.02} />
        {moonData && <MoonModel sunDirection={moonData.sunDir} />}
        <OrbitControls
          enablePan={false}
          enableRotate={viewMode === 'explore'}
          enableZoom={viewMode === 'explore'}
          minDistance={6}
          maxDistance={30}
          autoRotate={viewMode === 'explore'}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}

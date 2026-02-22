import { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { fetchMarsPhotos } from '@/lib/api';
import { cn } from '@/lib/utils';
import Starfield from '@/components/three/Starfield';

// Predefined waypoints for the rover path
const WAYPOINTS = [
  {
    id: 1,
    x: -15,
    z: 15,
    date: '2012-08-06',
    desc: 'Curiosity Hạ cánh (Bradbury Landing)',
  },
  {
    id: 2,
    x: -8,
    z: 5,
    date: '2013-02-08',
    desc: 'Khoan mũi đầu tiên tại Yellowknife Bay',
  },
  {
    id: 3,
    x: 2,
    z: -2,
    date: '2015-04-15',
    desc: "Vượt qua thung lũng Artist's Drive",
  },
  {
    id: 4,
    x: 10,
    z: -10,
    date: '2018-06-01',
    desc: 'Sống sót qua bão bụi toàn cầu',
  },
  {
    id: 5,
    x: 18,
    z: -18,
    date: '2023-08-01',
    desc: 'Khám phá khu vực Gediz Vallis',
  },
];

// Simple terrain height function using multiple sine waves
const getTerrainHeight = (x: number, z: number) => {
  return (
    Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2 +
    Math.sin(x * 0.03 + 1) * 5 +
    Math.cos(z * 0.04 - 2) * 4 +
    Math.sin(x * 0.2 + z * 0.2) * 0.5
  );
};

function ProceduralTerrain() {
  const geometryRef = useRef<THREE.PlaneGeometry>(null!);

  useEffect(() => {
    if (!geometryRef.current) return;
    const posAttribute = geometryRef.current.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
      const x = posAttribute.getX(i);
      const y = posAttribute.getY(i);
      // PlaneGeometry is created on XY plane, then rotated to XZ.
      // So 'y' here is actually 'z' in world space.
      const z = getTerrainHeight(x, y);
      posAttribute.setZ(i, z);
    }
    geometryRef.current.computeVertexNormals();
    posAttribute.needsUpdate = true;
  }, []);

  return (
    <group>
      {/* Solid Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
        <planeGeometry ref={geometryRef} args={[100, 100, 128, 128]} />
        <meshStandardMaterial
          color='#5a2c1a'
          roughness={0.9}
          metalness={0.1}
          flatShading
        />
      </mesh>
      {/* Holographic Wireframe Overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[100, 100, 128, 128]} />
        <meshBasicMaterial
          color='#e8916b'
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
}

function RoverPath() {
  const pointsArray = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < WAYPOINTS.length - 1; i++) {
      const p1 = WAYPOINTS[i];
      const p2 = WAYPOINTS[i + 1];
      const steps = 50;
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const x = THREE.MathUtils.lerp(p1.x, p2.x, t);
        const z = THREE.MathUtils.lerp(p1.z, p2.z, t);
        const y = getTerrainHeight(x, z) + 0.2;
        points.push(new THREE.Vector3(x, y, z));
      }
    }
    return points;
  }, []);

  return (
    <Line
      points={pointsArray}
      color='#ffffff'
      lineWidth={3}
      dashed
      dashSize={1}
      gapSize={1}
      opacity={0.6}
      transparent
    />
  );
}

export default function MarsRoverPathPage() {
  const [selectedWaypoint, setSelectedWaypoint] = useState<
    (typeof WAYPOINTS)[0] | null
  >(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedWaypoint) return;
    async function loadPhotos() {
      setLoading(true);
      setPhotos([]);
      try {
        const data = await fetchMarsPhotos(selectedWaypoint!.date, 'all');
        if (data.photos) {
          setPhotos(data.photos.slice(0, 6)); // Top 6 photos
        }
      } catch (e) {
        console.error('Failed to load rover photos', e);
      }
      setLoading(false);
    }
    loadPhotos();
  }, [selectedWaypoint]);

  return (
    <div className='w-full h-full relative overflow-hidden bg-[#2a110a]'>
      {/* Atmosphere Fog */}
      <div className='absolute inset-0 pointer-events-none bg-linear-to-t from-[#8c3a21]/40 to-transparent z-0' />

      {/* UI Overlay */}
      <div className='absolute top-24 left-6 z-10 glass p-6 rounded-2xl max-w-sm animate-fade-in-up border-[#bc5c38]/30'>
        <h1 className='text-3xl font-display font-bold text-[#e8916b] mb-2 tracking-tight'>
          Hành trình Rover 🚀
        </h1>
        <p className='text-sm text-text-secondary mb-4 leading-relaxed'>
          Bản đồ 3D địa hình bề mặt Sao Hoả. Khám phá dấu chân của tàu thăm dò
          Curiosity. Click vào các cột mốc để xem ảnh thực tế do tàu gửi về Trái
          Đất theo ngày.
        </p>
        <div className='flex items-center gap-2 text-xs text-text-muted'>
          <div className='w-3 h-3 rounded-full bg-white animate-pulse' />
          <span>Trạm dừng chân</span>
        </div>
      </div>

      {/* Photo Gallery Panel */}
      {selectedWaypoint && (
        <div className='absolute top-24 right-6 z-10 w-80 glass p-6 rounded-2xl border-[#bc5c38]/30 animate-slide-in-right max-h-[70vh] flex flex-col'>
          <div className='flex justify-between items-start mb-4'>
            <div>
              <div className='text-xs text-text-muted uppercase tracking-wider mb-1'>
                Cột mốc #{selectedWaypoint.id}
              </div>
              <h2 className='font-display font-bold text-[#e8916b] text-lg leading-tight'>
                {selectedWaypoint.desc}
              </h2>
              <div className='text-sm font-mono text-white/60 mt-1'>
                Earth Date: {selectedWaypoint.date}
              </div>
            </div>
            <button
              onClick={() => setSelectedWaypoint(null)}
              className='text-white/50 hover:text-white p-1'
            >
              ✕
            </button>
          </div>

          <div className='flex-1 overflow-y-auto skyline-scrollbar pr-2 min-h-[100px]'>
            {loading ? (
              <div className='flex flex-col items-center justify-center p-8 gap-3'>
                <div className='w-6 h-6 border-2 border-white/20 border-t-[#e8916b] rounded-full animate-spin' />
                <span className='text-xs text-text-muted'>
                  Đang kết nối viễn thông...
                </span>
              </div>
            ) : photos.length > 0 ? (
              <div className='grid grid-cols-2 gap-2'>
                {photos.map((photo: any, i) => (
                  <div
                    key={photo.id}
                    onClick={() =>
                      setLightboxImg(
                        photo.img_src.replace(/^http:\/\//i, 'https://'),
                      )
                    }
                    className='relative pt-[100%] rounded-xl overflow-hidden cursor-pointer group animate-fade-in-up'
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <img
                      src={photo.img_src.replace(/^http:\/\//i, 'https://')}
                      alt='Mars Rover photo'
                      className='absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                    />
                    <div className='absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 text-[10px]'>
                      {photo.camera.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center p-8 text-center'>
                <div className='text-3xl mb-2 opacity-50'>📡</div>
                <div className='text-sm text-text-muted mb-1'>
                  Không có ảnh chụp
                </div>
                <div className='text-[10px] text-white/40'>
                  Tàu thăm dò không gửi ảnh về cho trạm dừng chân này (NASA API
                  Data Missing).
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Canvas */}
      <Canvas shadows camera={{ position: [-10, 15, 25], fov: 45 }}>
        <color attach='background' args={['#3a1a0f']} />
        <fog attach='fog' args={['#8c3a21', 10, 80]} />
        <Starfield />

        <ambientLight intensity={0.2} color='#ffddcc' />
        <directionalLight
          position={[50, 30, 20]}
          intensity={1.5}
          color='#ffeedd'
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />

        <ProceduralTerrain />
        <RoverPath />

        {/* Waypoints */}
        {WAYPOINTS.map((wp) => {
          const y = getTerrainHeight(wp.x, wp.z);
          const isSelected = selectedWaypoint?.id === wp.id;

          return (
            <group key={wp.id} position={[wp.x, y, wp.z]}>
              {/* Waypoint Marker */}
              <mesh
                position={[0, 1, 0]}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWaypoint(wp);
                }}
                onPointerOver={() => {
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'auto';
                }}
              >
                <cylinderGeometry args={[0.3, 0, 2, 8]} />
                <meshStandardMaterial
                  color={isSelected ? '#ffffff' : '#e8916b'}
                  emissive={isSelected ? '#aaa' : '#000'}
                />
              </mesh>

              {/* Pulse effect if selected */}
              {isSelected && (
                <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.5, 1.5, 32]} />
                  <meshBasicMaterial
                    color='#ffffff'
                    transparent
                    opacity={0.3}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )}
            </group>
          );
        })}

        <OrbitControls
          enablePan={true}
          maxPolarAngle={Math.PI / 2 - 0.05} // don't go below ground
          minDistance={5}
          maxDistance={50}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          className='fixed inset-0 z-500 bg-black/90 flex items-center justify-center p-4 animate-fade-in'
          onClick={() => setLightboxImg(null)}
        >
          <button className='absolute top-6 right-6 text-white text-3xl font-light hover:scale-110 transition-transform'>
            ✕
          </button>
          <img
            src={lightboxImg.replace(/^http:\/\//i, 'https://')}
            alt='Mars Full View'
            className='max-w-full max-h-[90vh] object-contain rounded-xl'
          />
        </div>
      )}
    </div>
  );
}

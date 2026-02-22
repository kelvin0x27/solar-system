import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { fetchTles } from '@/lib/api';
import Starfield from '@/components/three/Starfield';
import { getTextureUrl } from '@/components/three/SolarSystem';

// Number of points we'll try to load max
const MAX_SATS = 10000;

interface SatData {
  id: string;
  name: string;
  group: string;
  pos: THREE.Vector3;
  axis: THREE.Vector3; // orbital plane normal
  speed: number; // angular speed
  color: THREE.Color;
}

const parseTleData = (
  tleString: string,
  defaultColor: string,
  groupName: string,
): SatData[] => {
  const lines = tleString.trim().split('\n');
  const sats: SatData[] = [];
  const now = new Date();

  // Earth radius in km
  const R = 6371;
  const scale = 0.005; // Scale down distances

  for (let i = 0; i < lines.length; i += 3) {
    if (sats.length >= MAX_SATS) break;
    const name = lines[i]?.trim() || 'Unknown Satellite';
    const tle1 = lines[i + 1]?.trim();
    const tle2 = lines[i + 2]?.trim();
    if (!tle1 || !tle2) continue;

    try {
      const satrec = satellite.twoline2satrec(tle1, tle2);
      const pv = satellite.propagate(satrec, now);
      if (!pv) continue;
      if (
        !pv.position ||
        typeof pv.position === 'boolean' ||
        !pv.velocity ||
        typeof pv.velocity === 'boolean'
      )
        continue;

      const posEci = pv!.position as satellite.EciVec3<number>;
      const velEci = pv!.velocity as satellite.EciVec3<number>;

      const pos = new THREE.Vector3(
        posEci.x * scale,
        posEci.z * scale,
        -posEci.y * scale,
      );
      const vel = new THREE.Vector3(
        velEci.x * scale,
        velEci.z * scale,
        -velEci.y * scale,
      );

      // Calculate orbital plane normal
      const axis = new THREE.Vector3().crossVectors(pos, vel).normalize();

      // Linear speed = length of vel. Angular speed approx = v / r
      const r = pos.length();
      const speed = vel.length() / r;

      sats.push({
        id: `${groupName}-${i}`,
        name,
        group: groupName,
        pos,
        axis,
        speed,
        color: new THREE.Color(defaultColor),
      });
    } catch (e) {
      // ignore invalid TLE
    }
  }
  return sats;
};

// Earth model
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const earthTex = useTexture(getTextureUrl('earth'));

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Earth rotation speed approx. Sidereal day is 23.93 hours.
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[6371 * 0.005, 64, 64]} />
      <meshStandardMaterial map={earthTex} roughness={0.6} metalness={0.1} />
      {/* Atmosphere Glow */}
      <mesh>
        <sphereGeometry args={[6371 * 0.005 * 1.05, 32, 32]} />
        <meshBasicMaterial
          color='#4488ff'
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
    </mesh>
  );
}

function SwarmInstancedMesh({
  satellites,
  onSelect,
}: {
  satellites: SatData[];
  onSelect: (sat: SatData) => void;
}) {
  const count = satellites.length;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize instances
  useEffect(() => {
    if (!meshRef.current || count === 0) return;

    // Set colors
    const colorArray = new Float32Array(count * 3);
    satellites.forEach((sat, i) => {
      sat.color.toArray(colorArray, i * 3);
      dummy.position.copy(sat.pos);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(
      colorArray,
      3,
    );
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [satellites, count, dummy]);

  // Animate satellites
  useFrame((_, delta) => {
    if (!meshRef.current || count === 0) return;

    // time multiplier for visual effect
    const timeScale = 10;

    satellites.forEach((sat, i) => {
      // Rotate position around the orbital axis
      sat.pos.applyAxisAngle(sat.axis, sat.speed * delta * timeScale);
      dummy.position.copy(sat.pos);
      // Optional: make them look along velocity, but for spheres it doesn't matter
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.instanceId !== undefined) {
          onSelect(satellites[e.instanceId]);
        }
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'default')}
    >
      {/* A somewhat realistic satellite shape: a rectangular box resembling a bus/panel */}
      <boxGeometry args={[0.6, 0.2, 0.4]} />
      {/* High metalness for reflections, low roughness for shiny panels */}
      <meshStandardMaterial
        color='#ffffff'
        metalness={0.8}
        roughness={0.2}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  );
}

export default function SwarmPage() {
  const [sats, setSats] = useState<SatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, groups: [] as string[] });

  // Filtering and Selection
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    Starlink: true,
    'Trạm vũ trụ': true,
    OneWeb: true,
    'Thời tiết': true,
  });
  const [selectedSat, setSelectedSat] = useState<SatData | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch various notable satellite constellations
        const [starlink, stations, oneweb, weather] = await Promise.all([
          fetchTles('starlink').catch(() => ''),
          fetchTles('stations').catch(() => ''),
          fetchTles('oneweb').catch(() => ''),
          fetchTles('weather').catch(() => ''),
        ]);

        const group1 = parseTleData(starlink, '#aaaaaa', 'Starlink'); // Starlink: grey/white
        const group2 = parseTleData(stations, '#00ffcc', 'Trạm vũ trụ'); // Stations: bright cyan
        const group3 = parseTleData(oneweb, '#ffaa00', 'OneWeb'); // OneWeb: orange
        const group4 = parseTleData(weather, '#ff3366', 'Thời tiết'); // Weather: pink/red

        const combined = [...group1, ...group2, ...group3, ...group4];
        setSats(combined);
        setStats({
          total: combined.length,
          groups: [
            `Starlink: ${group1.length}`,
            `Trạm vũ trụ: ${group2.length}`,
            `OneWeb: ${group3.length}`,
            `Thời tiết: ${group4.length}`,
          ],
        });
      } catch (err) {
        console.error('Failed to load swarm', err);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredSats = useMemo(() => {
    return sats.filter((s) => visibleGroups[s.group]);
  }, [sats, visibleGroups]);

  const toggleGroup = (group: string) => {
    setVisibleGroups((prev) => ({ ...prev, [group]: !prev[group] }));
    setSelectedSat(null);
  };

  return (
    <div className='w-full h-full relative overflow-hidden bg-void'>
      {/* UI Overlay */}
      <div className='absolute top-24 left-6 z-10 glass p-6 rounded-2xl max-w-sm animate-fade-in-up'>
        <h1 className='text-3xl font-display font-bold text-white mb-2 tracking-tight'>
          Vệ tinh & Rác Vũ trụ 🛰️
        </h1>
        <p className='text-sm text-text-secondary mb-4 leading-relaxed'>
          Mô phỏng 3D thời gian thực quỹ đạo của hàng ngàn vệ tinh nhân tạo đang
          quay quanh Trái Đất. Nhấn giữ và kéo chuột để xoay, click vào vệ tinh
          rọi bật thông tin chi tiết.
        </p>

        <div className='p-4 bg-white/5 rounded-xl border border-white/10 mb-4'>
          <div className='text-[10px] text-text-muted uppercase tracking-wider mb-2'>
            Trạng thái Dữ liệu
          </div>
          {loading ? (
            <div className='flex items-center gap-2 text-accent-blue text-sm font-semibold'>
              <span className='w-4 h-4 rounded-full border-2 border-accent-blue border-t-transparent animate-spin' />
              Đang tải hàng ngàn TLE...
            </div>
          ) : (
            <>
              <div className='font-display text-2xl font-bold text-white mb-2'>
                {filteredSats.length.toLocaleString()}{' '}
                <span className='text-sm text-text-muted font-sans font-normal'>
                  vệ tinh hiển thị
                </span>
                {filteredSats.length !== sats.length && (
                  <span className='block text-xs text-text-muted mt-1'>
                    (trong tổng số {sats.length.toLocaleString()})
                  </span>
                )}
              </div>
              <div className='flex flex-col gap-1 text-xs text-text-secondary'>
                {stats.groups.map((g) => {
                  const name = g.split(':')[0];
                  return (
                    <div
                      key={g}
                      className={`flex items-center gap-2 transition-opacity ${visibleGroups[name] ? 'opacity-100' : 'opacity-30'}`}
                    >
                      <div className='w-1.5 h-1.5 rounded-full bg-white/30' />
                      {g}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legend Map & Toggles */}
      <div className='absolute bottom-8 right-8 z-10 p-4 rounded-2xl bg-[#001020]/80 backdrop-blur-md border border-[#00ffff]/30 shadow-[0_0_30px_rgba(0,255,255,0.1)] flex flex-col gap-3 font-medium animate-slide-in-right'>
        <div className='text-xs text-[#00ffff] font-bold uppercase tracking-widest pl-1 mb-1'>
          Bộ Lọc Mạng Lưới
        </div>

        <button
          onClick={() => toggleGroup('Starlink')}
          className={`flex items-center gap-3 text-white/90 hover:bg-white/10 px-3 py-2 rounded-xl transition-all cursor-pointer ${!visibleGroups['Starlink'] && 'opacity-40 grayscale'}`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-[#aaaaaa] ${visibleGroups['Starlink'] ? 'shadow-[0_0_10px_#aaaaaa]' : ''}`}
          />
          <span>Starlink</span>
        </button>
        <button
          onClick={() => toggleGroup('OneWeb')}
          className={`flex items-center gap-3 text-white/90 hover:bg-white/10 px-3 py-2 rounded-xl transition-all cursor-pointer ${!visibleGroups['OneWeb'] && 'opacity-40 grayscale'}`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-[#ffaa00] ${visibleGroups['OneWeb'] ? 'shadow-[0_0_10px_#ffaa00]' : ''}`}
          />
          <span>OneWeb</span>
        </button>
        <button
          onClick={() => toggleGroup('Thời tiết')}
          className={`flex items-center gap-3 text-white/90 hover:bg-white/10 px-3 py-2 rounded-xl transition-all cursor-pointer ${!visibleGroups['Thời tiết'] && 'opacity-40 grayscale'}`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-[#ff3366] ${visibleGroups['Thời tiết'] ? 'shadow-[0_0_10px_#ff3366]' : ''}`}
          />
          <span>Vệ tinh Thời tiết</span>
        </button>
        <button
          onClick={() => toggleGroup('Trạm vũ trụ')}
          className={`flex items-center gap-3 text-white/90 hover:bg-white/10 px-3 py-2 rounded-xl transition-all cursor-pointer ${!visibleGroups['Trạm vũ trụ'] && 'opacity-40 grayscale'}`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-[#00ffcc] ${visibleGroups['Trạm vũ trụ'] ? 'shadow-[0_0_15px_#00ffcc]' : ''}`}
          />
          <span>Trạm Vũ trụ (ISS)</span>
        </button>
      </div>

      {/* Details Modal */}
      {selectedSat && (
        <div className='absolute top-24 right-8 z-20 w-[340px] bg-[#001020]/90 backdrop-blur-xl rounded-3xl border border-[#00ffff]/40 p-6 shadow-[0_0_40px_rgba(0,255,255,0.2)] text-white animate-slide-in-right'>
          <button
            onClick={() => setSelectedSat(null)}
            className='absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-[#00ffff]/20 transition-all'
          >
            ✕
          </button>
          <div className='mb-6 pr-6'>
            <h2 className='text-3xl font-display font-black uppercase tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] leading-tight'>
              {selectedSat.name}
            </h2>
            <div className='inline-block mt-3 px-3 py-1 rounded-full bg-[#00ffff]/10 border border-[#00ffff]/30 text-xs text-[#00ffff] font-bold uppercase tracking-widest'>
              {selectedSat.group}
            </div>
          </div>

          <div className='space-y-4'>
            <div className='p-4 rounded-2xl bg-black/40 border border-[#00ffff]/20 flex flex-col'>
              <div className='text-[10px] text-[#00ffff]/80 uppercase tracking-widest mb-1 font-bold'>
                Tốc độ góc
              </div>
              <div className='font-display text-lg font-semibold text-white'>
                {selectedSat.speed.toFixed(6)} rad/s
              </div>
            </div>

            <div className='p-4 rounded-2xl bg-black/40 border border-[#00ffff]/20 flex flex-col'>
              <div className='text-[10px] text-[#00ffff]/80 uppercase tracking-widest mb-1 font-bold'>
                Pháp tuyến quỹ đạo (Z)
              </div>
              <div className='font-display text-lg font-semibold text-white'>
                {selectedSat.axis.z.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 20, 100], fov: 45 }}
        onPointerDown={() => setSelectedSat(null)}
      >
        <Starfield />
        <ambientLight intensity={0.5} />
        <directionalLight position={[50, 20, 50]} intensity={1.5} />
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
        <SwarmInstancedMesh
          satellites={filteredSats}
          onSelect={setSelectedSat}
        />
        <OrbitControls
          enablePan={false}
          minDistance={35}
          maxDistance={300}
          autoRotate={!selectedSat} // stop rotation when a satellite is selected to let user read
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import { Suspense, useState, useRef, useMemo } from 'react';
import * as THREE from 'three';
import Starfield from '@/components/three/Starfield';
import {
  Sun,
  Planet,
  AsteroidBelt,
  getTextureUrl,
} from '@/components/three/SolarSystem';
import { PLANETS, DWARF_PLANETS, ALL_BODIES } from '@/data/planets';
import type { PlanetData } from '@/data/planets';
import { useSolarSystemStore } from '@/stores/solarSystemStore';
import { cn } from '@/lib/utils';

function CameraController() {
  const selectedId = useSolarSystemStore((s) => s.selectedPlanetId);
  const { scene, controls } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const [hasStarted, setHasStarted] = useState(false);

  useFrame(() => {
    if (selectedId && selectedId !== 'sun') {
      if (!hasStarted) setHasStarted(true);
      const obj = scene.getObjectByName(selectedId);
      if (obj) {
        obj.getWorldPosition(targetPos.current);
        if (controls && (controls as any).target) {
          (controls as any).target.lerp(targetPos.current, 0.05);
        }
      }
    } else {
      if (hasStarted) {
        targetPos.current.set(0, 0, 0);
        if (controls && (controls as any).target) {
          (controls as any).target.lerp(targetPos.current, 0.05);
        }
      }
    }
  });
  return null;
}

function DetailPlanetMesh({ data }: { data: PlanetData }) {
  const tex = useTexture(getTextureUrl(data.id));
  return (
    <mesh rotation-z={data.tilt}>
      <sphereGeometry args={[data.sceneRadius, 64, 64]} />
      <meshStandardMaterial map={tex} roughness={0.6} metalness={0.1} />
      {data.hasRing && data.ringColor && (
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry
            args={[data.sceneRadius * 1.4, data.sceneRadius * 2.4, 128]}
          />
          <meshBasicMaterial
            color={data.ringColor}
            side={THREE.DoubleSide}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </mesh>
  );
}

function PlanetDetailView() {
  const selectedId = useSolarSystemStore((s) => s.selectedPlanetId);
  const selectPlanet = useSolarSystemStore((s) => s.selectPlanet);
  const body = ALL_BODIES.find((b) => b.id === selectedId);

  // Only show detail view for planets, not the sun
  if (!selectedId || selectedId === 'sun' || !body) return null;

  return (
    <div
      style={{ zIndex: 200 }}
      className='fixed inset-0 pointer-events-none flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4 md:p-8'
    >
      <div className='w-full md:w-[90vw] h-[90vh] md:h-[85vh] max-w-7xl max-h-[950px] pointer-events-auto relative bg-[#000a14]/90 rounded-3xl border border-[#00ffff]/30 overflow-hidden shadow-[0_0_80px_rgba(0,255,255,0.15)] flex flex-col md:flex-row'>
        <button
          onClick={() => selectPlanet(null)}
          className='absolute top-5 right-5 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-[#00ffff]/20 text-white transition-all shadow-lg hover:scale-105'
        >
          ✕
        </button>

        {/* Left Column: Info */}
        <div className='w-full md:w-[45%] h-full flex flex-col relative z-10 border-b md:border-b-0 md:border-r border-[#00ffff]/20 bg-[#001020]/60 overflow-y-auto custom-scrollbar p-6 md:p-10 hide-scrollbar-mobile'>
          <div className='flex items-center gap-5 md:gap-6 mb-8 shrink-0'>
            <span className='text-6xl md:text-7xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]'>
              {body.emoji}
            </span>
            <div>
              <h2 className='text-4xl md:text-5xl font-display font-black text-white drop-shadow-[0_0_15px_rgba(0,255,255,0.4)] uppercase leading-tight'>
                {body.nameVi}
              </h2>
              <p className='text-sm md:text-base text-[#00ffff] font-bold uppercase tracking-[0.2em] mt-1.5'>
                {body.type}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3 md:gap-4 mb-8 shrink-0'>
            {[
              ['Đường kính', `${body.diameter.toLocaleString()} km`],
              ['Khối lượng', body.mass],
              [
                'Khoảng cách',
                body.distanceFromSun > 0
                  ? `${body.distanceFromSun} tr. km`
                  : '—',
              ],
              ['Chu kỳ QĐ', body.orbitalPeriod],
              ['Tự quay', body.rotationPeriod],
              ['Vệ tinh', `${body.moons}`],
              ['Nhiệt độ', body.avgTemperature],
              ['Trọng lực', body.gravity],
            ].map(([label, value]) => (
              <div
                key={label}
                className='p-3 md:p-4 rounded-2xl bg-[#001a33]/50 border border-[#00ffff]/20 flex flex-col justify-center min-h-[76px] md:min-h-[84px] hover:bg-[#001a33]/80 transition-colors shadow-inner'
              >
                <div className='text-[9px] md:text-[10px] text-[#00ffff]/90 uppercase tracking-[0.1em] mb-1 md:mb-1.5 font-bold'>
                  {label}
                </div>
                <div className='font-display text-sm md:text-[0.95rem] font-semibold text-white tracking-wide leading-snug'>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <h4 className='text-[11px] md:text-xs font-bold text-[#00ffff] uppercase tracking-widest mb-3 pb-2 border-b border-[#00ffff]/30 shrink-0'>
            Cấu trúc & Khí quyển
          </h4>
          <p className='text-sm text-white/80 mb-8 leading-relaxed font-body shrink-0'>
            {body.atmosphere}
          </p>

          <h4 className='text-[11px] md:text-xs font-bold text-[#00ffff] uppercase tracking-widest mb-3 pb-2 border-b border-[#00ffff]/30 shrink-0'>
            Encyclopedia
          </h4>
          <div className='flex flex-col gap-3 stagger-children pb-6 shrink-0'>
            {body.funFacts.map((fact, i) => (
              <div
                key={i}
                className='flex gap-3 p-3 md:p-4 rounded-2xl bg-[#001a33]/50 border border-[#00ffff]/20 text-sm text-white/90 animate-fade-in-up hover:bg-[#001a33]/80 transition-colors'
              >
                <span className='text-[#00ffff] shrink-0 font-bold mt-0.5 text-base leading-none'>
                  &gt;
                </span>
                <span className='leading-relaxed font-body'>{fact}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: 3D Canvas */}
        <div className='w-full md:w-[55%] h-[40vh] md:h-full relative z-0 bg-transparent flex items-center justify-center shrink-0 border-t md:border-t-0 border-[#00ffff]/20'>
          <Canvas
            camera={{ position: [0, 0, body.sceneRadius * 3.5], fov: 45 }}
            className='absolute inset-0 outline-none'
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 3, 5]} intensity={2} />
            <Suspense fallback={null}>
              <DetailPlanetMesh data={body} />
              <OrbitControls
                enableZoom={true}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
              />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  );
}

function InfoPanel() {
  return null;
}

function ComparePanel() {
  const isComparing = useSolarSystemStore((s) => s.isComparing);
  const setComparing = useSolarSystemStore((s) => s.setComparing);
  const comparePlanets = useSolarSystemStore((s) => s.comparePlanets);
  const setComparePlanet = useSolarSystemStore((s) => s.setComparePlanet);
  const p1 = ALL_BODIES.find((b) => b.id === comparePlanets[0]);
  const p2 = ALL_BODIES.find((b) => b.id === comparePlanets[1]);
  if (!isComparing) return null;

  const rows =
    p1 && p2
      ? [
          [
            'Đường kính',
            `${p1.diameter.toLocaleString()} km`,
            `${p2.diameter.toLocaleString()} km`,
          ],
          ['Khối lượng', p1.mass, p2.mass],
          [
            'Khoảng cách MT',
            p1.distanceFromSun > 0 ? `${p1.distanceFromSun} tr. km` : '—',
            p2.distanceFromSun > 0 ? `${p2.distanceFromSun} tr. km` : '—',
          ],
          ['Chu kỳ QĐ', p1.orbitalPeriod, p2.orbitalPeriod],
          ['Vệ tinh', `${p1.moons}`, `${p2.moons}`],
          ['Nhiệt độ', p1.avgTemperature, p2.avgTemperature],
          ['Trọng lực', p1.gravity, p2.gravity],
          ['Loại', p1.type, p2.type],
        ]
      : [];

  return (
    <div
      style={{ zIndex: 300 }}
      className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#001020]/80 backdrop-blur-md p-6 pt-12 w-[700px] max-w-[95vw] max-h-[80vh] overflow-y-auto animate-fade-in rounded-2xl border border-[#00ffff]/30 shadow-[0_0_50px_rgba(0,255,255,0.1)] text-white'
    >
      <button
        onClick={() => setComparing(false)}
        className='absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-[#00ffff]/20 transition-all'
      >
        ✕
      </button>
      <h3 className='font-display text-2xl font-bold mb-6 uppercase tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'>
        So sánh hành tinh
      </h3>
      <div className='flex items-center gap-4 mb-6'>
        <select
          value={comparePlanets[0] || ''}
          onChange={(e) => setComparePlanet(0, e.target.value || null)}
          className='flex-1 px-4 py-3 text-sm bg-black/40 border border-[#00ffff]/30 rounded-xl text-white focus:border-[#00ffff] outline-none transition-colors'
        >
          <option value=''>Chọn hành tinh 1</option>
          {ALL_BODIES.map((b) => (
            <option key={b.id} value={b.id} className='bg-[#001020]'>
              {b.emoji} {b.nameVi}
            </option>
          ))}
        </select>
        <span className='font-display text-sm font-bold text-[#00ffff] shrink-0'>
          VS
        </span>
        <select
          value={comparePlanets[1] || ''}
          onChange={(e) => setComparePlanet(1, e.target.value || null)}
          className='flex-1 px-4 py-3 text-sm bg-black/40 border border-[#00ffff]/30 rounded-xl text-white focus:border-[#00ffff] outline-none transition-colors'
        >
          <option value=''>Chọn hành tinh 2</option>
          {ALL_BODIES.map((b) => (
            <option key={b.id} value={b.id} className='bg-[#001020]'>
              {b.emoji} {b.nameVi}
            </option>
          ))}
        </select>
      </div>
      {p1 && p2 && (
        <div className='flex flex-col gap-1.5'>
          <div className='grid grid-cols-[1fr_80px_1fr] items-center gap-2 p-2 rounded-lg bg-accent-blue/5 border border-accent-blue/10'>
            <div className='text-right font-display font-semibold text-accent-blue'>
              {p1.emoji} {p1.nameVi}
            </div>
            <div className='text-center text-[10px] text-accent-purple font-bold'>
              VS
            </div>
            <div className='font-display font-semibold text-accent-purple'>
              {p2.emoji} {p2.nameVi}
            </div>
          </div>
          {rows.map(([label, v1, v2]) => (
            <div
              key={label}
              className='grid grid-cols-[1fr_80px_1fr] items-center gap-2 p-2 rounded-lg bg-white/2 border border-white/3'
            >
              <div className='text-right text-sm font-display font-semibold text-accent-blue'>
                {v1}
              </div>
              <div className='text-center text-[10px] text-text-muted uppercase tracking-wide'>
                {label}
              </div>
              <div className='text-sm font-display font-semibold text-accent-purple'>
                {v2}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  const [search, setSearch] = useState('');
  const selectPlanet = useSolarSystemStore((s) => s.selectPlanet);
  const selectedId = useSolarSystemStore((s) => s.selectedPlanetId);

  const filtered = ALL_BODIES.filter(
    (b) =>
      !search ||
      b.nameVi.toLowerCase().includes(search.toLowerCase()) ||
      b.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{ zIndex: 150 }}
      className='fixed top-20 left-4 glass p-3 w-[250px] max-h-[calc(100vh-160px)] overflow-y-auto animate-slide-in-left hidden lg:block'
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder='Tìm kiếm...'
        className='w-full px-3 py-1.5 text-xs bg-white/5 border border-glass-border rounded-lg text-text-primary focus:border-accent-blue/40 outline-none mb-2 placeholder:text-text-muted'
      />
      <h3 className='text-[10px] font-semibold text-text-muted uppercase tracking-widest px-2 mb-2'>
        Hệ Mặt Trời
      </h3>
      <ul className='flex flex-col gap-0.5'>
        {filtered.map((b) => (
          <li
            key={b.id}
            onClick={() => selectPlanet(b.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-all',
              selectedId === b.id
                ? 'bg-glass-active text-accent-blue font-medium'
                : 'text-text-secondary hover:bg-glass-hover hover:text-text-primary',
            )}
          >
            <span
              className='w-2 h-2 rounded-full shrink-0'
              style={{ backgroundColor: b.color }}
            />
            <span>
              {b.emoji} {b.nameVi}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ControlsBar() {
  const {
    speedMultiplier,
    setSpeed,
    showOrbits,
    toggleOrbits,
    showLabels,
    toggleLabels,
    showGlow,
    toggleGlow,
    showMoons,
    toggleMoons,
    selectPlanet,
    isComparing,
    setComparing,
    isRealTime,
    setRealTime,
  } = useSolarSystemStore();

  return (
    <div
      style={{ zIndex: 150 }}
      className='fixed bottom-4 left-1/2 -translate-x-1/2 glass px-5 py-2 rounded-full flex items-center gap-3 flex-wrap justify-center'
    >
      <div className='flex items-center gap-2'>
        <span className='text-[11px] text-text-muted'>⏱ Tốc độ</span>
        <input
          type='range'
          min={0}
          max={5}
          step={0.1}
          value={speedMultiplier}
          onChange={(e) => setSpeed(+e.target.value)}
          className='w-20 h-1 accent-accent-cyan'
        />
        <span className='font-display text-xs font-semibold text-accent-cyan w-8'>
          {speedMultiplier.toFixed(1)}x
        </span>
      </div>
      <div className='w-px h-5 bg-glass-border' />
      {[
        { active: showOrbits, toggle: toggleOrbits, label: 'Quỹ đạo' },
        { active: showLabels, toggle: toggleLabels, label: 'Tên' },
        { active: showGlow, toggle: toggleGlow, label: 'Glow' },
        { active: showMoons, toggle: toggleMoons, label: 'Mặt trăng' },
      ].map((btn) => (
        <button
          key={btn.label}
          onClick={btn.toggle}
          className={cn(
            'px-3 py-1 text-xs rounded-lg border transition-all',
            btn.active
              ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/25'
              : 'bg-white/3 text-text-muted border-glass-border hover:text-text-primary',
          )}
        >
          {btn.label}
        </button>
      ))}
      <div className='w-px h-5 bg-glass-border' />
      <button
        onClick={() => setRealTime(!isRealTime)}
        className={cn(
          'px-3 py-1 text-xs rounded-lg border transition-all',
          isRealTime
            ? 'bg-accent-coral/10 text-accent-coral border-accent-coral/25'
            : 'bg-white/3 text-text-muted border-glass-border hover:text-text-primary',
        )}
      >
        ⏱ Thực tế
      </button>
      <div className='w-px h-5 bg-glass-border' />
      <button
        onClick={() => setComparing(!isComparing)}
        className={cn(
          'px-3 py-1 text-xs rounded-lg border transition-all',
          isComparing
            ? 'bg-accent-purple/10 text-accent-purple border-accent-purple/25'
            : 'bg-white/3 text-text-muted border-glass-border hover:text-text-primary',
        )}
      >
        ⚖️ So sánh
      </button>
      <button
        onClick={() => selectPlanet(null)}
        className='px-3 py-1 text-xs rounded-lg border bg-white/3 text-text-muted border-glass-border hover:text-text-primary transition-all'
      >
        🔄 Reset
      </button>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className='w-full h-full'>
      <Canvas
        camera={{ position: [40, 30, 60], fov: 50, near: 0.1, far: 2000 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} color={0x222244} />
          <Starfield />
          <Sun />
          {PLANETS.map((p) => (
            <Planet key={p.id} data={p} />
          ))}
          {DWARF_PLANETS.map((p) => (
            <Planet key={p.id} data={p} />
          ))}
          <AsteroidBelt />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={200}
            enablePan={false}
          />
          <CameraController />
        </Suspense>
      </Canvas>
      <Sidebar />
      <PlanetDetailView />
      <InfoPanel />
      <ComparePanel />
      <ControlsBar />
    </div>
  );
}

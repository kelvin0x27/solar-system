import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import * as Astronomy from 'astronomy-engine';
import { fetchTles } from '@/lib/api';
import Starfield from '@/components/three/Starfield';
import { getTextureUrl } from '@/components/three/SolarSystem';

interface SatData {
  name: string;
  satrec: satellite.SatRec;
  type: 'station' | 'starlink' | 'satellite';
}

interface CelestialBodyData {
  name: string;
  body: Astronomy.Body;
  color: string;
  size: number;
  texId: string;
}

const CELESTIAL_BODIES: CelestialBodyData[] = [
  {
    name: 'Mặt Trời',
    body: Astronomy.Body.Sun,
    color: '#FDB813',
    size: 1.5,
    texId: 'sun',
  },
  {
    name: 'Mặt Trăng',
    body: Astronomy.Body.Moon,
    color: '#f5f3ce',
    size: 1.2,
    texId: 'moon',
  },
  {
    name: 'Sao Thuỷ',
    body: Astronomy.Body.Mercury,
    color: '#888888',
    size: 0.8,
    texId: 'mercury',
  },
  {
    name: 'Sao Kim',
    body: Astronomy.Body.Venus,
    color: '#e3bb76',
    size: 0.9,
    texId: 'venus',
  },
  {
    name: 'Sao Hoả',
    body: Astronomy.Body.Mars,
    color: '#c1440e',
    size: 0.9,
    texId: 'mars',
  },
  {
    name: 'Sao Mộc',
    body: Astronomy.Body.Jupiter,
    color: '#d39c7e',
    size: 1.3,
    texId: 'jupiter',
  },
  {
    name: 'Sao Thổ',
    body: Astronomy.Body.Saturn,
    color: '#ead6b8',
    size: 1.1,
    texId: 'saturn',
  },
];

function TexturedCelestialBody({
  cb,
  name,
  data,
  onSelectObj,
}: {
  cb: CelestialBodyData;
  name: string;
  data: any;
  onSelectObj: any;
}) {
  const tex = useTexture(getTextureUrl(cb.texId));

  return (
    <group
      position={data.pos}
      onClick={(e) => {
        e.stopPropagation();
        let cbId = 'sun';
        if (name === 'Mặt Trăng') cbId = 'moon';
        else if (name === 'Sao Thuỷ') cbId = 'mercury';
        else if (name === 'Sao Kim') cbId = 'venus';
        else if (name === 'Sao Hoả') cbId = 'mars';
        else if (name === 'Sao Mộc') cbId = 'jupiter';
        else if (name === 'Sao Thổ') cbId = 'saturn';

        onSelectObj({
          name,
          type: 'Thiên thể',
          az: data.az,
          el: data.el,
          info: `Vị trí biểu kiến của ${name} trên bầu trời hiện tại của bạn.`,
          id: cbId,
        });
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'default')}
    >
      <mesh>
        <sphereGeometry args={[cb.size * 2, 32, 32]} />
        {cb.body === Astronomy.Body.Sun ? (
          <meshBasicMaterial map={tex} />
        ) : (
          <meshStandardMaterial map={tex} roughness={0.7} metalness={0.1} />
        )}
      </mesh>
      {cb.body === Astronomy.Body.Sun && (
        <pointLight color={cb.color} intensity={2} distance={200} />
      )}
      <Text
        position={[0, -cb.size * 2 - 1, 0]}
        fontSize={2}
        color={cb.color}
        anchorX='center'
        anchorY='top'
        outlineWidth={0.2}
        outlineColor='#000000'
      >
        {name}
      </Text>
    </group>
  );
}

function DetailedSatelliteMesh({
  isStation,
  color,
}: {
  isStation: boolean;
  color: string;
}) {
  if (isStation) {
    return (
      <group scale={[0.8, 0.8, 0.8]}>
        {/* Main truss/body */}
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 2.5, 16]} />
          <meshStandardMaterial
            color='#cccccc'
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        {/* Left Solar Arrays */}
        <mesh position={[0, 0, 0.8]}>
          <boxGeometry args={[3, 0.05, 0.6]} />
          <meshStandardMaterial
            color='#1a3355'
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Right Solar Arrays */}
        <mesh position={[0, 0, -0.8]}>
          <boxGeometry args={[3, 0.05, 0.6]} />
          <meshStandardMaterial
            color='#1a3355'
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group scale={[0.8, 0.8, 0.8]}>
      {/* Sat bus */}
      <mesh>
        <boxGeometry args={[0.5, 0.2, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Solar Panel */}
      <mesh position={[0, 0, 0.35]}>
        <boxGeometry args={[0.5, 0.02, 0.6]} />
        <meshStandardMaterial color='#1a3355' metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

function DomeMesh() {
  return (
    <mesh>
      <sphereGeometry args={[100, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial
        color='#0a192f'
        transparent
        opacity={0.3}
        side={THREE.BackSide}
        wireframe
      />
    </mesh>
  );
}

function GroundMesh() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <circleGeometry args={[100, 64]} />
        <meshBasicMaterial
          color='#051024'
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>

      {/* Target reticle at user location (center) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[2, 2.5, 32]} />
        <meshBasicMaterial color='#00ffff' transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color='#00ffff' transparent opacity={0.8} />
      </mesh>
      <gridHelper
        args={[200, 40, '#102a4a', '#0c1f38']}
        position={[0, -0.05, 0]}
      />
    </group>
  );
}

const parseTleData = (tleString: string, type: SatData['type']): SatData[] => {
  const lines = tleString.trim().split('\n');
  const sats: SatData[] = [];
  for (let i = 0; i < lines.length; i += 3) {
    const name = lines[i].trim();
    const tle1 = lines[i + 1].trim();
    const tle2 = lines[i + 2].trim();
    try {
      const satrec = satellite.twoline2satrec(tle1, tle2);
      sats.push({ name, satrec, type });
    } catch (e) {
      // ignore invalid TLE
    }
  }
  return sats;
};

// Convert azimuth/elevation to Three.js coordinates (Y is up)
// r is the distance from the observer
const azElToVector3 = (
  azimuthRad: number,
  elevationRad: number,
  r: number = 90,
) => {
  // Elevation 0 = horizon, PI/2 = zenith
  // Azimuth 0 = North, PI/2 = East
  // Let's map North to -Z, East to +X
  const y = r * Math.sin(elevationRad);
  const x = r * Math.cos(elevationRad) * Math.sin(azimuthRad);
  const z = r * Math.cos(elevationRad) * -Math.cos(azimuthRad); // -cos because North is -Z
  return new THREE.Vector3(x, y, z);
};

function TrackerScene({
  latitude,
  longitude,
  onSelectObj,
}: {
  latitude: number;
  longitude: number;
  onSelectObj: (
    obj: {
      name: string;
      type: string;
      az: number;
      el: number;
      info?: string;
      id?: string;
    } | null,
  ) => void;
}) {
  const [sats, setSats] = useState<SatData[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time tracking
  const [satPositions, setSatPositions] = useState<{
    [key: string]: { pos: THREE.Vector3; az: number; el: number };
  }>({});
  const [celestialPositions, setCelestialPositions] = useState<{
    [key: string]: { pos: THREE.Vector3; az: number; el: number };
  }>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [stationsTle, starlinkTle, activeTle] = await Promise.all([
          fetchTles('stations'),
          fetchTles('starlink').catch(() => ''),
          fetchTles('active').catch(() => ''), // Additional active sats for more variety
        ]);

        const stations = parseTleData(stationsTle, 'station');
        // Load significantly more starlinks for a dense, impressive display
        const starlinks = parseTleData(starlinkTle, 'starlink').slice(0, 1000);
        const actives = parseTleData(activeTle, 'satellite').slice(0, 300);

        setSats([...stations, ...starlinks, ...actives]);
      } catch (err) {
        console.error('Failed to load TLEs', err);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  useFrame(() => {
    const now = new Date();
    const gmst = satellite.gstime(now);
    const observerGd = {
      longitude: satellite.degreesToRadians(longitude),
      latitude: satellite.degreesToRadians(latitude),
      height: 0,
    };

    // Update Satellites
    const newSatPos: any = {};
    sats.forEach((sat) => {
      const positionAndVelocity = satellite.propagate(sat.satrec, now);
      if (
        !positionAndVelocity ||
        !positionAndVelocity.position ||
        typeof positionAndVelocity.position === 'boolean'
      )
        return;
      const positionEci =
        positionAndVelocity.position as satellite.EciVec3<number>;
      if (!positionEci) return;

      try {
        const positionEcf = satellite.eciToEcf(positionEci, gmst);
        const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

        // Show objects near AND above horizon (down to -10° allows objects approaching the horizon)
        if (lookAngles.elevation > -0.175) {
          // -10° in radians
          const pos = azElToVector3(
            lookAngles.azimuth,
            lookAngles.elevation,
            80,
          );
          newSatPos[sat.name] = {
            pos,
            az: lookAngles.azimuth,
            el: lookAngles.elevation,
          };
        }
      } catch (e) {
        // error calculating
      }
    });
    setSatPositions(newSatPos);

    // Update Celestial Bodies
    const newCelPos: any = {};
    const observer = new Astronomy.Observer(latitude, longitude, 0);
    const time = new Astronomy.AstroTime(now);

    CELESTIAL_BODIES.forEach((cb) => {
      // Calculate horizontal coordinates (azimuth, altitude)
      const equ_2000 = Astronomy.Equator(cb.body, time, observer, true, true);
      const hor = Astronomy.Horizon(
        time,
        observer,
        equ_2000.ra,
        equ_2000.dec,
        'normal',
      );

      const elRad = satellite.degreesToRadians(hor.altitude);
      const azRad = satellite.degreesToRadians(hor.azimuth);

      if (hor.altitude > -10) {
        // Show planets slightly below horizon too
        const pos = azElToVector3(azRad, elRad, 95);
        newCelPos[cb.name] = { pos, az: azRad, el: elRad };
      }
    });
    setCelestialPositions(newCelPos);
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <DomeMesh />
      <GroundMesh />

      {/* Compass markers */}
      {['Bắc', 'Đông', 'Nam', 'Tây'].map((dir, i) => {
        const angle = (i * Math.PI) / 2;
        const x = 90 * Math.sin(angle);
        const z = -90 * Math.cos(angle);
        return (
          <Text
            key={dir}
            position={[x, 2, z]}
            fontSize={4}
            color='rgba(255,255,255,0.5)'
            lookAt={[0, 2, 0]}
          >
            {dir}
          </Text>
        );
      })}

      {/* Satellites */}
      {Object.entries(satPositions).map(([name, data]) => {
        const isStation = sats.find((s) => s.name === name)?.type === 'station';
        return (
          <group
            key={name}
            position={data.pos}
            onClick={(e) => {
              e.stopPropagation();
              onSelectObj({
                name,
                type: isStation ? 'Trạm vũ trụ' : 'Vệ tinh nhân tạo',
                az: data.az,
                el: data.el,
                info: isStation
                  ? 'Trạm vũ trụ Quốc tế (ISS) hoặc các trạm không gian lớn khác đang bay ngang qua vị trí của bạn trong quỹ đạo tầm thấp (LEO).'
                  : 'Vệ tinh nhân tạo thuộc dự án Starlink hoặc các tổ hợp vệ tinh khác.',
              });
            }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'default')}
          >
            <DetailedSatelliteMesh
              isStation={isStation}
              color={isStation ? '#00ffcc' : '#ffffff'}
            />
            {isStation ? (
              <Text
                position={[0, -2, 0]}
                fontSize={1.5}
                color='#00ffcc'
                anchorX='center'
                anchorY='top'
                outlineWidth={0.2}
                outlineColor='#000000'
              >
                {name}
              </Text>
            ) : null}
          </group>
        );
      })}

      {/* Celestial Bodies - each wrapped in its own Suspense so one failed texture doesn't block all */}
      {Object.entries(celestialPositions).map(([name, data]) => {
        const cb = CELESTIAL_BODIES.find((b) => b.name === name);
        if (!cb) return null;

        return (
          <Suspense
            key={name}
            fallback={
              <group position={data.pos}>
                <mesh>
                  <sphereGeometry args={[cb.size * 2, 16, 16]} />
                  <meshBasicMaterial color={cb.color} />
                </mesh>
                <Text
                  position={[0, -cb.size * 2 - 1, 0]}
                  fontSize={2}
                  color={cb.color}
                  anchorX='center'
                  anchorY='top'
                >
                  {name}
                </Text>
              </group>
            }
          >
            <TexturedCelestialBody
              cb={cb}
              name={name}
              data={data}
              onSelectObj={onSelectObj}
            />
          </Suspense>
        );
      })}

      {loading && (
        <Text position={[0, 20, 0]} fontSize={4} color='#ffffff'>
          Đang tải dữ liệu vệ tinh...
        </Text>
      )}
    </>
  );
}

export default function AboveMePage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [errorStatus, setErrorStatus] = useState<string>('');
  const [selectedObj, setSelectedObj] = useState<{
    name: string;
    type: string;
    az: number;
    el: number;
    info?: string;
    id?: string;
  } | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setErrorStatus('Trình duyệt không hỗ trợ Geolocation.');
      return;
    }
    setErrorStatus('Đang lấy vị trí...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setErrorStatus('');
      },
      (err) => {
        console.error(err);
        setErrorStatus('Không thể định vị. Vui lòng cho phép quyền vị trí.');
        // Fallback to a default location (e.g. Hanoi)
        setLocation({ lat: 21.0285, lng: 105.8542 });
      },
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <div className='w-full h-full relative overflow-hidden bg-void'>
      {/* Header UI */}
      <div className='absolute top-24 left-6 z-10 glass p-6 rounded-2xl max-w-sm animate-fade-in-up'>
        <h1 className='text-3xl font-display font-bold text-white mb-2'>
          Trên bầu trời 🔭
        </h1>
        <p className='text-sm text-text-secondary mb-4 leading-relaxed'>
          Mô phỏng không gian 3D dạng vòm trời. Hiển thị trực tiếp các hành
          tinh, trạm vũ trụ ISS và vệ tinh đang bay ngang qua vị trí của bạn
          ngay lúc này.
        </p>

        <div className='flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 mb-4'>
          <div className='w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center text-xl shrink-0'>
            📍
          </div>
          <div className='flex-1'>
            <div className='text-[10px] text-text-muted uppercase tracking-wider mb-0.5'>
              Vị trí quan sát
            </div>
            {location ? (
              <div className='text-sm font-semibold text-white font-mono'>
                {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
              </div>
            ) : (
              <div className='text-sm text-accent-coral'>
                {errorStatus || 'Chưa có vị trí'}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={requestLocation}
          className='w-full py-2.5 rounded-xl bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue font-semibold transition-colors border border-accent-blue/30 text-sm'
        >
          {location ? '🛰 Cập nhật vị trí' : 'Cho phép vị trí'}
        </button>
      </div>

      <div className='absolute bottom-6 right-6 z-10 glass p-4 rounded-xl text-xs text-text-muted'>
        <div>Kéo chuột để xoay - Cuộn để thu phóng</div>
        <div className='mt-2 flex gap-4'>
          <span className='flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-[#00ffcc]' /> Trạm (ISS)
          </span>
          <span className='flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-[#aaaaaa]' /> Vệ tinh
            (Starlink)
          </span>
          <span className='flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-[#f5f3ce]' /> Hành tinh
          </span>
        </div>
      </div>

      {/* Selected Object Detail Popup (SolarSystemScope Style) */}
      {selectedObj && (
        <div className='absolute top-24 right-6 z-20 w-[340px] bg-[#001020]/80 backdrop-blur-md rounded-2xl border border-[#00ffff]/30 p-6 shadow-[0_0_40px_rgba(0,255,255,0.1)] text-white animate-slide-in-right'>
          <button
            onClick={() => setSelectedObj(null)}
            className='absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-[#00ffff]/20 transition-all'
          >
            ✕
          </button>

          <div className='mb-6 pr-6'>
            <h2 className='text-3xl font-display font-bold uppercase tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] leading-tight'>
              {selectedObj.name}
            </h2>
            <p className='text-xs text-[#00ffff] font-bold uppercase tracking-widest mt-1'>
              {selectedObj.type}
            </p>
          </div>

          <div className='grid grid-cols-2 gap-3 mb-6'>
            <div className='p-3 rounded-xl bg-black/40 border border-[#00ffff]/20'>
              <div className='text-[10px] text-[#00ffff]/80 uppercase tracking-widest mb-1 font-bold'>
                Góc phương vị (Az)
              </div>
              <div className='font-display text-lg font-semibold text-white'>
                {satellite.radiansToDegrees(selectedObj.az).toFixed(1)}°
              </div>
              <div className='text-[10px] text-white/50 mt-1'>
                Độ lệch so với Bắc
              </div>
            </div>

            <div className='p-3 rounded-xl bg-black/40 border border-[#00ffff]/20'>
              <div className='text-[10px] text-[#00ffff]/80 uppercase tracking-widest mb-1 font-bold'>
                Góc tà (El)
              </div>
              <div className='font-display text-lg font-semibold text-white'>
                {satellite.radiansToDegrees(selectedObj.el).toFixed(1)}°
              </div>
              <div className='text-[10px] text-white/50 mt-1'>
                Độ cao trên đường chân trời
              </div>
            </div>
          </div>

          {selectedObj.info && (
            <>
              <h4 className='text-[11px] font-bold text-[#00ffff] uppercase tracking-widest mb-2 pb-1 border-b border-[#00ffff]/30'>
                Thông tin
              </h4>
              <p className='text-sm text-white/90 leading-relaxed'>
                {selectedObj.info}
              </p>
            </>
          )}
        </div>
      )}

      {/* 3D Viewport */}
      <div className='absolute inset-0 pointer-events-auto cursor-crosshair'>
        {location && (
          <Canvas
            camera={{ position: [0, 10, 30], fov: 60 }}
            onPointerDown={() => setSelectedObj(null)} // Click outside to clear
          >
            <Starfield />
            <Suspense fallback={null}>
              <TrackerScene
                latitude={location.lat}
                longitude={location.lng}
                onSelectObj={setSelectedObj}
              />
            </Suspense>
            <OrbitControls minDistance={10} maxDistance={150} />
          </Canvas>
        )}
      </div>

      {/* User Location Indicator in 3D center */}
      <div className='absolute bottom-8 left-1/2 -translate-x-1/2 z-10 glass px-6 py-3 rounded-full flex items-center gap-3 animate-fade-in pointer-events-none'>
        <div className='w-4 h-4 rounded-full bg-[#00ffff] shrink-0 animate-pulse shadow-[0_0_15px_#00ffff]' />
        <span className='text-sm font-semibold text-white uppercase tracking-wider'>
          Vị trí của bạn ở trung tâm
        </span>
      </div>
    </div>
  );
}

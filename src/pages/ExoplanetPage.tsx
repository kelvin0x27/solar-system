import { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import Starfield from '@/components/three/Starfield';

interface Exoplanet {
  id: string;
  name: string;
  type: string;
  distance: number; // light years
  mass: string;
  temperature: number; // roughly in K
  waterRatio: number; // 0 to 1
  baseColor: THREE.Color;
  landColor: THREE.Color;
  cloudOpacity: number;
  description: string;
}

const EXOPLANETS: Exoplanet[] = [
  {
    id: 'kepler-186f',
    name: 'Kepler-186f',
    type: 'Hành tinh đá',
    distance: 582,
    mass: '1.11 x Trái Đất',
    temperature: 188,
    waterRatio: 0.2, // Ice / little water
    baseColor: new THREE.Color('#2a201c'),
    landColor: new THREE.Color('#8b5a44'),
    cloudOpacity: 0.3,
    description:
      'Hành tinh kích cỡ Trái Đất đầu tiên được tìm thấy trong vùng có thể sống được (Habitable Zone). Khả năng cao bề mặt bao phủ bởi băng đá và đất khô cằn do nhiệt độ thấp.',
  },
  {
    id: 'trappist-1e',
    name: 'TRAPPIST-1e',
    type: 'Hành tinh đá',
    distance: 39,
    mass: '0.69 x Trái Đất',
    temperature: 251,
    waterRatio: 0.7, // High water / oceans
    baseColor: new THREE.Color('#1f3a53'), // Deep ocean
    landColor: new THREE.Color('#415d43'), // Greenish land
    cloudOpacity: 0.8,
    description:
      'Nằm trong hệ sao lùn đỏ TRAPPIST-1. Có thể chứa đại dương khổng lồ và một bầu khí quyển dày đặc, là một trong những ứng cử viên hàng đầu cho sự sống.',
  },
  {
    id: 'hd-209458b',
    name: 'Osiris (HD 209458 b)',
    type: 'Sao Mộc nóng',
    distance: 159,
    mass: '0.69 x Sao Mộc',
    temperature: 1130, // Very hot
    waterRatio: 0, // Gas giant, no liquid water
    baseColor: new THREE.Color('#8c2d19'),
    landColor: new THREE.Color('#d97c2b'),
    cloudOpacity: 0.9,
    description:
      'Một hành tinh khí khổng lồ bay cực gần sao chủ, khiến nhiệt độ bốc hơi hàng ngàn độ và bầu khí quyển bị thổi bay như đuôi sao chổi.',
  },
  {
    id: 'proxima-b',
    name: 'Proxima Centauri b',
    type: 'Hành tinh đá',
    distance: 4.2, // closest
    mass: '1.27 x Trái Đất',
    temperature: 234,
    waterRatio: 0.4,
    baseColor: new THREE.Color('#551d18'), // Reddish due to red dwarf
    landColor: new THREE.Color('#944e3d'),
    cloudOpacity: 0.5,
    description:
      'Hành tinh ngoài hệ Mặt Trời gần chúng ta nhất. Nó quay quanh sao lùn đỏ Proxima Centauri và có thể bị khóa thủy triều (một mặt luôn sáng ngập bức xạ, mặt kia chìm trong bóng tối băng giá).',
  },
  {
    id: '55-cancri-e',
    name: 'Janssen (55 Cancri e)',
    type: 'Siêu Trái Đất',
    distance: 41,
    mass: '8.08 x Trái Đất',
    temperature: 2400, // Extreme lava
    waterRatio: 0,
    baseColor: new THREE.Color('#ffff66'), // glowing lava
    landColor: new THREE.Color('#220000'), // dark crust
    cloudOpacity: 0.2,
    description:
      'Bề mặt là đại dương dung nham cực nóng. Từng có giả thuyết gọi đây là "Hành tinh Kim cương" do lõi được cấu tạo phần lớn từ carbon dưới áp suất khổng lồ.',
  },
];

// Custom Shader Material for Procedural Exoplanets
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform vec3 baseColor;
  uniform vec3 landColor;
  uniform float waterRatio;
  uniform float cloudOpacity;
  uniform float temperature; // To add glow if hot

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  // Simple 3D noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  // FBM (Fractal Brownian Motion)
  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    for(int i = 0; i < 6; i++) {
        sum += snoise(p * freq) * amp;
        amp *= 0.5;
        freq *= 2.0;
    }
    return sum;
  }

  void main() {
    // Basic directional lighting
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diff = max(dot(vNormal, lightDir), 0.0);
    
    // Ambient light
    vec3 ambient = vec3(0.05);
    
    // Terrain Noise
    vec3 p = vPosition * 0.4;
    float n = fbm(p + time * 0.02);
    
    // Smooth transition for continents vs oceans
    float coastline = smoothstep(waterRatio - 0.1, waterRatio + 0.1, n * 0.5 + 0.5);
    vec3 surfaceColor = mix(baseColor, landColor, coastline);
    
    // Add lava glow if extremely hot (>1000K)
    if (temperature > 1000.0) {
      float lavaNoise = fbm(p * 3.0 + time * 0.1);
      float lavaGlow = smoothstep(0.4, 0.6, lavaNoise) * (temperature / 2000.0);
      surfaceColor = mix(surfaceColor, vec3(1.0, 0.3, 0.0), lavaGlow * (1.0 - coastline));
    }
    
    // Clouds Noise
    float cloudNoise = fbm(vPosition * 0.8 - time * 0.01);
    float clouds = smoothstep(1.0 - cloudOpacity, 1.0, cloudNoise * 0.5 + 0.5);
    
    // Final mixing
    vec3 finalColor = mix(surfaceColor, vec3(1.0), clouds);
    
    // Apply lighting
    finalColor = finalColor * (diff * 1.2 + 0.1) + ambient;
    
    // Atmosphere rim light (Fresnel)
    float rim = 1.0 - max(dot(viewMatrix[2].xyz, vNormal), 0.0);
    rim = smoothstep(0.6, 1.0, rim);
    vec3 atmoColor = mix(vec3(0.5, 0.7, 1.0), vec3(1.0, 0.5, 0.2), temperature / 2000.0);
    finalColor += atmoColor * rim * cloudOpacity * 0.8;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function ProceduralExoplanet({ planet }: { planet: Exoplanet }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      baseColor: { value: planet.baseColor },
      landColor: { value: planet.landColor },
      waterRatio: { value: planet.waterRatio },
      cloudOpacity: { value: planet.cloudOpacity },
      temperature: { value: planet.temperature },
    }),
    [planet],
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[4, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function ExoplanetPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const planet = EXOPLANETS[selectedIndex];

  return (
    <div className='w-full h-full relative bg-void overflow-hidden flex flex-col md:flex-row'>
      <div className='absolute top-20 left-6 z-10 animate-fade-in-up pointer-events-none hidden md:block'>
        <h1 className='text-4xl font-display font-bold text-white mb-2 tracking-tight'>
          Vũ trụ Rộng lớn
        </h1>
        <p className='text-accent-blue font-medium'>
          Trình tạo Hệ sinh thái Ngoại hành tinh
        </p>
      </div>

      {/* Exoplanet List Sidebar */}
      <div className='z-10 w-full md:w-[320px] shrink-0 p-6 md:pt-40 flex flex-col gap-3 h-[40vh] md:h-full overflow-y-auto glass border-none rounded-none bg-black/40 md:border-r md:border-glass-border skyline-scrollbar'>
        <h2 className='text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-2'>
          Danh sách Khám phá
        </h2>
        {EXOPLANETS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setSelectedIndex(i)}
            className={cn(
              'text-left p-4 rounded-2xl transition-all duration-300 relative overflow-hidden group border',
              selectedIndex === i
                ? 'bg-accent-blue/15 border-accent-blue/30 shadow-[0_0_20px_rgba(45,115,255,0.15)]'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10',
            )}
          >
            {selectedIndex === i && (
              <div className='absolute left-0 top-0 bottom-0 w-1.5 bg-accent-blue rounded-l-2xl shadow-[0_0_10px_#2d73ff]' />
            )}
            <h3
              className={cn(
                'font-display font-bold text-lg mb-1 transition-colors',
                selectedIndex === i ? 'text-accent-blue' : 'text-white',
              )}
            >
              {p.name}
            </h3>
            <div className='text-xs text-text-muted flex items-center justify-between'>
              <span>{p.type}</span>
              <span className='font-mono'>{p.distance} năm ánh sáng</span>
            </div>
          </button>
        ))}
      </div>

      {/* 3D Viewport */}
      <div className='flex-1 relative h-[60vh] md:h-full'>
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <Starfield />
          <ambientLight intensity={0.1} />
          <group rotation={[0.2, 0, 0]}>
            <ProceduralExoplanet planet={planet} />
          </group>
          <OrbitControls
            enablePan={false}
            minDistance={5}
            maxDistance={25}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>

        {/* Planet Stats Overlay */}
        <div className='absolute bottom-6 right-6 z-10 glass p-6 rounded-2xl max-w-sm animate-slide-in-right'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='text-4xl'>✨</div>
            <div>
              <h2 className='text-2xl font-display font-bold text-white'>
                {planet.name}
              </h2>
              <p className='text-sm text-accent-blue'>{planet.type}</p>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3 mb-4'>
            <div className='bg-black/30 p-3 rounded-xl border border-white/5'>
              <div className='text-[10px] text-text-muted uppercase tracking-wider mb-1'>
                Nhiệt độ Bề mặt
              </div>
              <div className='font-display font-semibold text-accent-coral'>
                {planet.temperature} K
              </div>
            </div>
            <div className='bg-black/30 p-3 rounded-xl border border-white/5'>
              <div className='text-[10px] text-text-muted uppercase tracking-wider mb-1'>
                Khối lượng
              </div>
              <div className='font-display font-semibold text-accent-cyan'>
                {planet.mass}
              </div>
            </div>
            <div className='bg-black/30 p-3 rounded-xl border border-white/5'>
              <div className='text-[10px] text-text-muted uppercase tracking-wider mb-1'>
                Tỉ lệ Đại dương
              </div>
              <div className='font-display font-semibold text-accent-blue'>
                {(planet.waterRatio * 100).toFixed(0)}%
              </div>
            </div>
            <div className='bg-black/30 p-3 rounded-xl border border-white/5'>
              <div className='text-[10px] text-text-muted uppercase tracking-wider mb-1'>
                Mật độ Mây dầy
              </div>
              <div className='font-display font-semibold text-white'>
                {(planet.cloudOpacity * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <p className='text-sm text-text-secondary leading-relaxed border-t border-white/5 pt-4'>
            {planet.description}
          </p>
        </div>
      </div>
    </div>
  );
}

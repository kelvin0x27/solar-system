import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

// Relativistic Black Hole Raymarching Shader
// Inspired by various Gargantua implementations

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float iTime;
uniform vec2 iResolution;
uniform vec3 cameraPos;
uniform mat4 cameraViewMatrix;

varying vec2 vUv;

// Raymarching constants
#define MAX_STEPS 100
#define MAX_DIST 20.0
#define SURF_DIST 0.001
#define EVENT_HORIZON 1.0

// Math utils
mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

// Noise for the accretion disk
float hash(float n) { return fract(sin(n) * 1e4); }
float noise(vec3 x) {
    const vec3 step = vec3(110, 241, 171);
    vec3 i = floor(x);
    vec3 f = fract(x);
    float n = dot(i, step);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix( hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
               mix(mix( hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
}
float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100);
    for (int i = 0; i < 5; ++i) {
        v += a * noise(x);
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

// Distance estimator
float getDist(vec3 p) {
    float d = length(p) - EVENT_HORIZON; // Black hole sphere
    return d;
}

// Disk density
float getDiskDensity(vec3 p) {
    // Flattened disk along XZ plane
    float distFromCenter = length(p.xz);
    if (distFromCenter < 1.5 || distFromCenter > 5.0 || abs(p.y) > 0.2) return 0.0;
    
    // Smooth edges
    float vEdge = smoothstep(0.2, 0.0, abs(p.y));
    float innerEdge = smoothstep(1.5, 2.0, distFromCenter);
    float outerEdge = smoothstep(5.0, 3.5, distFromCenter);
    
    // Add noise and rotation
    float angle = atan(p.z, p.x);
    float r = length(p.xz);
    vec3 np = vec3(r * 2.0, angle * 5.0 - iTime * 2.0, p.y * 10.0);
    float n = fbm(np + iTime * 0.5);
    
    return n * vEdge * innerEdge * outerEdge;
}

// Background Starfield
vec3 getStarfield(vec3 dir) {
    vec3 color = vec3(0.0);
    float n = fbm(dir * 200.0);
    if (n > 0.7) color += vec3(pow(n, 10.0)) * 2.0; // stars
    
    // Milky way band
    float band = smoothstep(0.2, 0.0, abs(dir.y));
    color += band * vec3(0.05, 0.1, 0.15) * fbm(dir * 10.0);
    
    return color;
}

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= iResolution.x / iResolution.y;

    // Camera setup
    // For raymarching, we treat the OrbitControls camera as purely a rotation tracker
    // We start ray at an offset from center, rotating it by the camera's view matrix
    vec3 ro = vec3(0.0, 2.0, -8.0); // Viewer stands at z=-8
    
    // Construct ray direction
    vec3 rd = normalize(vec3(uv, 1.5));
    
    // Rotate the ray and origin by the OrbitControls camera view matrix
    ro = (cameraViewMatrix * vec4(ro, 1.0)).xyz;
    rd = normalize(mat3(cameraViewMatrix) * rd);
    
    vec3 col = vec3(0.0);
    float t = 0.0;
    vec3 p = ro;
    
    // Gravitational Lensing & Raymarching
    float dt = 0.05;
    vec3 accretionColor = vec3(0.0);
    float transmittance = 1.0;
    
    // Black hole properties
    float GM = 0.5; // Mass
    
    for(int i = 0; i < 300; i++) {
        p = ro + rd * t;
        float r = length(p);
        
        // Inside event horizon
        if (r < EVENT_HORIZON) {
            transmittance = 0.0;
            break;
        }
        
        // Escape condition
        if (r > MAX_DIST) {
            break;
        }
        
        // Gravity bending (simplified Newton/Einstein approximation)
        // Ray curves towards the center
        vec3 g = -normalize(p) * (GM / (r * r)); 
        rd = normalize(rd + g * dt * 2.0); 
        
        // Sample accretion disk
        float density = getDiskDensity(p);
        if (density > 0.0) {
            // Hot inner disk, cooler outer
            vec3 fire = mix(vec3(1.0, 0.3, 0.0), vec3(1.0, 0.8, 0.4), smoothstep(4.0, 1.5, r));
            // Doppler shift approximation (blueshift left, redshift right)
            float v = dot(normalize(vec3(-p.z, 0.0, p.x)), rd);
            fire *= 1.0 + v * 0.8;
            
            float alpha = density * 0.5 * dt;
            accretionColor += fire * alpha * transmittance * 5.0;
            transmittance *= 1.0 - alpha;
        }
        
        t += dt;
        
        // Adaptive step size (take larger steps when far from BH)
        dt = max(0.02, r * 0.05);
    }
    
    // Add background if ray escaped
    if (transmittance > 0.01) {
        col += getStarfield(rd) * transmittance;
    }
    
    col += accretionColor;
    
    // Tonemapping
    col = col / (1.0 + col);
    col = pow(col, vec3(1.0/2.2));

    gl_FragColor = vec4(col, 1.0);
}
`;

function BlackHoleQuad() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const { size, camera } = useThree();

  const uniforms = useMemo(
    () => ({
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2(size.width, size.height) },
      cameraPos: { value: new THREE.Vector3() },
      cameraViewMatrix: { value: new THREE.Matrix4() },
    }),
    [size],
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.iTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.iResolution.value.set(
        state.size.width,
        state.size.height,
      );

      // Update camera rotation matrix
      // OrbitControls will rotate our default OrthographicCamera, so we extract its rotation
      const matrix = new THREE.Matrix4().extractRotation(
        state.camera.matrixWorld,
      );
      materialRef.current.uniforms.cameraViewMatrix.value.copy(matrix);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function BlackHolePage() {
  return (
    <div className='w-full h-full relative overflow-hidden bg-black'>
      {/* UI Overlay */}
      <div className='absolute top-24 left-6 z-10 glass p-6 rounded-2xl max-w-sm animate-fade-in-up'>
        <h1 className='text-3xl font-display font-bold text-white mb-2 tracking-tight'>
          Hố Đen Cực Đại 🌌
        </h1>
        <p className='text-sm text-text-secondary mb-4 leading-relaxed'>
          Mô phỏng thấu kính hấp dẫn và đĩa bồi tụ của một Hố đen siêu khối
          lượng bằng ngôn ngữ WebGL Shader (Raymarching).
        </p>
        <p className='text-xs text-text-muted'>
          Ánh sáng bị bẻ cong bởi lực hấp dẫn cực mạnh, tạo ra ảo ảnh của vòng
          sáng phía sau hố đen. Các vùng sáng tối bất đối xứng là hệ quả của
          hiệu ứng Doppler (thuyết tương đối).
        </p>
      </div>

      <div className='absolute bottom-8 right-8 z-10 glass p-4 rounded-xl text-xs font-medium text-text-muted'>
        Kéo chuột để quan sát xung quanh Hố đen
      </div>

      <Canvas>
        {/* Orthographic camera for fullscreen quad rendering */}
        <OrthographicCamera
          makeDefault
          position={[0, 0, 1]}
          left={-1}
          right={1}
          top={1}
          bottom={-1}
          near={0}
          far={2}
        />

        {/* The quad that runs the shader */}
        <BlackHoleQuad />

        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
}

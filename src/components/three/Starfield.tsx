import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Starfield({ count = 6000 }) {
  const ref = useRef<THREE.Points>(null!);

  const [positions, sizes, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 300 + Math.random() * 700;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      sz[i] = 0.5 + Math.random() * 1.5;
      const hue = Math.random();
      if (hue < 0.6) {
        col[i * 3] = 0.85 + Math.random() * 0.15;
        col[i * 3 + 1] = 0.88 + Math.random() * 0.12;
        col[i * 3 + 2] = 0.95 + Math.random() * 0.05;
      } else if (hue < 0.85) {
        col[i * 3] = 1;
        col[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        col[i * 3 + 2] = 0.6 + Math.random() * 0.2;
      } else {
        col[i * 3] = 0.6 + Math.random() * 0.2;
        col[i * 3 + 1] = 0.7 + Math.random() * 0.2;
        col[i * 3 + 2] = 1;
      }
    }
    return [pos, sz, col];
  }, [count]);

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        },
        vertexShader: `
      attribute float size; attribute vec3 color; varying vec3 vColor; varying float vOpacity; uniform float uTime; uniform float uPixelRatio;
      void main() { vColor = color; vOpacity = 0.5 + 0.5 * sin(uTime * 0.5 + position.x * 0.1 + position.y * 0.13);
        vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * uPixelRatio * (200.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `
      varying vec3 vColor; varying float vOpacity;
      void main() { float d = length(gl_PointCoord - 0.5); if(d > 0.5) discard; float a = (1.0 - smoothstep(0.0, 0.5, d)) * vOpacity; gl_FragColor = vec4(vColor, a); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame(({ clock }) => {
    shaderMaterial.uniforms.uTime.value = clock.getElapsedTime();
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.003;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach='attributes-position' args={[positions, 3]} />
        <bufferAttribute attach='attributes-size' args={[sizes, 1]} />
        <bufferAttribute attach='attributes-color' args={[colors, 3]} />
      </bufferGeometry>
      <primitive object={shaderMaterial} attach='material' />
    </points>
  );
}

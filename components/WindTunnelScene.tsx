
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Center, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { WindSettings, ModelSettings } from '../types';

// Custom Shader Material for Pressure Visualization with Animation
// Uses WORLD SPACE for normals to ensure wind direction stays consistent regardless of camera angle
const AerodynamicMaterial = {
  uniforms: {
    uWindDir: { value: new THREE.Vector3(1, 0, 0) },
    uColorHigh: { value: new THREE.Color(1.0, 0.2, 0.0) }, // Red
    uColorMid: { value: new THREE.Color(1.0, 1.0, 0.0) },  // Yellow
    uColorLow: { value: new THREE.Color(0.0, 0.5, 1.0) },  // Blue
    uTime: { value: 0 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      // Calculate World Space Normal
      // This ensures that rotating the model correctly updates the pressure map 
      // relative to the fixed wind direction
      vNormal = normalize(mat3(modelMatrix) * normal);
      
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uWindDir;
    uniform vec3 uColorHigh;
    uniform vec3 uColorMid;
    uniform vec3 uColorLow;
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      // Calculate alignment with wind direction (World Space)
      // uWindDir is the direction FROM the source.
      // To find impact, we want the dot product of Normal and -WindDir (Wind Vector).
      // However, standard "Facing" logic usually dot(Normal, LightDir). 
      // Here, if wind comes from +X (1,0,0), it hits the Face pointing -X (-1,0,0).
      // dot(-1, 1) = -1. We want this to be High Pressure.
      
      // Let's assume uWindDir is the vector the wind is travelling TOWARDS.
      // Wait, physically, wind direction (1,0,0) means wind moving Right.
      // It hits the Left face (-1,0,0).
      
      // Let's standardize: uWindDir is the normalized vector of Wind Movement.
      // Impact Intensity = dot(vNormal, -uWindDir).
      // If normal opposes wind (face into wind), dot is positive.
      
      float intensity = dot(normalize(vNormal), -normalize(uWindDir));

      // Create a subtle flow animation effect
      // A moving sine wave based on position along the wind vector
      float flowPhase = dot(vWorldPosition, normalize(uWindDir)) * 0.5 - uTime * 10.0;
      float flowEffect = sin(flowPhase) * 0.05;

      // Add turbulence in the "wake" (low pressure areas, facing away from wind)
      if (intensity < -0.2) {
        // More chaotic noise in the back
        float turbulence = sin(vWorldPosition.x * 5.0 + uTime * 10.0) * sin(vWorldPosition.y * 5.0 + uTime * 8.0) * 0.15;
        intensity += turbulence;
      } else {
        // Subtle pulsing on the impact zones
        intensity += flowEffect;
      }

      vec3 color;
      // Color mapping
      if (intensity > 0.2) {
        // High pressure (Impact)
        color = mix(uColorMid, uColorHigh, smoothstep(0.2, 1.0, intensity));
      } else if (intensity > -0.2) {
        // Transition
        color = mix(uColorLow, uColorMid, smoothstep(-0.2, 0.2, intensity));
      } else {
        // Low pressure (Wake)
        color = uColorLow * (0.6 + flowEffect); // Modulate wake brightness
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

interface ModelProps {
  url: string;
  windSettings: WindSettings;
  modelSettings: ModelSettings;
  onLoad?: () => void;
}

const Model: React.FC<ModelProps> = ({ url, windSettings, modelSettings, onLoad }) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useEffect(() => {
    const loader = new STLLoader();
    loader.load(url, (geo) => {
      geo.computeBoundingBox();
      geo.center();
      geo.computeVertexNormals();
      setGeometry(geo);
      if (onLoad) onLoad();
    });
  }, [url, onLoad]);

  useFrame((state) => {
    if (materialRef.current) {
      // Update Wind Direction Uniform
      const dir = new THREE.Vector3(
        windSettings.directionX,
        windSettings.directionY,
        windSettings.directionZ
      ).normalize();
      
      // If vector is zero (user set all to 0), default to X
      if (dir.lengthSq() === 0) dir.set(1, 0, 0);

      materialRef.current.uniforms.uWindDir.value.copy(dir);
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  if (!geometry) return null;

  return (
    <mesh 
      geometry={geometry} 
      castShadow 
      receiveShadow
      rotation={[
        THREE.MathUtils.degToRad(modelSettings.rotationX),
        THREE.MathUtils.degToRad(modelSettings.rotationY),
        THREE.MathUtils.degToRad(modelSettings.rotationZ)
      ]}
    >
      <shaderMaterial
        ref={materialRef}
        args={[AerodynamicMaterial]}
        uniforms-uWindDir-value={new THREE.Vector3(1, 0, 0)}
        uniforms-uTime-value={0}
      />
    </mesh>
  );
};

interface StreamlinesProps {
  count: number;
  speed: number;
  direction: THREE.Vector3;
  bounds: number;
}

const Streamlines: React.FC<StreamlinesProps> = ({ count, speed, direction, bounds }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Initialize particles with random positions and offsets
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * bounds,
        y: (Math.random() - 0.5) * bounds,
        z: (Math.random() - 0.5) * bounds,
        speedOffset: Math.random() * 0.5 + 0.8, // Vary speed slightly
        sizeOffset: Math.random() * 0.5 + 0.5,
      });
    }
    return temp;
  }, [count, bounds]);

  useFrame((state, delta) => {
    if (!mesh.current) return;

    const dir = direction.clone().normalize();
    if (dir.lengthSq() === 0) dir.set(1, 0, 0);

    particles.forEach((particle, i) => {
      // Move particle along wind direction
      const moveSpeed = speed * particle.speedOffset * delta * 5.0;
      
      particle.x += dir.x * moveSpeed;
      particle.y += dir.y * moveSpeed;
      particle.z += dir.z * moveSpeed;

      // Wrap logic
      const halfBounds = bounds / 2;
      // Check bounds for each axis independently for wrapping
      if (Math.abs(particle.x) > halfBounds) {
         // Reset to opposite side relative to wind
         // If wind x is positive, move to -halfBounds
         if (Math.abs(dir.x) > 0.1) particle.x = -Math.sign(dir.x) * halfBounds + (Math.random() * 10 - 5);
         else particle.x = (Math.random() - 0.5) * bounds;
      }
      
      if (Math.abs(particle.y) > halfBounds) {
        if (Math.abs(dir.y) > 0.1) particle.y = -Math.sign(dir.y) * halfBounds + (Math.random() * 10 - 5);
        else particle.y = (Math.random() - 0.5) * bounds;
      }

      if (Math.abs(particle.z) > halfBounds) {
        if (Math.abs(dir.z) > 0.1) particle.z = -Math.sign(dir.z) * halfBounds + (Math.random() * 10 - 5);
        else particle.z = (Math.random() - 0.5) * bounds;
      }

      dummy.position.set(particle.x, particle.y, particle.z);
      
      // Align particle with wind direction
      const up = new THREE.Vector3(0, 1, 0);
      if (Math.abs(dir.dot(up)) > 0.99) dummy.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
      else dummy.lookAt(particle.x + dir.x, particle.y + dir.y, particle.z + dir.z);
      
      // Stretch based on speed to look like streaks
      // THICKER AIR: Increased Y/Z scale factor from 0.05 to 0.3
      const stretch = Math.max(2, speed * 0.8);
      const thickness = 0.3 * particle.sizeOffset; 
      dummy.scale.set(stretch, thickness, thickness);
      
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      {/* THICKER AIR: Increased opacity from 0.4 to 0.8 and brightness */}
      <meshBasicMaterial 
        color="#e0f2fe" 
        transparent 
        opacity={0.7} 
        blending={THREE.AdditiveBlending}
        depthWrite={false} 
      />
    </instancedMesh>
  );
};

interface SceneProps {
  stlUrl: string | null;
  windSettings: WindSettings;
  modelSettings: ModelSettings;
  setGl?: (gl: THREE.WebGLRenderer) => void;
}

export const WindTunnelScene: React.FC<SceneProps> = ({ stlUrl, windSettings, modelSettings, setGl }) => {
  return (
    <Canvas
      shadows
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      onCreated={({ gl }) => {
        if (setGl) setGl(gl);
      }}
    >
      <PerspectiveCamera makeDefault position={[50, 30, 50]} fov={45} />
      <OrbitControls makeDefault maxDistance={200} minDistance={10} />
      
      <Environment preset="city" />
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />

      <group>
        {stlUrl && (
          <Center>
            <Model url={stlUrl} windSettings={windSettings} modelSettings={modelSettings} />
          </Center>
        )}
      </group>

      <Streamlines 
        count={windSettings.particleCount} 
        speed={windSettings.speed}
        direction={new THREE.Vector3(windSettings.directionX, windSettings.directionY, windSettings.directionZ)}
        bounds={150} 
      />
      
      <gridHelper args={[200, 20, 0x334155, 0x1e293b]} position={[0, -20, 0]} />
      <fog attach="fog" args={['#0f172a', 50, 250]} />
    </Canvas>
  );
};

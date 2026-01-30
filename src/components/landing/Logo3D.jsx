import React, { useRef, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_PATH = '/Meshy_AI_Architectural_Letters_0107214336_texture.glb';

// Error Boundary for 3D content
class Logo3DErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(_error, _errorInfo) {
    console.warn('Logo3D Error:', _error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

// Load the 3D model with optimized, frame-rate independent animation
function LogoModel({ mouseRef }) {
  const groupRef = useRef(null);      // Parallax movement
  const floatingRef = useRef(null);   // Floating animation
  const rotationRef = useRef(null);   // Mouse-driven rotation
  
  const { scene } = useGLTF(MODEL_PATH);

  // Local state for smooth interpolation (inertia)
  const dampedMouse = useRef({ x: 0, y: 0 });

  // Clone and prepare the scene - memoized for performance
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    
    const cloned = scene.clone();
    
    // Center and scale the model
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Center the model relative to its own coordinate system
    cloned.position.set(-center.x, -center.y, -center.z);
    
    // Scale factor - adjusted for the scene
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = (2.5 / maxDim) * 0.48; 
    cloned.scale.multiplyScalar(scale);
    
    return cloned;
  }, [scene]);

  // Initial rotation setup
  useEffect(() => {
    if (rotationRef.current) {
      rotationRef.current.rotation.y = Math.PI / 4;   // Isometric Y
      rotationRef.current.rotation.x = -Math.PI / 12; // Isometric X
    }
  }, []);

  // Smooth animation loop
  useFrame((state, delta) => {
    if (!mouseRef.current) return;

    // Safety check for inactive tabs or lag spikes (cap delta)
    const dt = Math.min(delta, 0.1);
    
    // 1. Smooth out mouse position (Inertia effect)
    // Frame-rate independent lerp: 1 - exp(-speed * dt)
    const mouseInertia = 2.5; // Lower = smoother/lazier
    dampedMouse.current.x = THREE.MathUtils.lerp(dampedMouse.current.x, mouseRef.current.x, 1 - Math.exp(-mouseInertia * dt));
    dampedMouse.current.y = THREE.MathUtils.lerp(dampedMouse.current.y, mouseRef.current.y, 1 - Math.exp(-mouseInertia * dt));

    // 2. Apply Rotation (Inner Group)
    if (rotationRef.current) {
      const baseRotationY = Math.PI / 4;
      const baseRotationX = -Math.PI / 12;
      
      const targetRotationX = baseRotationX + dampedMouse.current.y * 0.22;
      const targetRotationY = baseRotationY + dampedMouse.current.x * 0.22;
      
      const rotSmoothing = 2.0; // Lower = smoother/lazier
      rotationRef.current.rotation.x = THREE.MathUtils.lerp(rotationRef.current.rotation.x, targetRotationX, 1 - Math.exp(-rotSmoothing * dt));
      rotationRef.current.rotation.y = THREE.MathUtils.lerp(rotationRef.current.rotation.y, targetRotationY, 1 - Math.exp(-rotSmoothing * dt));
    }

    // 3. Apply Floating (Middle Group)
    if (floatingRef.current) {
      const floatSpeed = 0.5;
      const floatAmplitude = 0.2;
      floatingRef.current.position.y = Math.sin(state.clock.elapsedTime * floatSpeed) * floatAmplitude;
    }

    // 4. Apply Parallax (Outer Group)
    if (groupRef.current) {
      const parallaxIntensity = 0.5;
      const targetPosX = dampedMouse.current.x * parallaxIntensity;
      const targetPosY = -dampedMouse.current.y * parallaxIntensity;
      
      const posSmoothing = 1.5; // Lower = smoother/lazier
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetPosX, 1 - Math.exp(-posSmoothing * dt));
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetPosY, 1 - Math.exp(-posSmoothing * dt));
    }
  });

  if (!clonedScene) return null;

  return (
    <group ref={groupRef}>
      <group ref={floatingRef}>
        <group ref={rotationRef}>
          <primitive object={clonedScene} />
        </group>
      </group>
    </group>
  );
}

// Beautiful loading spinner while 3D model loads
function LoadingFallback() {
  const ringRef = useRef();
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 1.5;
    }
  });

  return (
    <group>
      {/* Outer spinning ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.8, 0.05, 16, 64, Math.PI * 1.5]} />
        <meshStandardMaterial 
          color="#984E39" 
          transparent 
          opacity={0.8}
          emissive="#984E39"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Inner pulsing circle */}
      <mesh>
        <circleGeometry args={[0.5, 32]} />
        <meshStandardMaterial 
          color="#D4A574" 
          transparent 
          opacity={0.15}
        />
      </mesh>
      
      {/* Center dot */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color="#984E39" 
          emissive="#984E39"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

export default function Logo3D({ className = '' }) {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      
      mouseRef.current.x = x;
      mouseRef.current.y = y;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fallbackElement = (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl animate-pulse" />
    </div>
  );

  return (
    <Logo3DErrorBoundary fallback={fallbackElement}>
      <div 
        ref={containerRef}
        className={`w-full h-full ${className}`}
        style={{ 
          minHeight: '400px',
          pointerEvents: 'none',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          overflow: 'visible',
          background: 'transparent'
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 50 }}
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true
          }}
          dpr={[1, 1.5]} 
          performance={{ min: 0.5 }}
          style={{ background: 'transparent', pointerEvents: 'none' }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={0.9} />
          <directionalLight position={[-5, -5, -5]} intensity={0.3} />
          <pointLight position={[0, 2, 4]} intensity={0.5} color="#D4A574" />
          
          <Environment preset="city" />
          
          <Suspense fallback={<LoadingFallback />}>
            <LogoModel mouseRef={mouseRef} />
          </Suspense>
        </Canvas>
      </div>
    </Logo3DErrorBoundary>
  );
}

useGLTF.preload(MODEL_PATH);
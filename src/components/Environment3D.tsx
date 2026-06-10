import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTurbineStore } from '../store/useTurbineStore'

export function Environment3D() {
  const skyRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const state = useTurbineStore.getState()
    if (skyRef.current && skyRef.current.material) {
      const mat = skyRef.current.material as THREE.MeshStandardMaterial
      if (state.isStormMode) {
        mat.color.lerp(new THREE.Color('#3a3a4a'), 0.02)
      } else {
        mat.color.lerp(new THREE.Color('#87CEEB'), 0.02)
      }
    }
  })

  return (
    <group>
      <mesh ref={skyRef} position={[0, 80, -100]} scale={[300, 150, 10]}>
        <planeGeometry />
        <meshStandardMaterial color="#87CEEB" side={THREE.DoubleSide} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#4a7c3f" roughness={0.9} />
      </mesh>

      <mesh position={[30, 0, -80]} receiveShadow>
        <sphereGeometry args={[25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color="#5a8c4f" roughness={0.9} />
      </mesh>
      <mesh position={[-60, 0, -70]} receiveShadow>
        <sphereGeometry args={[35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color="#4a7c3f" roughness={0.9} />
      </mesh>
      <mesh position={[80, 0, -90]} receiveShadow>
        <sphereGeometry args={[20, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color="#3d6b35" roughness={0.9} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <circleGeometry args={[15, 32]} />
        <meshStandardMaterial color="#5a8c4f" roughness={0.8} />
      </mesh>

      <group position={[-10, 3, -15]}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 3, 8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
        <mesh position={[0, 4, 0]}>
          <coneGeometry args={[1.5, 3, 8]} />
          <meshStandardMaterial color="#2d5a1e" roughness={0.8} />
        </mesh>
      </group>
      <group position={[-12, 3, -14]}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 3, 8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
        <mesh position={[0, 4, 0]}>
          <coneGeometry args={[1.2, 2.5, 8]} />
          <meshStandardMaterial color="#1e4a15" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}
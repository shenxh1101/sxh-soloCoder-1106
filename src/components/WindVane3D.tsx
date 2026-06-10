import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTurbineStore } from '../store/useTurbineStore'

export function WindVane3D() {
  const vaneRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const { windDirection } = useTurbineStore.getState()
    if (vaneRef.current) {
      const targetAngle = THREE.MathUtils.degToRad(windDirection)
      vaneRef.current.rotation.y = targetAngle
    }
  })

  return (
    <group position={[25, 5, -5]}>
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 8, 8]} />
        <meshStandardMaterial color="#808080" metalness={0.5} roughness={0.4} />
      </mesh>

      <group ref={vaneRef} position={[0, 8.5, 0]}>
        <mesh>
          <boxGeometry args={[1.5, 0.3, 0.15]} />
          <meshStandardMaterial color="#ff4444" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[-1.2, 0, 0]}>
          <boxGeometry args={[1.5, 0.3, 0.15]} />
          <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.3, 0.6, 0.3]} />
          <meshStandardMaterial color="#606060" metalness={0.5} roughness={0.4} />
        </mesh>

        <mesh position={[1.5, 0.5, 0]}>
          <boxGeometry args={[0.15, 0.15, 0.5]} />
          <meshStandardMaterial color="#ffaa00" metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[1.5, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.15, 0.15, 0.5]} />
          <meshStandardMaterial color="#ffaa00" metalness={0.4} roughness={0.3} />
        </mesh>
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[1.5, 4]} />
        <meshStandardMaterial color="#606060" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}
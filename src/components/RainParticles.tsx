import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTurbineStore } from '../store/useTurbineStore'

const PARTICLE_COUNT = 3000

export function RainParticles() {
  const pointsRef = useRef<THREE.Points>(null)

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const vel = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100
      pos[i * 3 + 1] = Math.random() * 60
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80
      vel[i] = 15 + Math.random() * 25
    }
    return [pos, vel]
  }, [])

  useFrame((_, delta) => {
    const { isStormMode, windSpeed } = useTurbineStore.getState()
    if (!pointsRef.current) return

    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array
    const isStorm = isStormMode

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      posArray[i * 3 + 1] -= velocities[i] * delta * (isStorm ? 1.0 : 0.1)
      posArray[i * 3] += windSpeed * 0.2 * delta * (isStorm ? 1.0 : 0.01)

      if (posArray[i * 3 + 1] < -1) {
        posArray[i * 3 + 1] = 55 + Math.random() * 10
        posArray[i * 3] = (Math.random() - 0.5) * 100
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 80
        velocities[i] = 15 + Math.random() * 25
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
    if (pointsRef.current.material) {
      const mat = pointsRef.current.material as THREE.PointsMaterial
      const targetOpacity = isStorm ? 0.6 : 0.0
      mat.opacity += (targetOpacity - mat.opacity) * Math.min(delta * 3, 1)
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#88ccff"
        size={0.15}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
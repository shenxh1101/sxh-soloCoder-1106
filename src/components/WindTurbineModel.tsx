import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTurbineStore } from '../store/useTurbineStore'

function Blade() {
  const shape = new THREE.Shape()
  shape.moveTo(0, -0.2)
  shape.lineTo(0.4, -0.15)
  shape.lineTo(0.8, -0.05)
  shape.lineTo(1.2, 0)
  shape.lineTo(0.8, 0.05)
  shape.lineTo(0.4, 0.15)
  shape.lineTo(0, 0.2)
  shape.closePath()

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: 18,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.03,
    bevelSegments: 2,
  }

  return (
    <mesh position={[0, 0, 0.8]} rotation={[0, 0, Math.PI / 2]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color="#e8e8e8" metalness={0.3} roughness={0.4} />
    </mesh>
  )
}

function Hub() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.35, 0.4, 0.4, 16]} />
        <meshStandardMaterial color="#a0a0a0" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

export function WindTurbineModel() {
  const rotorRef = useRef<THREE.Group>(null)
  const yawRef = useRef<THREE.Group>(null)
  const bladeAngleRef = useRef(0)

  useFrame((_, delta) => {
    const state = useTurbineStore.getState()
    const { rotorSpeed, yawAngle, isBrakeEngaged } = state

    if (rotorRef.current) {
      if (rotorSpeed > 0 && !isBrakeEngaged) {
        const rotDelta = (rotorSpeed / 60) * Math.PI * 2 * delta
        bladeAngleRef.current += rotDelta
      }
      rotorRef.current.rotation.z = bladeAngleRef.current
    }

    if (yawRef.current) {
      const targetYaw = THREE.MathUtils.degToRad(yawAngle)
      yawRef.current.rotation.y = targetYaw
    }
  })

  return (
    <group>
      <mesh position={[0, 25, 0]}>
        <cylinderGeometry args={[1.5, 2.5, 50, 32]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.4} roughness={0.3} />
      </mesh>

      <mesh position={[0, 51, 0]}>
        <cylinderGeometry args={[1.4, 1.5, 4, 32]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.4} roughness={0.3} />
      </mesh>

      <group ref={yawRef} position={[0, 51, 0]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2.5, 2.5, 5]} />
          <meshStandardMaterial color="#d8d8d8" metalness={0.5} roughness={0.3} />
        </mesh>

        <mesh position={[0, 1.8, -0.8]}>
          <boxGeometry args={[1.2, 0.4, 1.5]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.5} roughness={0.3} />
        </mesh>

        <mesh position={[0, 1.8, 1.8]}>
          <boxGeometry args={[1.2, 0.4, 1.5]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.5} roughness={0.3} />
        </mesh>

        <group ref={rotorRef} position={[0, 0.5, 2.8]}>
          <Hub />
          <group rotation={[0, 0, 0]}>
            <Blade />
          </group>
          <group rotation={[0, 0, (2 * Math.PI) / 3]}>
            <Blade />
          </group>
          <group rotation={[0, 0, (4 * Math.PI) / 3]}>
            <Blade />
          </group>
        </group>

        <mesh position={[0, 1.8, 3.3]}>
          <cylinderGeometry args={[0.15, 0.15, 1.2, 8]} />
          <meshStandardMaterial color="#707070" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}
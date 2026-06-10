import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTurbineStore } from '../store/useTurbineStore'

function BladeShape() {
  const profile = new THREE.Shape()
  profile.moveTo(0, -0.18)
  profile.bezierCurveTo(0.3, -0.14, 0.6, -0.06, 0.9, -0.02)
  profile.bezierCurveTo(1.0, -0.01, 1.1, 0, 1.15, 0)
  profile.bezierCurveTo(1.1, 0.01, 1.0, 0.02, 0.9, 0.03)
  profile.bezierCurveTo(0.6, 0.08, 0.3, 0.15, 0, 0.18)
  profile.closePath()
  return profile
}

function Blade() {
  const shape = BladeShape()
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: 20,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.02,
    bevelSegments: 3,
  }

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color="#f0f0f0" metalness={0.25} roughness={0.35} />
    </mesh>
  )
}

function Hub() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.7, 20, 20]} />
        <meshStandardMaterial color="#c8c8c8" metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.35]}>
        <cylinderGeometry args={[0.4, 0.5, 0.5, 20]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.6, 0.7, 0.2, 20]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.5} roughness={0.25} />
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
      <mesh position={[0, 25, 0]} castShadow>
        <cylinderGeometry args={[1.5, 2.5, 50, 32]} />
        <meshStandardMaterial color="#e4e4e4" metalness={0.35} roughness={0.3} />
      </mesh>

      <mesh position={[0, 51, 0]} castShadow>
        <cylinderGeometry args={[1.4, 1.5, 4, 32]} />
        <meshStandardMaterial color="#d4d4d4" metalness={0.35} roughness={0.3} />
      </mesh>

      <group ref={yawRef} position={[0, 51, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[2.6, 2.6, 5.5]} />
          <meshStandardMaterial color="#dcdcdc" metalness={0.45} roughness={0.3} />
        </mesh>

        <mesh position={[0, 1.9, -1.0]}>
          <boxGeometry args={[1.3, 0.4, 1.8]} />
          <meshStandardMaterial color="#c8c8c8" metalness={0.45} roughness={0.3} />
        </mesh>

        <mesh position={[0, 1.9, 2.0]}>
          <boxGeometry args={[1.3, 0.4, 1.8]} />
          <meshStandardMaterial color="#c8c8c8" metalness={0.45} roughness={0.3} />
        </mesh>

        <group ref={rotorRef} position={[0, 0.5, 3.1]}>
          <Hub />
          <Blade />
          <group rotation={[0, 0, (2 * Math.PI) / 3]}>
            <Blade />
          </group>
          <group rotation={[0, 0, (4 * Math.PI) / 3]}>
            <Blade />
          </group>
        </group>

        <mesh position={[0, 1.9, 3.6]}>
          <cylinderGeometry args={[0.12, 0.12, 0.8, 8]} />
          <meshStandardMaterial color="#808080" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}
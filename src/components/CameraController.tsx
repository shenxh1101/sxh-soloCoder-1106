import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useTurbineStore } from '../store/useTurbineStore'

export function CameraController() {
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()
  const prevNacelleView = useRef(false)

  const defaultPos = new THREE.Vector3(40, 30, 50)
  const nacellePos = new THREE.Vector3(0, 52.5, 3.5)
  const nacelleLookTarget = new THREE.Vector3(0, 52, 60)
  const lookTarget = new THREE.Vector3(0, 30, 0)

  useEffect(() => {
    camera.position.copy(defaultPos)
    camera.lookAt(lookTarget)
  }, [])

  useFrame(() => {
    const { isNacelleView, yawAngle } = useTurbineStore.getState()

    if (isNacelleView !== prevNacelleView.current) {
      prevNacelleView.current = isNacelleView

      if (isNacelleView) {
        const yawRad = THREE.MathUtils.degToRad(yawAngle)
        const offset = new THREE.Vector3(0, 1.5, 3)
        const rotatedOffset = offset.clone().applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          yawRad
        )
        const targetPos = nacellePos.clone().add(rotatedOffset)
        camera.position.copy(targetPos)

        const lookOffset = new THREE.Vector3(0, 0, 50)
        const rotatedLook = lookOffset.clone().applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          yawRad
        )
        camera.lookAt(nacellePos.clone().add(rotatedLook))

        if (controlsRef.current) {
          controlsRef.current.enabled = false
        }
      } else {
        camera.position.copy(defaultPos)
        camera.lookAt(lookTarget)

        if (controlsRef.current) {
          controlsRef.current.target.copy(lookTarget)
          controlsRef.current.enabled = true
          controlsRef.current.update()
        }
      }
    }

    if (isNacelleView) {
      const yawRad = THREE.MathUtils.degToRad(useTurbineStore.getState().yawAngle)
      const basePos = nacellePos.clone()
      const offset = new THREE.Vector3(0, 1.5, 3)
      const rotatedOffset = offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRad)
      camera.position.lerp(basePos.clone().add(rotatedOffset), 0.1)

      const lookOffset = new THREE.Vector3(0, 0, 50)
      const rotatedLook = lookOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRad)
      const lookPoint = basePos.clone().add(rotatedLook)
      camera.lookAt(lookPoint)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      target={lookTarget}
      enableDamping
      dampingFactor={0.1}
      minDistance={15}
      maxDistance={120}
      maxPolarAngle={Math.PI / 2.2}
      minPolarAngle={0.2}
    />
  )
}
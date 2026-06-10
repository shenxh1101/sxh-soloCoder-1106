import { Canvas } from '@react-three/fiber'
import { WindTurbineModel } from './components/WindTurbineModel'
import { Environment3D } from './components/Environment3D'
import { WindVane3D } from './components/WindVane3D'
import { RainParticles } from './components/RainParticles'
import { CameraController } from './components/CameraController'
import { Dashboard } from './components/Dashboard'
import { ControlPanel } from './components/ControlPanel'
import { WindCompass } from './components/WindCompass'
import { StatusBar } from './components/StatusBar'
import { SimulationRunner } from './components/SimulationRunner'

export default function App() {
  return (
    <div className="app-container">
      <SimulationRunner />
      <div className="canvas-wrapper">
        <Canvas
          shadows
          camera={{ position: [40, 30, 50], fov: 50, near: 0.1, far: 500 }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[50, 60, 30]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <hemisphereLight
            args={['#87CEEB', '#4a7c3f', 0.3]}
          />
          <Environment3D />
          <WindTurbineModel />
          <WindVane3D />
          <RainParticles />
          <CameraController />
        </Canvas>
      </div>
      <Dashboard />
      <ControlPanel />
      <WindCompass />
      <StatusBar />
    </div>
  )
}
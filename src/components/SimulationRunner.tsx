import { useEffect, useRef } from 'react'
import { useTurbineStore } from '../store/useTurbineStore'

export function SimulationRunner() {
  const updateSimulation = useTurbineStore((s) => s.updateSimulation)
  const lastTimeRef = useRef(performance.now())

  useEffect(() => {
    let rafId: number

    const loop = (time: number) => {
      const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = time
      updateSimulation(delta)
      rafId = requestAnimationFrame(loop)
    }

    lastTimeRef.current = performance.now()
    rafId = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(rafId)
  }, [updateSimulation])

  return null
}
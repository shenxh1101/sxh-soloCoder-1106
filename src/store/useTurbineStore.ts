import { create } from 'zustand'
import { TurbineState, PowerDataPoint } from '../types/turbine'
import { calculatePowerOutput, calculateRotorSpeed } from '../utils/powerCurve'

interface TurbineStore extends TurbineState {
  powerDataHistory: PowerDataPoint[]
  setTargetWindSpeed: (speed: number) => void
  toggleStormMode: () => void
  toggleBrake: () => void
  toggleNacelleView: () => void
  setWindDirection: (dir: number) => void
  updateSimulation: (deltaTime: number) => void
  setWindSpeed: (speed: number) => void
  getRecentPowerData: () => PowerDataPoint[]
}

const WIND_SPEED_SMOOTHING = 2.0
const YAW_SPEED = 0.5
const STORM_VARIANCE = 8
const STORM_CHANGE_RATE = 15

let stormTimer = 0
let lastStormSpeed = 8

export const useTurbineStore = create<TurbineStore>((set, get) => ({
  windSpeed: 8,
  targetWindSpeed: 8,
  rotorSpeed: 0,
  powerOutput: 0,
  totalEnergy: 0,
  windDirection: 180,
  yawAngle: 180,
  isBrakeEngaged: false,
  isStormMode: false,
  isNacelleView: false,
  powerDataHistory: [],

  setTargetWindSpeed: (speed: number) => {
    const state = get()
    if (state.isStormMode) return
    set({ targetWindSpeed: Math.max(0, Math.min(25, speed)) })
  },

  setWindSpeed: (speed: number) => {
    set({ windSpeed: Math.max(0, Math.min(25, speed)) })
  },

  toggleStormMode: () => {
    set((state) => {
      if (!state.isStormMode) {
        lastStormSpeed = state.windSpeed
        stormTimer = 0
        return { isStormMode: true }
      }
      return {
        isStormMode: false,
        targetWindSpeed: lastStormSpeed,
      }
    })
  },

  toggleBrake: () => {
    set((state) => ({ isBrakeEngaged: !state.isBrakeEngaged }))
  },

  toggleNacelleView: () => {
    set((state) => ({ isNacelleView: !state.isNacelleView }))
  },

  setWindDirection: (dir: number) => {
    set({ windDirection: ((dir % 360) + 360) % 360 })
  },

  updateSimulation: (deltaTime: number) => {
    const state = get()
    let newWindSpeed = state.windSpeed

    if (state.isStormMode) {
      stormTimer += deltaTime
      if (stormTimer >= 1 / STORM_CHANGE_RATE) {
        stormTimer = 0
        const target = 5 + Math.random() * 20
        lastStormSpeed = target
      }
      newWindSpeed += (lastStormSpeed - newWindSpeed) * Math.min(deltaTime * 3, 1)
    } else {
      const diff = state.targetWindSpeed - newWindSpeed
      newWindSpeed += diff * Math.min(deltaTime * WIND_SPEED_SMOOTHING, 1)
      if (Math.abs(diff) < 0.01) newWindSpeed = state.targetWindSpeed
    }

    const rotorSpeed = calculateRotorSpeed(newWindSpeed, state.isBrakeEngaged)
    const powerOutput = state.isBrakeEngaged ? 0 : calculatePowerOutput(newWindSpeed)
    const energyIncrement = (powerOutput * deltaTime) / 3600
    const totalEnergy = state.totalEnergy + energyIncrement

    let yawAngle = state.yawAngle
    const yawDiff = state.windDirection - yawAngle
    const normalizedDiff = ((yawDiff + 180) % 360) - 180
    if (Math.abs(normalizedDiff) > 0.5) {
      yawAngle += Math.sign(normalizedDiff) * YAW_SPEED * deltaTime * 60
    } else {
      yawAngle = state.windDirection
    }
    yawAngle = ((yawAngle % 360) + 360) % 360

    const newPoint: PowerDataPoint = {
      timestamp: Date.now(),
      windSpeed: newWindSpeed,
      powerOutput,
      rotorSpeed,
    }
    const history = [...state.powerDataHistory, newPoint]
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000
    const trimmedHistory = history.filter((p) => p.timestamp > tenMinutesAgo)
    if (trimmedHistory.length > 6000) {
      trimmedHistory.splice(0, trimmedHistory.length - 6000)
    }

    set({
      windSpeed: newWindSpeed,
      rotorSpeed,
      powerOutput,
      totalEnergy,
      yawAngle,
      powerDataHistory: trimmedHistory,
    })
  },

  getRecentPowerData: () => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000
    return get().powerDataHistory.filter((p) => p.timestamp > tenMinutesAgo)
  },
}))
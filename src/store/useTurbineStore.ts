import { create } from 'zustand'
import { TurbineState, PowerDataPoint, TurbineEvent } from '../types/turbine'
import { calculatePowerOutput, calculateRotorSpeed } from '../utils/powerCurve'
import {
  CHART_SAMPLE_INTERVAL,
  CHART_WINDOW_SECONDS,
  CSV_SAMPLE_INTERVAL,
  CSV_WINDOW_SECONDS,
  OVERWIND_THRESHOLD,
  OVERWIND_DURATION,
} from '../types/turbine'

interface TurbineStore extends TurbineState {
  chartData: PowerDataPoint[]
  csvData: PowerDataPoint[]
  events: TurbineEvent[]
  isAutoProtected: boolean
  setTargetWindSpeed: (speed: number) => void
  toggleStormMode: () => void
  toggleBrake: () => void
  toggleNacelleView: () => void
  setWindDirection: (dir: number) => void
  updateSimulation: (deltaTime: number) => void
  setWindSpeed: (speed: number) => void
  getRecentPowerData: () => PowerDataPoint[]
  manualReset: () => void
}

const WIND_SPEED_SMOOTHING = 2.0
const YAW_SPEED = 0.5
const STORM_CHANGE_RATE = 15

let stormTimer = 0
let lastStormSpeed = 8
let chartSampleTimer = 0
let csvSampleTimer = 0
let overwindTimer = 0
let eventIdCounter = 1

function addEvent(
  events: TurbineEvent[],
  type: TurbineEvent['type'],
  message: string
): TurbineEvent[] {
  const event: TurbineEvent = {
    id: eventIdCounter++,
    timestamp: Date.now(),
    type,
    message,
  }
  const updated = [event, ...events]
  if (updated.length > 50) updated.length = 50
  return updated
}

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
  isAutoProtected: false,
  chartData: [],
  csvData: [],
  events: [],

  setTargetWindSpeed: (speed: number) => {
    const state = get()
    if (state.isStormMode) return
    if (state.isAutoProtected) return
    set({ targetWindSpeed: Math.max(0, Math.min(25, speed)) })
  },

  setWindSpeed: (speed: number) => {
    set({ windSpeed: Math.max(0, Math.min(25, speed)) })
  },

  toggleStormMode: () => {
    set((state) => {
      if (state.isAutoProtected) return state
      if (!state.isStormMode) {
        lastStormSpeed = state.windSpeed
        stormTimer = 0
        return {
          isStormMode: true,
          events: addEvent(state.events, 'storm_on', '风暴模式已激活'),
        }
      }
      return {
        isStormMode: false,
        targetWindSpeed: lastStormSpeed,
        events: addEvent(state.events, 'storm_off', '风暴模式已关闭'),
      }
    })
  },

  toggleBrake: () => {
    set((state) => {
      if (state.isAutoProtected && state.isBrakeEngaged) return state
      const newBrake = !state.isBrakeEngaged
      return {
        isBrakeEngaged: newBrake,
        isAutoProtected: newBrake ? state.isAutoProtected : false,
        events: addEvent(
          state.events,
          newBrake ? 'brake' : 'brake_release',
          newBrake ? '刹车已锁定' : '刹车已释放'
        ),
      }
    })
  },

  toggleNacelleView: () => {
    set((state) => ({ isNacelleView: !state.isNacelleView }))
  },

  setWindDirection: (dir: number) => {
    set({ windDirection: ((dir % 360) + 360) % 360 })
  },

  manualReset: () => {
    const state = get()
    set({
      windSpeed: 8,
      targetWindSpeed: 8,
      rotorSpeed: 0,
      powerOutput: 0,
      totalEnergy: 0,
      isBrakeEngaged: false,
      isStormMode: false,
      isAutoProtected: false,
      chartData: [],
      csvData: [],
      events: addEvent(state.events, 'manual_reset', '系统已手动复位'),
    })
    lastStormSpeed = 8
    stormTimer = 0
    chartSampleTimer = 0
    csvSampleTimer = 0
    overwindTimer = 0
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

    let events = state.events
    let isBrakeEngaged = state.isBrakeEngaged
    let isAutoProtected = state.isAutoProtected

    if (!isBrakeEngaged && newWindSpeed >= OVERWIND_THRESHOLD) {
      overwindTimer += deltaTime
      if (overwindTimer >= OVERWIND_DURATION && !isAutoProtected) {
        isBrakeEngaged = true
        isAutoProtected = true
        overwindTimer = 0
        events = addEvent(
          events,
          'auto_shutdown',
          `过风速保护触发 (${newWindSpeed.toFixed(1)} m/s >= ${OVERWIND_THRESHOLD} m/s)，自动停机`
        )
      }
    } else if (newWindSpeed < OVERWIND_THRESHOLD - 1) {
      overwindTimer = Math.max(0, overwindTimer - deltaTime * 2)
    }

    if (newWindSpeed >= OVERWIND_THRESHOLD && !isAutoProtected && overwindTimer > 0.1 && overwindTimer < 0.2) {
      events = addEvent(
        events,
        'overwind_warning',
        `风速过高警告 (${newWindSpeed.toFixed(1)} m/s)，持续 ${OVERWIND_DURATION}秒 将触发保护停机`
      )
    }

    const rotorSpeed = calculateRotorSpeed(newWindSpeed, isBrakeEngaged)
    const powerOutput = isBrakeEngaged ? 0 : calculatePowerOutput(newWindSpeed)
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

    const point: PowerDataPoint = {
      timestamp: Date.now(),
      windSpeed: newWindSpeed,
      powerOutput,
      rotorSpeed,
    }

    chartSampleTimer += deltaTime
    let chartData = state.chartData
    if (chartSampleTimer >= CHART_SAMPLE_INTERVAL) {
      chartSampleTimer -= CHART_SAMPLE_INTERVAL
      chartData = [...chartData, point]
      const cutoff = Date.now() - CHART_WINDOW_SECONDS * 1000
      chartData = chartData.filter((p) => p.timestamp > cutoff)
      if (chartData.length > (CHART_WINDOW_SECONDS / CHART_SAMPLE_INTERVAL) + 5) {
        chartData = chartData.slice(-(CHART_WINDOW_SECONDS / CHART_SAMPLE_INTERVAL) - 5)
      }
    }

    csvSampleTimer += deltaTime
    let csvData = state.csvData
    if (csvSampleTimer >= CSV_SAMPLE_INTERVAL) {
      csvSampleTimer -= CSV_SAMPLE_INTERVAL
      csvData = [...csvData, point]
      const cutoff = Date.now() - CSV_WINDOW_SECONDS * 1000
      csvData = csvData.filter((p) => p.timestamp > cutoff)
    }

    set({
      windSpeed: newWindSpeed,
      rotorSpeed,
      powerOutput,
      totalEnergy,
      yawAngle,
      isBrakeEngaged,
      isAutoProtected,
      events,
      chartData,
      csvData,
    })
  },

  getRecentPowerData: () => {
    return get().csvData
  },
}))
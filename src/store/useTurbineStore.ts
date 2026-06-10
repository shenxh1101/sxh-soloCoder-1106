import { create } from 'zustand'
import { TurbineState, PowerDataPoint, TurbineEvent, Alert, AlertLevel } from '../types/turbine'
import { calculatePowerOutput, calculateRotorSpeed } from '../utils/powerCurve'
import {
  CHART_SAMPLE_INTERVAL,
  CHART_WINDOW_SECONDS,
  CSV_SAMPLE_INTERVAL,
  CSV_WINDOW_SECONDS,
  REPLAY_BUFFER_SECONDS,
  REPLAY_SAMPLE_INTERVAL,
  OVERWIND_THRESHOLD,
  OVERWIND_DURATION,
} from '../types/turbine'

interface TurbineStore extends TurbineState {
  chartData: PowerDataPoint[]
  csvData: PowerDataPoint[]
  events: TurbineEvent[]
  alerts: Alert[]

  replayData: PowerDataPoint[]
  replayIndex: number
  replaySpeed: number
  replayRangeEnd: number

  setTargetWindSpeed: (speed: number) => void
  toggleStormMode: () => void
  toggleBrake: () => void
  toggleNacelleView: () => void
  setWindDirection: (dir: number) => void
  setWindSpeed: (speed: number) => void
  updateSimulation: (deltaTime: number) => void
  getRecentPowerData: (seconds: number) => PowerDataPoint[]
  manualReset: () => void

  acknowledgeAlert: (id: number) => void
  clearAcknowledgedAlerts: () => void

  enterMaintenance: () => void
  exitMaintenance: () => void

  startReplay: (startOffset: number, duration: number) => void
  stopReplay: () => void
  tickReplay: (deltaTime: number) => void
}

const WIND_SPEED_SMOOTHING = 2.0
const YAW_SPEED = 0.5
const STORM_CHANGE_RATE = 15

let stormTimer = 0
let lastStormSpeed = 8
let chartSampleTimer = 0
let csvSampleTimer = 0
let replaySampleTimer = 0
let overwindTimer = 0
let eventIdCounter = 1
let alertIdCounter = 1000
let lastOverwindAlertId = 0
let overwindWasActive = false

function pushEvent(
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

function mergeOverwindAlert(
  alerts: Alert[],
  level: AlertLevel,
  message: string,
  active: boolean
): { alerts: Alert[]; alertId: number } {
  if (active && lastOverwindAlertId) {
    const existing = alerts.find((a) => a.id === lastOverwindAlertId)
    if (existing && existing.active) {
      return { alerts, alertId: lastOverwindAlertId }
    }
  }

  if (!active && lastOverwindAlertId) {
    const existing = alerts.find((a) => a.id === lastOverwindAlertId)
    if (existing && existing.active) {
      const updated = alerts.map((a) =>
        a.id === lastOverwindAlertId
          ? { ...a, active: false, endTime: Date.now() }
          : a
      )
      lastOverwindAlertId = 0
      return { alerts: updated, alertId: 0 }
    }
  }

  if (active) {
    const id = alertIdCounter++
    lastOverwindAlertId = id
    const alert: Alert = {
      id,
      type: 'overwind_warning',
      level,
      message,
      startTime: Date.now(),
      endTime: null,
      acknowledged: false,
      active: true,
    }
    const updated = [alert, ...alerts]
    if (updated.length > 30) updated.length = 30
    return { alerts: updated, alertId: id }
  }

  return { alerts, alertId: 0 }
}

function addDiscreteAlert(
  alerts: Alert[],
  type: Alert['type'],
  level: AlertLevel,
  message: string
): Alert[] {
  const id = alertIdCounter++
  const alert: Alert = {
    id,
    type,
    level,
    message,
    startTime: Date.now(),
    endTime: Date.now(),
    acknowledged: false,
    active: false,
  }
  const updated = [alert, ...alerts]
  if (updated.length > 30) updated.length = 30
  return updated
}

function makeDataPoint(
  windSpeed: number,
  powerOutput: number,
  rotorSpeed: number,
  isBrakeEngaged: boolean,
  isStormMode: boolean
): PowerDataPoint {
  return {
    timestamp: Date.now(),
    windSpeed,
    powerOutput,
    rotorSpeed,
    isBrakeEngaged,
    isStormMode,
  }
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
  isMaintenance: false,
  isReplaying: false,
  chartData: [],
  csvData: [],
  events: [],
  alerts: [],
  replayData: [],
  replayIndex: 0,
  replaySpeed: 1,
  replayRangeEnd: 0,

  setTargetWindSpeed: (speed: number) => {
    const state = get()
    if (state.isStormMode || state.isAutoProtected || state.isMaintenance) return
    set({ targetWindSpeed: Math.max(0, Math.min(25, speed)) })
  },

  setWindSpeed: (speed: number) => {
    set({ windSpeed: Math.max(0, Math.min(25, speed)) })
  },

  toggleStormMode: () => {
    set((state) => {
      if (state.isAutoProtected || state.isMaintenance) return state
      if (!state.isStormMode) {
        lastStormSpeed = state.windSpeed
        stormTimer = 0
        return {
          isStormMode: true,
          events: pushEvent(state.events, 'storm_on', '风暴模式已激活'),
          alerts: addDiscreteAlert(state.alerts, 'storm_on', 'warning', '风暴模式已激活'),
        }
      }
      return {
        isStormMode: false,
        targetWindSpeed: lastStormSpeed,
        events: pushEvent(state.events, 'storm_off', '风暴模式已关闭'),
        alerts: addDiscreteAlert(state.alerts, 'storm_off', 'warning', '风暴模式已关闭'),
      }
    })
  },

  toggleBrake: () => {
    set((state) => {
      if (
        (state.isAutoProtected && state.isBrakeEngaged) ||
        state.isMaintenance
      )
        return state
      const newBrake = !state.isBrakeEngaged
      return {
        isBrakeEngaged: newBrake,
        isAutoProtected: newBrake ? state.isAutoProtected : false,
        events: pushEvent(
          state.events,
          newBrake ? 'brake' : 'brake_release',
          newBrake ? '刹车已锁定' : '刹车已释放'
        ),
        alerts: addDiscreteAlert(
          state.alerts,
          newBrake ? 'brake' : 'brake_release',
          newBrake ? 'critical' : 'warning',
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
      events: pushEvent(state.events, 'manual_reset', '系统已手动复位'),
    })
    lastStormSpeed = 8
    stormTimer = 0
    chartSampleTimer = 0
    csvSampleTimer = 0
    replaySampleTimer = 0
    overwindTimer = 0
    overwindWasActive = false
  },

  acknowledgeAlert: (id: number) => {
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    }))
  },

  clearAcknowledgedAlerts: () => {
    set((state) => ({
      alerts: state.alerts.filter((a) => !a.acknowledged || a.active),
    }))
  },

  enterMaintenance: () => {
    set((state) => {
      if (state.isMaintenance || state.isReplaying) return state
      return {
        isMaintenance: true,
        isBrakeEngaged: true,
        isStormMode: false,
        isAutoProtected: false,
        events: pushEvent(state.events, 'maintenance_on', '进入维护/巡检模式'),
        alerts: addDiscreteAlert(state.alerts, 'maintenance_on', 'warning', '进入维护/巡检模式'),
      }
    })
    lastStormSpeed = 8
    stormTimer = 0
    overwindTimer = 0
  },

  exitMaintenance: () => {
    set((state) => {
      if (!state.isMaintenance) return state
      return {
        isMaintenance: false,
        isBrakeEngaged: false,
        events: pushEvent(state.events, 'maintenance_off', '退出维护/巡检模式，恢复正常运行'),
        alerts: addDiscreteAlert(
          state.alerts,
          'maintenance_off',
          'warning',
          '退出维护/巡检模式，恢复正常运行'
        ),
      }
    })
  },

  startReplay: (startOffset: number, duration: number) => {
    const state = get()
    const now = Date.now()
    const startTime = now - startOffset * 1000
    const endTime = startTime + duration * 1000

    const relevant = state.replayData.filter(
      (p) => p.timestamp >= startTime && p.timestamp <= endTime
    )

    if (relevant.length < 2) return

    set({
      isReplaying: true,
      replayIndex: 0,
      replaySpeed: 1,
      replayRangeEnd: endTime,
      events: pushEvent(state.events, 'replay_start', `开始历史回放 (最近${startOffset}s)`),
    })
  },

  stopReplay: () => {
    const state = get()
    set({
      isReplaying: false,
      replayIndex: 0,
      events: pushEvent(state.events, 'replay_end', '历史回放结束'),
    })
  },

  tickReplay: (deltaTime: number) => {
    const state = get()
    const { replayData, replayIndex, replaySpeed } = state

    if (replayIndex >= replayData.length - 1) {
      set({ isReplaying: false, replayIndex: 0 })
      return
    }

    const advance = replaySpeed * 0.3
    const newIndex = Math.min(replayIndex + advance, replayData.length - 1)

    const point = replayData[Math.floor(newIndex)]

    set({
      replayIndex: newIndex,
      windSpeed: point.windSpeed,
      rotorSpeed: point.rotorSpeed,
      powerOutput: point.powerOutput,
      isBrakeEngaged: point.isBrakeEngaged,
      isStormMode: point.isStormMode,
    })
  },

  updateSimulation: (deltaTime: number) => {
    const state = get()

    if (state.isReplaying) {
      state.tickReplay(deltaTime)
      return
    }

    let newWindSpeed = state.windSpeed

    if (state.isStormMode) {
      stormTimer += deltaTime
      if (stormTimer >= 1 / STORM_CHANGE_RATE) {
        stormTimer = 0
        lastStormSpeed = 5 + Math.random() * 20
      }
      newWindSpeed += (lastStormSpeed - newWindSpeed) * Math.min(deltaTime * 3, 1)
    } else {
      const diff = state.targetWindSpeed - newWindSpeed
      newWindSpeed += diff * Math.min(deltaTime * WIND_SPEED_SMOOTHING, 1)
      if (Math.abs(diff) < 0.01) newWindSpeed = state.targetWindSpeed
    }

    let events = state.events
    let alerts = state.alerts
    let isBrakeEngaged = state.isBrakeEngaged
    let isAutoProtected = state.isAutoProtected

    if (!isBrakeEngaged && newWindSpeed >= OVERWIND_THRESHOLD) {
      overwindTimer += deltaTime
      const isOverwind = overwindTimer >= OVERWIND_DURATION

      if (overwindTimer > 0.1 && overwindTimer < 0.2 && !overwindWasActive) {
        overwindWasActive = true
        const result = mergeOverwindAlert(
          alerts,
          'warning',
          `过风速警告 (${newWindSpeed.toFixed(1)} m/s)`,
          true
        )
        alerts = result.alerts
        events = pushEvent(events, 'overwind_warning', `风速过高警告 (${newWindSpeed.toFixed(1)} m/s)`)
      }

      if (isOverwind && !isAutoProtected) {
        isBrakeEngaged = true
        isAutoProtected = true
        overwindTimer = 0
        const result = mergeOverwindAlert(
          alerts,
          'shutdown',
          `过风速保护停机 (${newWindSpeed.toFixed(1)} m/s ≥ ${OVERWIND_THRESHOLD} m/s)`,
          false
        )
        alerts = result.alerts
        events = pushEvent(events, 'auto_shutdown', `过风速保护触发，自动停机`)
      }
    } else {
      if (newWindSpeed < OVERWIND_THRESHOLD - 1 && overwindWasActive) {
        overwindWasActive = false
        const result = mergeOverwindAlert(alerts, 'shutdown', '', false)
        alerts = result.alerts
      }
      overwindTimer = Math.max(0, overwindTimer - deltaTime * 2)
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

    const point = makeDataPoint(
      newWindSpeed,
      powerOutput,
      rotorSpeed,
      isBrakeEngaged,
      state.isStormMode
    )

    chartSampleTimer += deltaTime
    let chartData = state.chartData
    if (chartSampleTimer >= CHART_SAMPLE_INTERVAL) {
      chartSampleTimer -= CHART_SAMPLE_INTERVAL
      chartData = [...chartData, point]
      const cutoff = Date.now() - CHART_WINDOW_SECONDS * 1000
      chartData = chartData.filter((p) => p.timestamp > cutoff)
    }

    csvSampleTimer += deltaTime
    let csvData = state.csvData
    if (csvSampleTimer >= CSV_SAMPLE_INTERVAL) {
      csvSampleTimer -= CSV_SAMPLE_INTERVAL
      csvData = [...csvData, point]
      const cutoff = Date.now() - CSV_WINDOW_SECONDS * 1000
      csvData = csvData.filter((p) => p.timestamp > cutoff)
    }

    replaySampleTimer += deltaTime
    let replayData = state.replayData
    if (replaySampleTimer >= REPLAY_SAMPLE_INTERVAL) {
      replaySampleTimer -= REPLAY_SAMPLE_INTERVAL
      replayData = [...replayData, point]
      const cutoff = Date.now() - REPLAY_BUFFER_SECONDS * 1000
      replayData = replayData.filter((p) => p.timestamp > cutoff)
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
      alerts,
      chartData,
      csvData,
      replayData,
    })
  },

  getRecentPowerData: (seconds: number) => {
    const cutoff = Date.now() - seconds * 1000
    return get()
      .replayData.filter((p) => p.timestamp > cutoff)
  },
}))
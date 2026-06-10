export interface TurbineState {
  windSpeed: number
  targetWindSpeed: number
  rotorSpeed: number
  powerOutput: number
  totalEnergy: number
  windDirection: number
  yawAngle: number
  isBrakeEngaged: boolean
  isStormMode: boolean
  isNacelleView: boolean
}

export interface PowerDataPoint {
  timestamp: number
  windSpeed: number
  powerOutput: number
  rotorSpeed: number
}

export const WIND_SPEED_MIN = 0
export const WIND_SPEED_MAX = 25
export const CUT_IN_SPEED = 3
export const RATED_SPEED = 12
export const CUT_OUT_SPEED = 25
export const RATED_POWER = 2500

export const ROTOR_RADIUS = 45
export const AIR_DENSITY = 1.225
export const SWEPT_AREA = Math.PI * ROTOR_RADIUS * ROTOR_RADIUS
export const MAX_CP = 0.45
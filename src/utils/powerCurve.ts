import {
  CUT_IN_SPEED,
  RATED_SPEED,
  CUT_OUT_SPEED,
  RATED_POWER,
  AIR_DENSITY,
  SWEPT_AREA,
  MAX_CP,
} from '../types/turbine'

export function calculatePowerOutput(windSpeed: number): number {
  if (windSpeed < CUT_IN_SPEED) return 0
  if (windSpeed >= CUT_OUT_SPEED) return 0
  if (windSpeed >= RATED_SPEED) return RATED_POWER

  const cp = MAX_CP
  const rawPower = 0.5 * AIR_DENSITY * SWEPT_AREA * cp * Math.pow(windSpeed, 3)
  return Math.min(rawPower / 1000, RATED_POWER)
}

export function calculateRotorSpeed(windSpeed: number, isBrakeEngaged: boolean): number {
  if (isBrakeEngaged) return 0
  if (windSpeed < CUT_IN_SPEED) return 0

  const tipSpeedRatio = 7
  const rotorRadius = 45
  const rpm = (windSpeed * tipSpeedRatio * 60) / (2 * Math.PI * rotorRadius)
  const maxRPM = 20
  return Math.min(rpm, maxRPM)
}
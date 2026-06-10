import { PowerDataPoint } from '../types/turbine'

export function exportCSV(data: PowerDataPoint[]): void {
  const header = 'Timestamp,WindSpeed(m/s),PowerOutput(kW),RotorSpeed(RPM)'
  const rows = data.map((point) => {
    const time = new Date(point.timestamp).toISOString()
    return `${time},${point.windSpeed.toFixed(2)},${point.powerOutput.toFixed(2)},${point.rotorSpeed.toFixed(2)}`
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `wind_turbine_data_${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
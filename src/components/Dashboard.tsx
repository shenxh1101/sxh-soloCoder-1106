import { useTurbineStore } from '../store/useTurbineStore'
import { TrendChart } from './TrendChart'

export function Dashboard() {
  const powerOutput = useTurbineStore((s) => s.powerOutput)
  const rotorSpeed = useTurbineStore((s) => s.rotorSpeed)
  const totalEnergy = useTurbineStore((s) => s.totalEnergy)
  const windSpeed = useTurbineStore((s) => s.windSpeed)
  const isBrakeEngaged = useTurbineStore((s) => s.isBrakeEngaged)

  const powerPercent = Math.min((powerOutput / 2500) * 100, 100)
  const circumference = 2 * Math.PI * 52
  const strokeDashoffset = circumference - (powerPercent / 100) * circumference

  return (
    <div className="dashboard">
      <div className="dashboard-card power-card">
        <div className="card-header">
          <span className="card-label">功率输出</span>
          <span className="card-unit">kW</span>
        </div>
        <div className="power-display">
          <svg className="power-ring" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="6"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={isBrakeEngaged ? '#ff4444' : '#00e5ff'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              className="power-ring-progress"
            />
          </svg>
          <div className="power-value">
            <span className="power-number">{powerOutput.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <TrendChart />

      <div className="dashboard-card">
        <div className="card-header">
          <span className="card-label">转子转速</span>
          <span className="card-unit">RPM</span>
        </div>
        <div className="metric-value">
          <span className="metric-number">{rotorSpeed.toFixed(1)}</span>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <span className="card-label">累计发电量</span>
          <span className="card-unit">kWh</span>
        </div>
        <div className="metric-value">
          <span className="metric-number">{totalEnergy.toFixed(2)}</span>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <span className="card-label">当前风速</span>
          <span className="card-unit">m/s</span>
        </div>
        <div className="metric-value">
          <span className="metric-number">{windSpeed.toFixed(1)}</span>
        </div>
      </div>
    </div>
  )
}
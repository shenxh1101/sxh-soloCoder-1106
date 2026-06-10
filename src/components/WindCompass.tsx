import { useTurbineStore } from '../store/useTurbineStore'

export function WindCompass() {
  const windDirection = useTurbineStore((s) => s.windDirection)
  const yawAngle = useTurbineStore((s) => s.yawAngle)

  const dirLabels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

  return (
    <div className="wind-compass">
      <div className="compass-title">风向</div>
      <div className="compass-rose">
        <svg viewBox="0 0 120 120" className="compass-svg">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {dirLabels.map((label, i) => {
            const angle = (i * 45 * Math.PI) / 180 - Math.PI / 2
            const cx = 60 + 48 * Math.cos(angle)
            const cy = 60 + 48 * Math.sin(angle)
            return (
              <text
                key={label}
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                className="compass-label"
              >
                {label}
              </text>
            )
          })}
          <line
            x1="60"
            y1="10"
            x2="60"
            y2="20"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />

          <g transform={`rotate(${windDirection - 90} 60 60)`}>
            <polygon
              points="60,8 56,20 64,20"
              fill="#00e5ff"
            />
            <polygon
              points="60,112 56,100 64,100"
              fill="rgba(255,255,255,0.3)"
            />
          </g>

          <g transform={`rotate(${yawAngle - 90} 60 60)`}>
            <polygon
              points="60,10 58,18 62,18"
              fill="#ff6d00"
              opacity="0.8"
            />
          </g>

          <circle cx="60" cy="60" r="3" fill="rgba(255,255,255,0.4)" />
        </svg>
        <div className="compass-degree">{windDirection.toFixed(0)}°</div>
      </div>
      <div className="compass-legend">
        <span className="legend-item">
          <span className="legend-dot wind-dot" /> 风向
        </span>
        <span className="legend-item">
          <span className="legend-dot yaw-dot" /> 偏航
        </span>
      </div>
    </div>
  )
}
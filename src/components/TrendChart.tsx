import { useMemo } from 'react'
import { useTurbineStore } from '../store/useTurbineStore'
import { PowerDataPoint } from '../types/turbine'

function buildSvgPath(
  data: PowerDataPoint[],
  key: 'powerOutput' | 'windSpeed',
  maxY: number,
  chartW: number,
  chartH: number,
  timeMin: number,
  timeRange: number
): string {
  if (data.length < 2) return ''
  const xScale = (ts: number) => ((ts - timeMin) / timeRange) * chartW
  const yScale = (v: number) => chartH - (v / maxY) * chartH
  const points = data.map(
    (p) => `${xScale(p.timestamp)},${yScale(p[key])}`
  )
  return `M${points.join(' L')}`
}

function buildFillPath(path: string, chartH: number, chartW: number): string {
  return `${path} L${chartW},${chartH} L0,${chartH} Z`
}

export function TrendChart() {
  const chartData = useTurbineStore((s) => s.chartData)
  const powerOutput = useTurbineStore((s) => s.powerOutput)
  const windSpeed = useTurbineStore((s) => s.windSpeed)
  const isBrakeEngaged = useTurbineStore((s) => s.isBrakeEngaged)

  const chartW = 280
  const chartH = 100
  const pad = { top: 8, right: 8, bottom: 16, left: 8 }
  const plotW = chartW - pad.left - pad.right
  const plotH = chartH - pad.top - pad.bottom

  const { powerPath, powerFill, windPath, windFill, yLabels, xLabels } = useMemo(() => {
    if (chartData.length < 2) {
      return { powerPath: '', powerFill: '', windPath: '', windFill: '', yLabels: [], xLabels: [] }
    }

    const now = Date.now()
    const timeRange = 120 * 1000
    const timeMin = now - timeRange

    const powerMax = 3000
    const windMax = 30

    const powerPath = buildSvgPath(chartData, 'powerOutput', powerMax, plotW, plotH, timeMin, timeRange)
    const powerFill = buildFillPath(powerPath, plotH, plotW)
    const windPath = buildSvgPath(chartData, 'windSpeed', windMax, plotW, plotH, timeMin, timeRange)
    const windFill = buildFillPath(windPath, plotH, plotW)

    const yLabels = [
      { y: pad.top, label: '2500' },
      { y: pad.top + plotH / 2, label: '1250' },
      { y: pad.top + plotH, label: '0' },
    ]

    const totalSeconds = 120
    const xLabels = [
      { x: pad.left, label: '-120s' },
      { x: pad.left + plotW / 2, label: '-60s' },
      { x: pad.left + plotW, label: 'now' },
    ]

    return { powerPath, powerFill, windPath, windFill, yLabels, xLabels }
  }, [chartData])

  return (
    <div className="trend-chart-card">
      <div className="trend-chart-header">
        <span className="trend-chart-title">实时趋势 · 最近2分钟</span>
        <div className="trend-chart-legend">
          <span className="legend-line power-legend">
            <span className="legend-dot-line" style={{ background: '#00e5ff' }} />
            功率
          </span>
          <span className="legend-line wind-legend">
            <span className="legend-dot-line" style={{ background: '#ff6d00' }} />
            风速
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="trend-svg">
        {yLabels.map((yl, i) => (
          <g key={`yg-${i}`}>
            <line
              x1={pad.left}
              y1={yl.y}
              x2={pad.left + plotW}
              y2={yl.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <text
              x={pad.left - 2}
              y={yl.y + 3}
              textAnchor="end"
              className="chart-axis-label"
            >
              {yl.label}
            </text>
          </g>
        ))}

        {xLabels.map((xl, i) => (
          <text
            key={`xg-${i}`}
            x={xl.x}
            y={chartH - 2}
            textAnchor="middle"
            className="chart-axis-label"
          >
            {xl.label}
          </text>
        ))}

        <clipPath id="plotClip">
          <rect x={pad.left} y={pad.top} width={plotW} height={plotH} />
        </clipPath>

        {powerFill && (
          <g clipPath="url(#plotClip)">
            <path
              d={powerFill}
              fill="url(#powerGrad)"
              opacity="0.15"
            />
          </g>
        )}
        {powerPath && (
          <g clipPath="url(#plotClip)">
            <path
              d={powerPath}
              fill="none"
              stroke="#00e5ff"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              className="chart-line"
            />
          </g>
        )}

        {windFill && (
          <g clipPath="url(#plotClip)">
            <path
              d={windFill}
              fill="url(#windGrad)"
              opacity="0.08"
            />
          </g>
        )}
        {windPath && (
          <g clipPath="url(#plotClip)">
            <path
              d={windPath}
              fill="none"
              stroke="#ff6d00"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
              className="chart-line"
            />
          </g>
        )}

        <defs>
          <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6d00" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff6d00" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <text
          x={pad.left + 4}
          y={pad.top + plotH - 8}
          className="chart-live-value power-live"
        >
          {powerOutput.toFixed(0)} kW
        </text>
        <text
          x={pad.left + 4}
          y={pad.top + plotH - 22}
          className="chart-live-value wind-live"
        >
          {windSpeed.toFixed(1)} m/s
        </text>

        {isBrakeEngaged && (
          <rect
            x={pad.left}
            y={pad.top}
            width={plotW}
            height={plotH}
            fill="rgba(255,0,0,0.04)"
            rx="2"
          />
        )}
      </svg>
      <div className="chart-unit-row">
        <span className="chart-unit-label">功率 (kW) 左轴</span>
        <span className="chart-unit-label">风速 (m/s) 右轴</span>
      </div>
    </div>
  )
}
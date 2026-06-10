import { useMemo } from 'react'
import { Play } from 'lucide-react'
import { useTurbineStore } from '../store/useTurbineStore'
import { PowerDataPoint } from '../types/turbine'

function buildSvgPath(
  data: PowerDataPoint[],
  key: 'powerOutput' | 'windSpeed',
  maxY: number,
  chartW: number,
  timeMin: number,
  timeRange: number,
  padLeft: number,
  padTop: number,
  plotW: number,
  plotH: number
): string {
  if (data.length < 2) return ''
  const xScale = (ts: number) => padLeft + ((ts - timeMin) / timeRange) * plotW
  const yScale = (v: number) => padTop + plotH - (v / maxY) * plotH
  const points = data.map(
    (p) => `${xScale(p.timestamp)},${yScale(p[key])}`
  )
  return `M${points.join(' L')}`
}

export function TrendChart({
  onReplayChart,
}: {
  onReplayChart?: (startOffset: number, duration: number) => void
}) {
  const chartData = useTurbineStore((s) => s.chartData)
  const powerOutput = useTurbineStore((s) => s.powerOutput)
  const windSpeed = useTurbineStore((s) => s.windSpeed)
  const isBrakeEngaged = useTurbineStore((s) => s.isBrakeEngaged)
  const isReplaying = useTurbineStore((s) => s.isReplaying)
  const replayIndex = useTurbineStore((s) => s.replayIndex)
  const replayWindow = useTurbineStore((s) => s.replayWindow)

  const chartW = 300
  const chartH = 120
  const pad = { top: 10, right: 4, bottom: 20, left: 35 }
  const plotW = chartW - pad.left - pad.right
  const plotH = chartH - pad.top - pad.bottom

  const displayData = isReplaying
    ? replayWindow.slice(0, Math.floor(replayIndex) + 1)
    : chartData

  const { powerPath, windPath, yLabels, brakeRects } = useMemo(() => {
    if (displayData.length < 2) {
      const yLabels = [
        { y: pad.top, label: '2500' },
        { y: pad.top + plotH * 0.5, label: '1250' },
        { y: pad.top + plotH, label: '0' },
      ]
      return { powerPath: '', windPath: '', yLabels, brakeRects: [] as { x: number; w: number }[] }
    }

    const now = Date.now()
    const timeRange = 120 * 1000
    const timeMin = isReplaying
      ? displayData[0].timestamp
      : now - timeRange

    const powerMax = 3000
    const windMax = 30

    const powerPath = buildSvgPath(
      displayData, 'powerOutput', powerMax, chartW,
      timeMin, timeRange, pad.left, pad.top, plotW, plotH
    )
    const windPath = buildSvgPath(
      displayData, 'windSpeed', windMax, chartW,
      timeMin, timeRange, pad.left, pad.top, plotW, plotH
    )

    const yLabels = [
      { y: pad.top, label: '2500' },
      { y: pad.top + plotH * 0.5, label: '1250' },
      { y: pad.top + plotH, label: '0' },
    ]

    const xScale = (ts: number) => pad.left + ((ts - timeMin) / timeRange) * plotW
    const brakeRects: { x: number; w: number }[] = []
    let brakeStart = -1
    for (let i = 0; i < displayData.length; i++) {
      if (displayData[i].isBrakeEngaged && brakeStart < 0) {
        brakeStart = displayData[i].timestamp
      } else if (!displayData[i].isBrakeEngaged && brakeStart >= 0) {
        brakeRects.push({
          x: xScale(brakeStart),
          w: Math.max(xScale(displayData[i].timestamp) - xScale(brakeStart), 1),
        })
        brakeStart = -1
      }
    }
    if (brakeStart >= 0) {
      const endTs = displayData[displayData.length - 1].timestamp
      brakeRects.push({
        x: xScale(brakeStart),
        w: Math.max(xScale(endTs) - xScale(brakeStart), 1),
      })
    }

    return { powerPath, windPath, yLabels, brakeRects }
  }, [displayData, isReplaying])

  const handleReplayChart = () => {
    if (onReplayChart) onReplayChart(120, 30)
  }

  return (
    <div className="trend-chart-card">
      <div className="trend-chart-header">
        <span className="trend-chart-title">
          {isReplaying ? '⏪ 历史回放' : '实时趋势 · 最近2分钟'}
        </span>
        <div className="trend-chart-legend">
          <span className="legend-line power-legend">
            <span className="legend-dot-line" style={{ background: '#00e5ff' }} />
            功率
          </span>
          <span className="legend-line wind-legend">
            <span className="legend-dot-line" style={{ background: '#ff6d00' }} />
            风速
          </span>
          {!isReplaying && onReplayChart && (
            <button className="chart-replay-btn" onClick={handleReplayChart} title="回放此段趋势">
              <Play size={10} />
              <span>回放</span>
            </button>
          )}
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
              stroke={
                i === yLabels.length - 1
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.05)'
              }
              strokeWidth={i === yLabels.length - 1 ? '1' : '0.5'}
            />
            <text
              x={pad.left - 4}
              y={yl.y + 3}
              textAnchor="end"
              className="chart-axis-label"
            >
              {yl.label}
            </text>
          </g>
        ))}

        <text x={pad.left + plotW / 2} y={chartH - 2} textAnchor="middle" className="chart-axis-label">-120s</text>
        <text x={pad.left + plotW} y={chartH - 2} textAnchor="end" className="chart-axis-label">now</text>

        <clipPath id="plotClip3">
          <rect x={pad.left - 2} y={pad.top - 2} width={plotW + 4} height={plotH + 4} />
        </clipPath>

        {brakeRects.map((br, i) => (
          <g clipPath="url(#plotClip3)" key={`br-${i}`}>
            <rect x={br.x} y={pad.top} width={br.w} height={plotH} fill="rgba(255,68,68,0.06)" />
          </g>
        ))}

        {windPath && (
          <g clipPath="url(#plotClip3)">
            <path d={windPath} fill="none" stroke="#ff6d00" strokeWidth="1.2" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" className="chart-line" />
          </g>
        )}

        {powerPath && (
          <g clipPath="url(#plotClip3)">
            <path d={powerPath} fill="none" stroke="#00e5ff" strokeWidth="1.8" vectorEffect="non-scaling-stroke" className="chart-line" />
            <path d={`${powerPath} L${pad.left + plotW},${pad.top + plotH} L${pad.left},${pad.top + plotH} Z`} fill="url(#powerGrad3)" opacity="0.12" />
          </g>
        )}

        <defs>
          <linearGradient id="powerGrad3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <text x={pad.left + 4} y={pad.top + plotH - 6} className="chart-live-value power-live">{powerOutput.toFixed(0)} kW</text>
        <text x={pad.left + 4} y={pad.top + plotH - 20} className="chart-live-value wind-live">{windSpeed.toFixed(1)} m/s</text>
      </svg>
      <div className="chart-unit-row">
        <span className="chart-unit-label">功率 (kW)</span>
        <span className="chart-unit-label">风速 (m/s)</span>
      </div>
    </div>
  )
}
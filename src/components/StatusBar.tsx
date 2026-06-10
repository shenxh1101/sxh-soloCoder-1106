import { useTurbineStore } from '../store/useTurbineStore'

export function StatusBar() {
  const isStormMode = useTurbineStore((s) => s.isStormMode)
  const isBrakeEngaged = useTurbineStore((s) => s.isBrakeEngaged)
  const isNacelleView = useTurbineStore((s) => s.isNacelleView)
  const windDirection = useTurbineStore((s) => s.windDirection)

  const statuses: { label: string; active: boolean; color: string }[] = [
    {
      label: isStormMode ? '🌩️ 风暴模式' : '🌤️ 正常运行',
      active: isStormMode,
      color: isStormMode ? 'var(--color-warning)' : 'var(--color-accent)',
    },
    {
      label: isBrakeEngaged ? '🔴 刹车锁定' : '🟢 转子自由',
      active: isBrakeEngaged,
      color: isBrakeEngaged ? 'var(--color-danger)' : 'var(--color-success)',
    },
    {
      label: isNacelleView ? '📷 机舱视角' : '🎥 自由视角',
      active: isNacelleView,
      color: isNacelleView ? 'var(--color-accent)' : 'rgba(255,255,255,0.5)',
    },
  ]

  return (
    <div className="status-bar">
      {statuses.map((s, i) => (
        <div key={i} className="status-item" style={{ color: s.color }}>
          <span className="status-indicator" style={{ background: s.color }} />
          {s.label}
        </div>
      ))}
      <div className="status-item">
        <span className="status-indicator" style={{ background: 'rgba(255,255,255,0.3)' }} />
        风向 {windDirection.toFixed(0)}°
      </div>
    </div>
  )
}
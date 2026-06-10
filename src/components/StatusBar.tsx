import { useTurbineStore } from '../store/useTurbineStore'

export function StatusBar() {
  const isStormMode = useTurbineStore((s) => s.isStormMode)
  const isBrakeEngaged = useTurbineStore((s) => s.isBrakeEngaged)
  const isNacelleView = useTurbineStore((s) => s.isNacelleView)
  const isAutoProtected = useTurbineStore((s) => s.isAutoProtected)
  const isMaintenance = useTurbineStore((s) => s.isMaintenance)
  const isReplaying = useTurbineStore((s) => s.isReplaying)
  const windDirection = useTurbineStore((s) => s.windDirection)

  const statuses: { label: string; active: boolean; color: string }[] = []

  if (isReplaying) {
    statuses.push({
      label: '⏪ 历史回放中',
      active: true,
      color: '#ffaa00',
    })
  } else if (isMaintenance) {
    statuses.push({
      label: '🔧 维护模式',
      active: true,
      color: '#ffaa00',
    })
  } else if (isAutoProtected) {
    statuses.push({
      label: '🔴 保护停机',
      active: true,
      color: 'var(--color-danger)',
    })
  } else if (isBrakeEngaged) {
    statuses.push({
      label: '⏸ 刹车锁定',
      active: true,
      color: 'var(--color-warning)',
    })
  } else {
    statuses.push({
      label: isStormMode ? '🌩️ 风暴模式' : '🟢 正常运行',
      active: true,
      color: isStormMode ? 'var(--color-warning)' : 'var(--color-success)',
    })
  }

  statuses.push({
    label: isNacelleView ? '📷 机舱视角' : '🎥 自由视角',
    active: isNacelleView,
    color: isNacelleView ? 'var(--color-accent)' : 'rgba(255,255,255,0.5)',
  })

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
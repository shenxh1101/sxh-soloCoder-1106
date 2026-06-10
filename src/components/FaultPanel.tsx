import { ShieldAlert, RotateCcw, Clock } from 'lucide-react'
import { useTurbineStore } from '../store/useTurbineStore'

export function FaultPanel() {
  const events = useTurbineStore((s) => s.events)
  const isAutoProtected = useTurbineStore((s) => s.isAutoProtected)
  const isBrakeEngaged = useTurbineStore((s) => s.isBrakeEngaged)
  const windSpeed = useTurbineStore((s) => s.windSpeed)
  const manualReset = useTurbineStore((s) => s.manualReset)

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  }

  const eventClass = (type: string) => {
    switch (type) {
      case 'auto_shutdown':
      case 'overwind_warning':
        return 'event-danger'
      case 'brake':
      case 'brake_release':
        return 'event-warn'
      case 'storm_on':
      case 'storm_off':
        return 'event-storm'
      case 'manual_reset':
        return 'event-reset'
      default:
        return ''
    }
  }

  return (
    <div className="fault-panel">
      <div className="fault-header">
        <ShieldAlert size={16} />
        <span>保护与故障</span>
        {isAutoProtected && (
          <span className="fault-badge">保护中</span>
        )}
      </div>

      {isAutoProtected && (
        <div className="fault-alert">
          <div className="fault-alert-title">过风速保护已触发</div>
          <div className="fault-alert-desc">
            当前风速 {windSpeed.toFixed(1)} m/s，已超过 {22} m/s 阈值，转子已自动锁定。
          </div>
          <button className="reset-btn-primary" onClick={manualReset}>
            <RotateCcw size={14} />
            <span>手动复位</span>
          </button>
        </div>
      )}

      <div className="fault-event-log">
        <div className="event-log-title">
          <Clock size={12} />
          <span>事件记录</span>
        </div>
        <div className="event-list">
          {events.length === 0 && (
            <div className="event-empty">暂无事件记录</div>
          )}
          {events.slice(0, 20).map((ev) => (
            <div key={ev.id} className={`event-item ${eventClass(ev.type)}`}>
              <span className="event-time">{formatTime(ev.timestamp)}</span>
              <span className="event-msg">{ev.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
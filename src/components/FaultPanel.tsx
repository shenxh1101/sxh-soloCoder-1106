import { ShieldAlert, RotateCcw, Clock, CheckCheck, Trash2, Play } from 'lucide-react'
import { useTurbineStore } from '../store/useTurbineStore'

const levelColors: Record<string, string> = {
  warning: '#ff6d00',
  critical: '#ff4444',
  shutdown: '#ff1744',
}

const levelLabels: Record<string, string> = {
  warning: '警告',
  critical: '严重',
  shutdown: '停机',
}

export function FaultPanel({
  onReplayAlert,
}: {
  onReplayAlert?: (startOffset: number, duration: number) => void
}) {
  const alerts = useTurbineStore((s) => s.alerts)
  const isAutoProtected = useTurbineStore((s) => s.isAutoProtected)
  const windSpeed = useTurbineStore((s) => s.windSpeed)
  const manualReset = useTurbineStore((s) => s.manualReset)
  const acknowledgeAlert = useTurbineStore((s) => s.acknowledgeAlert)
  const acknowledgeAllAlerts = useTurbineStore((s) => s.acknowledgeAllAlerts)
  const clearAcknowledgedAlerts = useTurbineStore((s) => s.clearAcknowledgedAlerts)

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  }

  const activeCount = alerts.filter((a) => a.active).length
  const unacknowledgedActive = alerts.filter((a) => a.active && !a.acknowledged).length

  const handleReplayAlert = (alert: typeof alerts[0]) => {
    if (!onReplayAlert) return
    const duration = alert.endTime
      ? Math.max(15, Math.ceil((alert.endTime - alert.startTime) / 1000) + 10)
      : 30
    const offset = Math.max(
      30,
      Math.ceil((Date.now() - alert.startTime) / 1000) + 5
    )
    onReplayAlert(offset, duration)
  }

  return (
    <div className="fault-panel">
      <div className="fault-header">
        <ShieldAlert size={16} />
        <span>保护与故障</span>
        {activeCount > 0 && (
          <span className={`fault-badge ${unacknowledgedActive > 0 ? 'fault-badge-pulse' : ''}`}>
            {activeCount} 活跃
          </span>
        )}
      </div>

      {isAutoProtected && (
        <div className="fault-alert">
          <div className="fault-alert-title">过风速保护已触发</div>
          <div className="fault-alert-desc">
            当前风速 {windSpeed.toFixed(1)} m/s，已超过 22 m/s 阈值，转子已自动锁定。
          </div>
          <button className="reset-btn-primary" onClick={manualReset}>
            <RotateCcw size={14} />
            <span>手动复位</span>
          </button>
        </div>
      )}

      <div className="alert-section">
        <div className="alert-section-header">
          <Clock size={12} />
          <span>告警列表</span>
          <div className="alert-actions">
            {alerts.some((a) => a.active && !a.acknowledged) && (
              <button
                className="alert-action-btn alert-ack-all-btn"
                onClick={acknowledgeAllAlerts}
                title="确认全部活跃告警"
              >
                <CheckCheck size={11} />
              </button>
            )}
            <button
              className="alert-action-btn"
              onClick={clearAcknowledgedAlerts}
              title="清除已确认"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        <div className="alert-list">
          {alerts.length === 0 && (
            <div className="event-empty">暂无告警记录</div>
          )}
          {alerts.slice(0, 20).map((alert) => (
            <div
              key={alert.id}
              className={`alert-item ${alert.active ? 'alert-active' : ''} ${alert.acknowledged ? 'alert-ack' : ''}`}
            >
              <div className="alert-row">
                <span
                  className="alert-level-badge"
                  style={{ background: levelColors[alert.level] || '#888' }}
                >
                  {levelLabels[alert.level] || alert.level}
                </span>
                <span className="alert-start-time">
                  {formatTime(alert.startTime)}
                </span>
                {alert.active && <span className="alert-ongoing">进行中</span>}
                {alert.endTime && !alert.active && (
                  <span className="alert-resolved">已恢复</span>
                )}
              </div>
              <div className="alert-row alert-msg-row">
                <span className="alert-message">{alert.message}</span>
              </div>
              <div className="alert-action-row">
                {alert.active && !alert.acknowledged && (
                  <button
                    className="alert-ack-btn"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    <CheckCheck size={10} />
                    <span>确认</span>
                  </button>
                )}
                {alert.acknowledged && (
                  <span className="alert-ack-text">已确认</span>
                )}
                {onReplayAlert && alert.endTime && (
                  <button
                    className="alert-replay-btn"
                    onClick={() => handleReplayAlert(alert)}
                    title="回放该告警时段"
                  >
                    <Play size={10} />
                    <span>回放</span>
                  </button>
                )}
              </div>
              {alert.endTime && (
                <div className="alert-duration-row">
                  <span className="alert-end-time">{formatTime(alert.endTime)}</span>
                  <span className="alert-duration">
                    持续 {((alert.endTime - alert.startTime) / 1000).toFixed(0)}s
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipForward, SkipBack, X, History } from 'lucide-react'
import { useTurbineStore } from '../store/useTurbineStore'

export function ReplayControls() {
  const isReplaying = useTurbineStore((s) => s.isReplaying)
  const isMaintenance = useTurbineStore((s) => s.isMaintenance)
  const startReplay = useTurbineStore((s) => s.startReplay)
  const stopReplay = useTurbineStore((s) => s.stopReplay)
  const [showPanel, setShowPanel] = useState(false)
  const [startOffset, setStartOffset] = useState(120)
  const [duration, setDuration] = useState(30)
  const replaySpeedRef = useRef(1)

  useEffect(() => {
    if (!isReplaying) setShowPanel(false)
  }, [isReplaying])

  const handleStart = () => {
    startReplay(startOffset, duration)
  }

  const handleSpeed = (s: number) => {
    replaySpeedRef.current = s
    useTurbineStore.setState({ replaySpeed: s })
  }

  return (
    <>
      <button
        className="replay-toggle-btn"
        onClick={() => {
          if (isReplaying) {
            stopReplay()
          } else {
            setShowPanel(!showPanel)
          }
        }}
        disabled={isMaintenance}
        title="历史回放"
      >
        <History size={18} />
        <span>{isReplaying ? '停止回放' : '回放'}</span>
      </button>

      {showPanel && !isReplaying && (
        <div className="replay-panel">
          <div className="replay-panel-header">
            <History size={14} />
            <span>历史回放</span>
            <button className="replay-close" onClick={() => setShowPanel(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="replay-panel-body">
            <div className="replay-field">
              <label>回看范围</label>
              <select value={startOffset} onChange={(e) => setStartOffset(Number(e.target.value))}>
                <option value={60}>最近 1 分钟</option>
                <option value={120}>最近 2 分钟</option>
                <option value={300}>最近 5 分钟</option>
                <option value={600}>最近 10 分钟</option>
              </select>
            </div>
            <div className="replay-field">
              <label>回放时长</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                <option value={15}>15 秒</option>
                <option value={30}>30 秒</option>
                <option value={60}>60 秒</option>
                <option value={120}>120 秒</option>
              </select>
            </div>
            <button className="replay-start-btn" onClick={handleStart}>
              <Play size={14} />
              <span>开始回放</span>
            </button>
          </div>
        </div>
      )}

      {isReplaying && (
        <div className="replay-overlay">
          <div className="replay-overlay-badge">⏪ 历史回放中</div>
          <div className="replay-speed-controls">
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                className={`replay-speed-btn ${replaySpeedRef.current === s ? 'active' : ''}`}
                onClick={() => handleSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
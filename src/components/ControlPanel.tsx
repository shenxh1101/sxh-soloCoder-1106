import { Wind, Zap, Camera, Download, RotateCcw } from 'lucide-react'
import { useTurbineStore } from '../store/useTurbineStore'
import { exportCSV } from '../utils/csvExport'

export function ControlPanel() {
  const targetWindSpeed = useTurbineStore((s) => s.targetWindSpeed)
  const isStormMode = useTurbineStore((s) => s.isStormMode)
  const isBrakeEngaged = useTurbineStore((s) => s.isBrakeEngaged)
  const isNacelleView = useTurbineStore((s) => s.isNacelleView)
  const setTargetWindSpeed = useTurbineStore((s) => s.setTargetWindSpeed)
  const toggleStormMode = useTurbineStore((s) => s.toggleStormMode)
  const toggleBrake = useTurbineStore((s) => s.toggleBrake)
  const toggleNacelleView = useTurbineStore((s) => s.toggleNacelleView)
  const getRecentPowerData = useTurbineStore((s) => s.getRecentPowerData)

  const handleExportCSV = () => {
    const data = getRecentPowerData()
    if (data.length === 0) {
      return
    }
    exportCSV(data)
  }

  const handleReset = () => {
    useTurbineStore.setState({
      windSpeed: 8,
      targetWindSpeed: 8,
      rotorSpeed: 0,
      powerOutput: 0,
      totalEnergy: 0,
      windDirection: 180,
      yawAngle: 180,
      isBrakeEngaged: false,
      isStormMode: false,
      isNacelleView: false,
      powerDataHistory: [],
    })
  }

  const handleChangeWindDirection = () => {
    const newDir = Math.floor(Math.random() * 360)
    useTurbineStore.getState().setWindDirection(newDir)
  }

  return (
    <div className="control-panel">
      <div className="control-row">
        <div className="wind-speed-control">
          <label className="control-label">
            <Wind size={16} />
            <span>风速</span>
            <span className="speed-value">{targetWindSpeed.toFixed(0)} m/s</span>
          </label>
          <input
            type="range"
            min="0"
            max="25"
            step="0.5"
            value={targetWindSpeed}
            onChange={(e) => setTargetWindSpeed(parseFloat(e.target.value))}
            className="speed-slider"
            disabled={isStormMode}
          />
          <div className="speed-range-labels">
            <span>0</span>
            <span>25 m/s</span>
          </div>
        </div>

        <div className="controls-group">
          <button
            className={`control-btn storm-btn ${isStormMode ? 'active' : ''}`}
            onClick={toggleStormMode}
            title="风暴模式"
          >
            <Zap size={18} />
            <span>{isStormMode ? '退出风暴' : '风暴模式'}</span>
          </button>

          <button
            className={`control-btn brake-btn ${isBrakeEngaged ? 'active' : ''}`}
            onClick={toggleBrake}
            title={isBrakeEngaged ? '释放刹车' : '刹车'}
          >
            <span className="brake-icon">⏹</span>
            <span>{isBrakeEngaged ? '释放刹车' : '刹车'}</span>
          </button>

          <button
            className={`control-btn view-btn ${isNacelleView ? 'active' : ''}`}
            onClick={toggleNacelleView}
            title="机舱视角"
          >
            <Camera size={18} />
            <span>{isNacelleView ? '默认视角' : '机舱视角'}</span>
          </button>
        </div>

        <div className="controls-group">
          <button
            className="control-btn wind-dir-btn"
            onClick={handleChangeWindDirection}
            title="改变风向"
          >
            <span className="wind-dir-icon">🧭</span>
            <span>改变风向</span>
          </button>

          <button
            className="control-btn export-btn"
            onClick={handleExportCSV}
            title="导出CSV"
          >
            <Download size={18} />
            <span>导出CSV</span>
          </button>

          <button
            className="control-btn reset-btn"
            onClick={handleReset}
            title="重置"
          >
            <RotateCcw size={18} />
            <span>重置</span>
          </button>
        </div>
      </div>
    </div>
  )
}
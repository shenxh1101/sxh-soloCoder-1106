import { useState, useRef, useEffect, useCallback } from 'react'
import { Wind, Zap, Camera, Download, RotateCcw, Wrench } from 'lucide-react'
import { useTurbineStore } from '../store/useTurbineStore'
import { exportCSV } from '../utils/csvExport'
import { CSVTimeRange } from '../types/turbine'

export function ControlPanel({
  onReplayRequest,
}: {
  onReplayRequest?: React.Dispatch<React.SetStateAction<{ startOffset: number; duration: number } | null>>
}) {
  const targetWindSpeed = useTurbineStore((s) => s.targetWindSpeed)
  const isStormMode = useTurbineStore((s) => s.isStormMode)
  const isBrakeEngaged = useTurbineStore((s) => s.isBrakeEngaged)
  const isNacelleView = useTurbineStore((s) => s.isNacelleView)
  const isAutoProtected = useTurbineStore((s) => s.isAutoProtected)
  const isMaintenance = useTurbineStore((s) => s.isMaintenance)
  const isReplaying = useTurbineStore((s) => s.isReplaying)
  const setTargetWindSpeed = useTurbineStore((s) => s.setTargetWindSpeed)
  const toggleStormMode = useTurbineStore((s) => s.toggleStormMode)
  const toggleBrake = useTurbineStore((s) => s.toggleBrake)
  const toggleNacelleView = useTurbineStore((s) => s.toggleNacelleView)
  const getRecentPowerData = useTurbineStore((s) => s.getRecentPowerData)
  const manualReset = useTurbineStore((s) => s.manualReset)
  const enterMaintenance = useTurbineStore((s) => s.enterMaintenance)
  const exitMaintenance = useTurbineStore((s) => s.exitMaintenance)

  const [showCsvMenu, setShowCsvMenu] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(5)
  const [csvFeedback, setCsvFeedback] = useState('')
  const csvMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (csvMenuRef.current && !csvMenuRef.current.contains(e.target as Node)) {
        setShowCsvMenu(false)
        setCsvFeedback('')
      }
    }
    if (showCsvMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCsvMenu])

  useEffect(() => {
    if (csvFeedback) {
      const t = setTimeout(() => setCsvFeedback(''), 3000)
      return () => clearTimeout(t)
    }
  }, [csvFeedback])

  const doExport = useCallback(
    (range: CSVTimeRange, customSec?: number) => {
      let seconds: number
      let label: string
      if (range === '2min') {
        seconds = 120
        label = '2min'
      } else if (range === '10min') {
        seconds = 600
        label = '10min'
      } else {
        seconds = (customSec || 5) * 60
        label = `${customSec || 5}min`
      }
      const data = getRecentPowerData(seconds)
      if (data.length === 0) {
        setCsvFeedback('暂无足够数据，请先运行一段时间再导出')
        return
      }
      exportCSV(data, label)
      setCsvFeedback(`已导出 ${data.length} 条数据`)
    },
    [getRecentPowerData]
  )

  const handleExportCSV = (range: CSVTimeRange) => {
    if (range === 'custom') return
    doExport(range)
    setShowCsvMenu(false)
  }

  const handleCustomExport = () => {
    doExport('custom', customMinutes)
    setShowCsvMenu(false)
  }

  const handleChangeWindDirection = () => {
    const newDir = Math.floor(Math.random() * 360)
    useTurbineStore.getState().setWindDirection(newDir)
  }

  const controlsDisabled = isMaintenance || isReplaying

  return (
    <div className="control-panel">
      {isMaintenance && (
        <div className="maintenance-banner">
          <Wrench size={14} />
          <span>维护/巡检模式 — 所有控制已锁定</span>
          <button className="maintenance-exit-btn" onClick={exitMaintenance}>
            退出维护
          </button>
        </div>
      )}

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
            disabled={isStormMode || isAutoProtected || controlsDisabled}
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
            disabled={isAutoProtected || controlsDisabled}
            title="风暴模式"
          >
            <Zap size={18} />
            <span>{isStormMode ? '退出风暴' : '风暴模式'}</span>
          </button>

          <button
            className={`control-btn brake-btn ${isBrakeEngaged ? 'active' : ''}`}
            onClick={toggleBrake}
            disabled={controlsDisabled}
            title={
              isAutoProtected && isBrakeEngaged
                ? '保护锁定中，请先复位'
                : isBrakeEngaged
                  ? '释放刹车'
                  : '刹车'
            }
          >
            <span className="brake-icon">⏹</span>
            <span>{isBrakeEngaged ? '释放刹车' : '刹车'}</span>
          </button>

          <button
            className={`control-btn view-btn ${isNacelleView ? 'active' : ''}`}
            onClick={toggleNacelleView}
            disabled={controlsDisabled}
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
            disabled={controlsDisabled}
            title="改变风向"
          >
            <span className="wind-dir-icon">🧭</span>
            <span>改变风向</span>
          </button>

          <div className="csv-export-wrapper" ref={csvMenuRef}>
            <button
              className="control-btn export-btn"
              onClick={() => setShowCsvMenu(!showCsvMenu)}
              title="导出CSV"
              disabled={isReplaying}
            >
              <Download size={18} />
              <span>导出CSV</span>
            </button>
            {csvFeedback && <div className="csv-feedback">{csvFeedback}</div>}
            {showCsvMenu && (
              <div className="csv-menu">
                <button onClick={() => handleExportCSV('2min')}>最近 2 分钟 (2s间隔)</button>
                <button onClick={() => handleExportCSV('10min')}>最近 10 分钟 (1s间隔)</button>
                <div className="csv-custom-row">
                  <span className="csv-custom-label">自定义</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(1, Math.min(10, Number(e.target.value))))}
                    className="csv-custom-input"
                  />
                  <span className="csv-custom-unit">分钟</span>
                  <button className="csv-custom-btn" onClick={handleCustomExport}>
                    导出
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            className={`control-btn maintenance-btn ${isMaintenance ? 'active' : ''}`}
            onClick={isMaintenance ? exitMaintenance : enterMaintenance}
            disabled={isReplaying}
            title="维护模式"
          >
            <Wrench size={18} />
            <span>{isMaintenance ? '退出维护' : '维护'}</span>
          </button>

          <button
            className="control-btn reset-btn"
            onClick={manualReset}
            disabled={controlsDisabled}
            title="系统复位"
          >
            <RotateCcw size={18} />
            <span>复位</span>
          </button>
        </div>
      </div>
    </div>
  )
}
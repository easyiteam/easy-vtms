import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface TrajectoryPoint {
  mmsi: string
  vesselName?: string
  latitude: number
  longitude: number
  speed: number
  course: number
  heading?: number
  timestamp: Date
}

export interface TrajectoryStats {
  mmsi: string
  vesselName?: string
  totalPoints: number
  totalDistance: number // Nautical miles
  averageSpeed: number // Knots
  maxSpeed: number
  minSpeed: number
  duration: number // Minutes
  startTime: Date
  endTime: Date
}

export interface HeatmapPoint {
  latitude: number
  longitude: number
  count: number
}

export interface VesselWithTrajectory {
  mmsi: string
  vesselName?: string
  pointCount: number
}

export interface ReplayState {
  isPlaying: boolean
  currentIndex: number
  speed: number // 1x, 2x, 5x, 10x
  loop: boolean
}

export const useTrajectoryStore = defineStore('trajectory', () => {
  // State
  const trajectories = ref<Map<string, TrajectoryPoint[]>>(new Map())
  const currentTrajectory = ref<TrajectoryPoint[]>([])
  const trajectoryStats = ref<Map<string, TrajectoryStats>>(new Map())
  const heatmapData = ref<HeatmapPoint[]>([])
  const vesselsWithTrajectories = ref<VesselWithTrajectory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Replay state
  const replayState = ref<ReplayState>({
    isPlaying: false,
    currentIndex: 0,
    speed: 1,
    loop: false,
  })

  // Time range
  const timeRange = ref({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    end: new Date(),
  })

  // Computed
  const currentReplayPoint = computed(() => {
    if (currentTrajectory.value.length === 0) return null
    return currentTrajectory.value[replayState.value.currentIndex] || null
  })

  const replayProgress = computed(() => {
    if (currentTrajectory.value.length === 0) return 0
    return (replayState.value.currentIndex / (currentTrajectory.value.length - 1)) * 100
  })

  const hasTrajectory = computed(() => currentTrajectory.value.length > 0)

  // Actions

  /**
   * Fetch trajectory for a vessel
   */
  async function fetchTrajectory(
    mmsi: string,
    startTime?: Date,
    endTime?: Date,
    options?: {
      minSpeed?: number
      maxSpeed?: number
      limit?: number
      aggregated?: boolean
      interval?: number
    },
  ): Promise<TrajectoryPoint[]> {
    loading.value = true
    error.value = null

    try {
      const params: any = {}
      if (startTime) params.startTime = startTime.toISOString()
      if (endTime) params.endTime = endTime.toISOString()
      if (options?.minSpeed !== undefined) params.minSpeed = options.minSpeed
      if (options?.maxSpeed !== undefined) params.maxSpeed = options.maxSpeed
      if (options?.limit) params.limit = options.limit

      const endpoint = options?.aggregated
        ? `/api/trajectories/${mmsi}/aggregated`
        : `/api/trajectories/${mmsi}`

      if (options?.aggregated && options?.interval) {
        params.interval = options.interval
      }

      const response = await axios.get(`${API_BASE}${endpoint}`, { params })

      const points: TrajectoryPoint[] = response.data.points.map((p: any) => ({
        ...p,
        timestamp: new Date(p.timestamp),
      }))

      trajectories.value.set(mmsi, points)
      return points
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch trajectory statistics
   */
  async function fetchTrajectoryStats(
    mmsi: string,
    startTime?: Date,
    endTime?: Date,
  ): Promise<TrajectoryStats | null> {
    loading.value = true
    error.value = null

    try {
      const params: any = {}
      if (startTime) params.startTime = startTime.toISOString()
      if (endTime) params.endTime = endTime.toISOString()

      const response = await axios.get(`${API_BASE}/api/trajectories/${mmsi}/stats`, {
        params,
      })

      const stats: TrajectoryStats = {
        ...response.data.stats,
        startTime: new Date(response.data.stats.startTime),
        endTime: new Date(response.data.stats.endTime),
      }

      trajectoryStats.value.set(mmsi, stats)
      return stats
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch vessels with trajectory data
   */
  async function fetchVesselsWithTrajectories(startTime: Date, endTime: Date) {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get(`${API_BASE}/api/trajectories/vessels/list`, {
        params: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      })

      vesselsWithTrajectories.value = response.data.vessels
      return response.data.vessels
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch heatmap data
   */
  async function fetchHeatmapData(
    startTime: Date,
    endTime: Date,
    gridSize: number = 0.01,
  ) {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get(`${API_BASE}/api/trajectories/heatmap/data`, {
        params: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          gridSize,
        },
      })

      heatmapData.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Export trajectory to CSV
   */
  async function exportTrajectoryCSV(mmsi: string, startTime?: Date, endTime?: Date) {
    try {
      const params: any = {}
      if (startTime) params.startTime = startTime.toISOString()
      if (endTime) params.endTime = endTime.toISOString()

      const response = await axios.get(
        `${API_BASE}/api/trajectories/${mmsi}/export/csv`,
        {
          params,
          responseType: 'blob',
        },
      )

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `trajectory_${mmsi}_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message
      throw err
    }
  }

  /**
   * Load trajectory for replay
   */
  async function loadTrajectoryForReplay(
    mmsi: string,
    startTime?: Date,
    endTime?: Date,
  ) {
    const points = await fetchTrajectory(mmsi, startTime, endTime, {
      aggregated: true,
      interval: 1, // 1 minute intervals
    })

    currentTrajectory.value = points
    replayState.value.currentIndex = 0
    replayState.value.isPlaying = false

    return points
  }

  /**
   * Start replay
   */
  function startReplay() {
    if (currentTrajectory.value.length === 0) return

    replayState.value.isPlaying = true
    playReplay()
  }

  /**
   * Pause replay
   */
  function pauseReplay() {
    replayState.value.isPlaying = false
  }

  /**
   * Stop replay
   */
  function stopReplay() {
    replayState.value.isPlaying = false
    replayState.value.currentIndex = 0
  }

  /**
   * Set replay speed
   */
  function setReplaySpeed(speed: number) {
    replayState.value.speed = speed
  }

  /**
   * Toggle loop
   */
  function toggleLoop() {
    replayState.value.loop = !replayState.value.loop
  }

  /**
   * Seek to specific index
   */
  function seekTo(index: number) {
    if (index >= 0 && index < currentTrajectory.value.length) {
      replayState.value.currentIndex = index
    }
  }

  /**
   * Seek to percentage
   */
  function seekToPercent(percent: number) {
    const index = Math.floor((percent / 100) * (currentTrajectory.value.length - 1))
    seekTo(index)
  }

  /**
   * Play replay (internal)
   */
  function playReplay() {
    if (!replayState.value.isPlaying) return

    const baseInterval = 1000 // 1 second base
    const interval = baseInterval / replayState.value.speed

    setTimeout(() => {
      if (!replayState.value.isPlaying) return

      replayState.value.currentIndex++

      // Check if reached end
      if (replayState.value.currentIndex >= currentTrajectory.value.length) {
        if (replayState.value.loop) {
          replayState.value.currentIndex = 0
          playReplay()
        } else {
          pauseReplay()
        }
      } else {
        playReplay()
      }
    }, interval)
  }

  /**
   * Set time range
   */
  function setTimeRange(start: Date, end: Date) {
    timeRange.value = { start, end }
  }

  /**
   * Clear trajectory
   */
  function clearTrajectory(mmsi?: string) {
    if (mmsi) {
      trajectories.value.delete(mmsi)
      trajectoryStats.value.delete(mmsi)
    } else {
      trajectories.value.clear()
      trajectoryStats.value.clear()
      currentTrajectory.value = []
    }
  }

  /**
   * Clear heatmap
   */
  function clearHeatmap() {
    heatmapData.value = []
  }

  return {
    // State
    trajectories,
    currentTrajectory,
    trajectoryStats,
    heatmapData,
    vesselsWithTrajectories,
    loading,
    error,
    replayState,
    timeRange,

    // Computed
    currentReplayPoint,
    replayProgress,
    hasTrajectory,

    // Actions
    fetchTrajectory,
    fetchTrajectoryStats,
    fetchVesselsWithTrajectories,
    fetchHeatmapData,
    exportTrajectoryCSV,
    loadTrajectoryForReplay,
    startReplay,
    pauseReplay,
    stopReplay,
    setReplaySpeed,
    toggleLoop,
    seekTo,
    seekToPercent,
    setTimeRange,
    clearTrajectory,
    clearHeatmap,
  }
})

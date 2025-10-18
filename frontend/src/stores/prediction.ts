import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface PredictedPoint {
  latitude: number
  longitude: number
  timestamp: string
  speed: number
  course: number
  confidence: number
}

export interface TrajectoryPrediction {
  mmsi: string
  currentPosition: {
    latitude: number
    longitude: number
    timestamp: string
  }
  predictedPoints: PredictedPoint[]
  estimatedArrival?: {
    latitude: number
    longitude: number
    eta: string
    distance: number
  }
}

export interface AnomalyDetection {
  mmsi: string
  type: 'speed' | 'course' | 'drift' | 'signal_loss' | 'unusual_route'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  detectedAt: string
  currentValue?: number
  expectedValue?: number
  deviation?: number
}

export const usePredictionStore = defineStore('prediction', () => {
  // State
  const predictions = ref<Map<string, TrajectoryPrediction>>(new Map())
  const anomalies = ref<Map<string, AnomalyDetection[]>>(new Map())
  const activePrediction = ref<string | null>(null)
  const showPrediction = ref(false)

  // Computed
  const currentPrediction = computed(() => {
    if (!activePrediction.value) return null
    return predictions.value.get(activePrediction.value) || null
  })

  const hasPrediction = computed(() => {
    return activePrediction.value !== null && currentPrediction.value !== null
  })

  const totalAnomalies = computed(() => {
    let count = 0
    anomalies.value.forEach(list => {
      count += list.length
    })
    return count
  })

  const criticalAnomalies = computed(() => {
    const critical: AnomalyDetection[] = []
    anomalies.value.forEach(list => {
      critical.push(...list.filter(a => a.severity === 'critical'))
    })
    return critical
  })

  // Actions
  async function fetchPrediction(mmsi: string, minutes: number = 60, interval: number = 5) {
    try {
      const response = await axios.get<TrajectoryPrediction>(
        `${API_BASE}/api/predictions/${mmsi}/trajectory`,
        {
          params: { minutes, interval }
        }
      )
      
      predictions.value.set(mmsi, response.data)
      activePrediction.value = mmsi
      showPrediction.value = true
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch prediction:', error)
      throw error
    }
  }

  async function fetchETA(mmsi: string, destLat: number, destLon: number) {
    try {
      const response = await axios.get<TrajectoryPrediction>(
        `${API_BASE}/api/predictions/${mmsi}/eta`,
        {
          params: { lat: destLat, lon: destLon }
        }
      )
      
      predictions.value.set(mmsi, response.data)
      activePrediction.value = mmsi
      showPrediction.value = true
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch ETA:', error)
      throw error
    }
  }

  async function fetchAnomalies(mmsi: string) {
    try {
      const response = await axios.get<{
        mmsi: string
        anomaliesCount: number
        anomalies: AnomalyDetection[]
        timestamp: string
      }>(`${API_BASE}/api/predictions/${mmsi}/anomalies`)
      
      if (response.data.anomalies.length > 0) {
        anomalies.value.set(mmsi, response.data.anomalies)
      } else {
        anomalies.value.delete(mmsi)
      }
      
      return response.data.anomalies
    } catch (error) {
      console.error('Failed to fetch anomalies:', error)
      throw error
    }
  }

  function clearPrediction(mmsi?: string) {
    if (mmsi) {
      predictions.value.delete(mmsi)
      if (activePrediction.value === mmsi) {
        activePrediction.value = null
        showPrediction.value = false
      }
    } else {
      predictions.value.clear()
      activePrediction.value = null
      showPrediction.value = false
    }
  }

  function clearAnomalies(mmsi?: string) {
    if (mmsi) {
      anomalies.value.delete(mmsi)
    } else {
      anomalies.value.clear()
    }
  }

  function setActivePrediction(mmsi: string | null) {
    activePrediction.value = mmsi
    showPrediction.value = mmsi !== null
  }

  function togglePredictionVisibility() {
    showPrediction.value = !showPrediction.value
  }

  function dismissAnomaly(mmsi: string, index: number) {
    const vesselAnomalies = anomalies.value.get(mmsi)
    if (vesselAnomalies) {
      vesselAnomalies.splice(index, 1)
      if (vesselAnomalies.length === 0) {
        anomalies.value.delete(mmsi)
      }
    }
  }

  // Periodic anomaly checking
  let anomalyCheckInterval: number | null = null

  function startAnomalyMonitoring(vessels: string[], intervalMs: number = 30000) {
    if (anomalyCheckInterval) {
      stopAnomalyMonitoring()
    }

    const checkAnomalies = async () => {
      for (const mmsi of vessels) {
        try {
          await fetchAnomalies(mmsi)
        } catch (error) {
          console.error(`Failed to check anomalies for ${mmsi}:`, error)
        }
      }
    }

    // Check immediately
    checkAnomalies()

    // Then check periodically
    anomalyCheckInterval = window.setInterval(checkAnomalies, intervalMs)
  }

  function stopAnomalyMonitoring() {
    if (anomalyCheckInterval) {
      clearInterval(anomalyCheckInterval)
      anomalyCheckInterval = null
    }
  }

  return {
    // State
    predictions,
    anomalies,
    activePrediction,
    showPrediction,
    
    // Computed
    currentPrediction,
    hasPrediction,
    totalAnomalies,
    criticalAnomalies,
    
    // Actions
    fetchPrediction,
    fetchETA,
    fetchAnomalies,
    clearPrediction,
    clearAnomalies,
    setActivePrediction,
    togglePredictionVisibility,
    dismissAnomaly,
    startAnomalyMonitoring,
    stopAnomalyMonitoring,
  }
})

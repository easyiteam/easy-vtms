import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface WeatherData {
  location: {
    latitude: number
    longitude: number
    name?: string
  }
  current: {
    timestamp: string
    temperature: number
    feelsLike: number
    pressure: number
    humidity: number
    visibility: number
    windSpeed: number
    windDirection: number
    windGust?: number
    clouds: number
    weather: {
      id: number
      main: string
      description: string
      icon: string
    }
    rain?: number
    snow?: number
  }
  forecast?: WeatherForecast[]
}

export interface WeatherForecast {
  timestamp: string
  temperature: number
  feelsLike: number
  pressure: number
  humidity: number
  windSpeed: number
  windDirection: number
  clouds: number
  weather: {
    id: number
    main: string
    description: string
    icon: string
  }
  rain?: number
  snow?: number
  pop?: number
}

export interface WeatherAlert {
  type: 'wind' | 'visibility' | 'storm' | 'fog' | 'ice'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  affectedArea: {
    latitude: number
    longitude: number
    radius: number
  }
  validFrom: string
  validUntil: string
  recommendations: string[]
}

export interface MaritimeConditions {
  seaState: {
    waveHeight: number
    wavePeriod: number
    waveDirection: number
    description: string
  }
  visibility: {
    distance: number
    condition: 'excellent' | 'good' | 'moderate' | 'poor' | 'very_poor'
  }
  windConditions: {
    beaufortScale: number
    description: string
    isSafeForNavigation: boolean
  }
  warnings: string[]
}

export const useWeatherStore = defineStore('weather', () => {
  // State
  const currentWeather = ref<WeatherData | null>(null)
  const maritimeConditions = ref<MaritimeConditions | null>(null)
  const weatherAlerts = ref<WeatherAlert[]>([])
  const showWeatherWidget = ref(false)
  const showWeatherOverlay = ref(false)
  const loading = ref(false)

  // Computed
  const hasWeatherData = computed(() => currentWeather.value !== null)
  
  const hasActiveAlerts = computed(() => weatherAlerts.value.length > 0)
  
  const criticalAlerts = computed(() => 
    weatherAlerts.value.filter(a => a.severity === 'critical')
  )

  const windSpeedKnots = computed(() => {
    if (!currentWeather.value) return 0
    return currentWeather.value.current.windSpeed * 1.94384 // m/s to knots
  })

  const visibilityNM = computed(() => {
    if (!currentWeather.value) return 0
    return currentWeather.value.current.visibility / 1852 // meters to NM
  })

  // Actions
  async function fetchCurrentWeather(lat: number, lon: number) {
    loading.value = true
    try {
      const response = await axios.get<WeatherData>(
        `${API_BASE}/api/weather/current`,
        { params: { lat, lon } }
      )
      currentWeather.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to fetch weather:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchWeatherForecast(lat: number, lon: number, hours: number = 24) {
    loading.value = true
    try {
      const response = await axios.get<WeatherData>(
        `${API_BASE}/api/weather/forecast`,
        { params: { lat, lon, hours } }
      )
      currentWeather.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to fetch forecast:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchMaritimeConditions(lat: number, lon: number) {
    try {
      const response = await axios.get<MaritimeConditions>(
        `${API_BASE}/api/weather/maritime`,
        { params: { lat, lon } }
      )
      maritimeConditions.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to fetch maritime conditions:', error)
      throw error
    }
  }

  async function fetchWeatherAlerts(lat: number, lon: number) {
    try {
      const response = await axios.get<{
        location: { latitude: number; longitude: number }
        alertsCount: number
        alerts: WeatherAlert[]
        timestamp: string
      }>(`${API_BASE}/api/weather/alerts`, { params: { lat, lon } })
      
      weatherAlerts.value = response.data.alerts
      return response.data.alerts
    } catch (error) {
      console.error('Failed to fetch weather alerts:', error)
      throw error
    }
  }

  async function refreshWeatherData(lat: number, lon: number) {
    await Promise.all([
      fetchCurrentWeather(lat, lon),
      fetchMaritimeConditions(lat, lon),
      fetchWeatherAlerts(lat, lon),
    ])
  }

  function toggleWeatherWidget() {
    showWeatherWidget.value = !showWeatherWidget.value
  }

  function toggleWeatherOverlay() {
    showWeatherOverlay.value = !showWeatherOverlay.value
  }

  function clearWeatherData() {
    currentWeather.value = null
    maritimeConditions.value = null
    weatherAlerts.value = []
  }

  function dismissAlert(index: number) {
    weatherAlerts.value.splice(index, 1)
  }

  // Auto-refresh weather data
  let refreshInterval: number | null = null

  function startAutoRefresh(lat: number, lon: number, intervalMs: number = 600000) { // 10 minutes
    if (refreshInterval) {
      stopAutoRefresh()
    }

    // Initial fetch
    refreshWeatherData(lat, lon)

    // Then refresh periodically
    refreshInterval = window.setInterval(() => {
      refreshWeatherData(lat, lon)
    }, intervalMs)
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  return {
    // State
    currentWeather,
    maritimeConditions,
    weatherAlerts,
    showWeatherWidget,
    showWeatherOverlay,
    loading,
    
    // Computed
    hasWeatherData,
    hasActiveAlerts,
    criticalAlerts,
    windSpeedKnots,
    visibilityNM,
    
    // Actions
    fetchCurrentWeather,
    fetchWeatherForecast,
    fetchMaritimeConditions,
    fetchWeatherAlerts,
    refreshWeatherData,
    toggleWeatherWidget,
    toggleWeatherOverlay,
    clearWeatherData,
    dismissAlert,
    startAutoRefresh,
    stopAutoRefresh,
  }
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useWebSocketStore } from './websocket'

export enum AlertType {
  COLLISION_RISK = 'COLLISION_RISK',
  ZONE_VIOLATION = 'ZONE_VIOLATION',
  SPEED_VIOLATION = 'SPEED_VIOLATION',
  COURSE_DEVIATION = 'COURSE_DEVIATION',
  AIS_SIGNAL_LOST = 'AIS_SIGNAL_LOST',
  GROUNDING_RISK = 'GROUNDING_RISK',
  RESTRICTED_AREA = 'RESTRICTED_AREA',
  WEATHER_WARNING = 'WEATHER_WARNING',
}

export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title: string
  message: string
  vesselMmsi?: string
  vesselName?: string
  relatedVesselMmsi?: string
  relatedVesselName?: string
  latitude?: number
  longitude?: number
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  acknowledgedAt?: Date
  acknowledgedBy?: string
  resolvedAt?: Date
  resolvedBy?: string
  dismissedAt?: Date
  dismissedBy?: string
}

export interface CollisionRisk {
  vessel1: {
    mmsi: string
    name: string
    latitude: number
    longitude: number
    speed: number
    course: number
  }
  vessel2: {
    mmsi: string
    name: string
    latitude: number
    longitude: number
    speed: number
    course: number
  }
  cpa: number // Nautical miles
  tcpa: number // Minutes
  distance: number // Nautical miles
  bearing: number // Degrees
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  timestamp: Date
}

export const useAlertsStore = defineStore('alerts', () => {
  const wsStore = useWebSocketStore()

  // State
  const alerts = ref<Map<string, Alert>>(new Map())
  const collisionRisks = ref<CollisionRisk[]>([])
  const soundEnabled = ref(true)
  const notificationsEnabled = ref(true)

  // Computed
  const activeAlerts = computed(() => {
    return Array.from(alerts.value.values())
      .filter(alert => alert.status === AlertStatus.ACTIVE)
      .sort((a, b) => {
        // Sort by severity first
        const severityOrder = {
          [AlertSeverity.CRITICAL]: 5,
          [AlertSeverity.HIGH]: 4,
          [AlertSeverity.MEDIUM]: 3,
          [AlertSeverity.LOW]: 2,
          [AlertSeverity.INFO]: 1,
        }
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
        if (severityDiff !== 0) return severityDiff

        // Then by creation date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  })

  const criticalAlerts = computed(() => 
    activeAlerts.value.filter(a => a.severity === AlertSeverity.CRITICAL)
  )

  const highAlerts = computed(() => 
    activeAlerts.value.filter(a => a.severity === AlertSeverity.HIGH)
  )

  const alertCount = computed(() => activeAlerts.value.length)

  const criticalCount = computed(() => criticalAlerts.value.length)

  const alertStatistics = computed(() => ({
    total: alertCount.value,
    critical: criticalAlerts.value.length,
    high: highAlerts.value.length,
    medium: activeAlerts.value.filter(a => a.severity === AlertSeverity.MEDIUM).length,
    low: activeAlerts.value.filter(a => a.severity === AlertSeverity.LOW).length,
    info: activeAlerts.value.filter(a => a.severity === AlertSeverity.INFO).length,
  }))

  // Actions
  function addAlert(alert: Alert) {
    const existingAlert = alerts.value.get(alert.id)
    
    // If new alert, play sound
    if (!existingAlert && notificationsEnabled.value) {
      playAlertSound(alert.severity)
    }

    alerts.value.set(alert.id, {
      ...alert,
      createdAt: new Date(alert.createdAt),
      updatedAt: new Date(alert.updatedAt),
    })
  }

  function updateAlert(alert: Alert) {
    alerts.value.set(alert.id, {
      ...alert,
      createdAt: new Date(alert.createdAt),
      updatedAt: new Date(alert.updatedAt),
    })
  }

  function removeAlert(alertId: string) {
    alerts.value.delete(alertId)
  }

  function acknowledgeAlert(alertId: string) {
    if (wsStore.socket) {
      wsStore.socket.emit('alerts:acknowledge', { alertId })
    }
  }

  function resolveAlert(alertId: string) {
    if (wsStore.socket) {
      wsStore.socket.emit('alerts:resolve', { alertId })
    }
  }

  function dismissAlert(alertId: string) {
    if (wsStore.socket) {
      wsStore.socket.emit('alerts:dismiss', { alertId })
    }
  }

  function getAlerts() {
    if (wsStore.socket) {
      wsStore.socket.emit('alerts:get')
    }
  }

  function updateCollisionRisks(risks: CollisionRisk[]) {
    collisionRisks.value = risks.map(risk => ({
      ...risk,
      timestamp: new Date(risk.timestamp),
    }))
  }

  function playAlertSound(severity: AlertSeverity) {
    if (!soundEnabled.value) return

    const audio = new Audio()
    
    switch (severity) {
      case AlertSeverity.CRITICAL:
        // High-pitched urgent beep (3 beeps)
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGi77OafTRAMUKfj8LZjHAY4ktfyy3ksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Ik2CBhpu+zmn00QDFCn4/C2YxwGOJLX8st5LAUkd8fw3ZBAC'
        break
      case AlertSeverity.HIGH:
        // Medium-pitched warning beep (2 beeps)
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGi77OafTRAMUKfj8LZjHAY4ktfyy3ksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Ik2CBhpu+zmn00QDFCn4/C2YxwGOJLX8st5LAUkd8fw3ZBA'
        break
      default:
        // Low-pitched info beep (1 beep)
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGi77OafTRAMUKfj8LZjHAY4ktfyy3ksBSR3x/DdkEAK'
    }

    audio.play().catch(err => console.warn('Could not play alert sound:', err))
  }

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
  }

  function toggleNotifications() {
    notificationsEnabled.value = !notificationsEnabled.value
  }

  function getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '#dc2626' // red-600
      case AlertSeverity.HIGH:
        return '#f59e0b' // amber-500
      case AlertSeverity.MEDIUM:
        return '#eab308' // yellow-500
      case AlertSeverity.LOW:
        return '#3b82f6' // blue-500
      case AlertSeverity.INFO:
        return '#6b7280' // gray-500
      default:
        return '#6b7280'
    }
  }

  function getSeverityIcon(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '🚨'
      case AlertSeverity.HIGH:
        return '⚠️'
      case AlertSeverity.MEDIUM:
        return '⚡'
      case AlertSeverity.LOW:
        return 'ℹ️'
      case AlertSeverity.INFO:
        return '📋'
      default:
        return 'ℹ️'
    }
  }

  function getAlertTypeLabel(type: AlertType): string {
    const labels: Record<AlertType, string> = {
      [AlertType.COLLISION_RISK]: 'Collision Risk',
      [AlertType.ZONE_VIOLATION]: 'Zone Violation',
      [AlertType.SPEED_VIOLATION]: 'Speed Violation',
      [AlertType.COURSE_DEVIATION]: 'Course Deviation',
      [AlertType.AIS_SIGNAL_LOST]: 'AIS Signal Lost',
      [AlertType.GROUNDING_RISK]: 'Grounding Risk',
      [AlertType.RESTRICTED_AREA]: 'Restricted Area',
      [AlertType.WEATHER_WARNING]: 'Weather Warning',
    }
    return labels[type] || type
  }

  // Setup WebSocket listeners
  function setupListeners() {
    if (!wsStore.socket) return

    wsStore.socket.on('alerts:active', (activeAlerts: Alert[]) => {
      activeAlerts.forEach(alert => addAlert(alert))
    })

    wsStore.socket.on('alert:acknowledged', (alert: Alert) => {
      updateAlert(alert)
    })

    wsStore.socket.on('alert:resolved', (alert: Alert) => {
      removeAlert(alert.id)
    })

    wsStore.socket.on('alert:dismissed', (alert: Alert) => {
      removeAlert(alert.id)
    })

    wsStore.socket.on('collision:risks', (risks: CollisionRisk[]) => {
      updateCollisionRisks(risks)
    })

    // Request initial alerts
    getAlerts()
  }

  return {
    // State
    alerts,
    collisionRisks,
    soundEnabled,
    notificationsEnabled,

    // Computed
    activeAlerts,
    criticalAlerts,
    highAlerts,
    alertCount,
    criticalCount,
    alertStatistics,

    // Actions
    addAlert,
    updateAlert,
    removeAlert,
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,
    getAlerts,
    updateCollisionRisks,
    playAlertSound,
    toggleSound,
    toggleNotifications,
    getSeverityColor,
    getSeverityIcon,
    getAlertTypeLabel,
    setupListeners,
  }
})

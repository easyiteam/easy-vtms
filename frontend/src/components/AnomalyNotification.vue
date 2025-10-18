<template>
  <Transition name="slide-in">
    <div v-if="visible && anomaly" :class="['anomaly-notification', `severity-${anomaly.severity}`]">
      <div class="notification-icon">
        <svg v-if="anomaly.type === 'speed'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <svg v-else-if="anomaly.type === 'course'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <svg v-else-if="anomaly.type === 'drift'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <svg v-else-if="anomaly.type === 'signal_loss'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
        </svg>
        <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div class="notification-content">
        <div class="notification-header">
          <span class="notification-type">{{ formatType(anomaly.type) }}</span>
          <span class="notification-severity">{{ anomaly.severity.toUpperCase() }}</span>
        </div>
        <div class="notification-description">{{ anomaly.description }}</div>
        <div class="notification-meta">
          <span class="mmsi">MMSI: {{ anomaly.mmsi }}</span>
          <span class="time">{{ formatTime(anomaly.detectedAt) }}</span>
        </div>
      </div>

      <button @click="dismiss" class="dismiss-button">
        <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { AnomalyDetection } from '@/stores/prediction'

const props = defineProps<{
  anomaly: AnomalyDetection | null
  autoDismiss?: boolean
  dismissDelay?: number
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const visible = ref(false)

watch(() => props.anomaly, (newAnomaly) => {
  if (newAnomaly) {
    visible.value = true
    
    if (props.autoDismiss) {
      setTimeout(() => {
        visible.value = false
        setTimeout(() => emit('dismiss'), 300)
      }, props.dismissDelay || 5000)
    }
  } else {
    visible.value = false
  }
}, { immediate: true })

onMounted(() => {
  if (props.anomaly) {
    visible.value = true
  }
})

function formatType(type: string): string {
  const types: Record<string, string> = {
    speed: 'Speed Anomaly',
    course: 'Course Change',
    drift: 'Drift Detected',
    signal_loss: 'Signal Loss',
    unusual_route: 'Unusual Route'
  }
  return types[type] || type
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function dismiss() {
  visible.value = false
  setTimeout(() => emit('dismiss'), 300)
}
</script>

<style scoped>
.anomaly-notification {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(10, 36, 99, 0.95);
  backdrop-filter: blur(10px);
  border-left: 4px solid;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 350px;
  max-width: 450px;
}

.anomaly-notification.severity-low {
  border-color: #3b82f6;
}

.anomaly-notification.severity-medium {
  border-color: #f59e0b;
}

.anomaly-notification.severity-high {
  border-color: #ef4444;
}

.anomaly-notification.severity-critical {
  border-color: #dc2626;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5);
  }
}

.notification-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
}

.severity-low .notification-icon {
  color: #3b82f6;
}

.severity-medium .notification-icon {
  color: #f59e0b;
}

.severity-high .notification-icon {
  color: #ef4444;
}

.severity-critical .notification-icon {
  color: #dc2626;
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
}

.icon-sm {
  width: 1.25rem;
  height: 1.25rem;
}

.notification-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.notification-type {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.notification-severity {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.severity-low .notification-severity {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.severity-medium .notification-severity {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.severity-high .notification-severity {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.severity-critical .notification-severity {
  background: rgba(220, 38, 38, 0.2);
  color: #dc2626;
}

.notification-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

.notification-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.mmsi {
  font-weight: 500;
}

.dismiss-button {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.dismiss-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.3s ease;
}

.slide-in-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-in-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

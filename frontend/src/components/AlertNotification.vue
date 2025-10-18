<template>
  <Teleport to="body">
    <TransitionGroup name="notification" tag="div" class="notifications-container">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="[`severity-${notification.severity.toLowerCase()}`]"
        :style="{ borderLeftColor: getSeverityColor(notification.severity) }"
        @click="removeNotification(notification.id)"
      >
        <div class="notification-icon">
          {{ getSeverityIcon(notification.severity) }}
        </div>
        <div class="notification-content">
          <h4 class="notification-title">{{ notification.title }}</h4>
          <p class="notification-message">{{ notification.message }}</p>
        </div>
        <button @click.stop="removeNotification(notification.id)" class="notification-close">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAlertsStore, AlertSeverity, type Alert } from '@/stores/alerts'

const alertsStore = useAlertsStore()

interface Notification {
  id: string
  title: string
  message: string
  severity: AlertSeverity
}

const notifications = ref<Notification[]>([])
const notificationTimeout = 5000 // 5 seconds

// Watch for new alerts
watch(() => alertsStore.activeAlerts, (newAlerts, oldAlerts) => {
  if (!alertsStore.notificationsEnabled) return

  // Find new alerts
  const oldIds = new Set(oldAlerts.map(a => a.id))
  const newOnes = newAlerts.filter(a => !oldIds.has(a.id))

  // Show notifications for new alerts
  newOnes.forEach(alert => {
    showNotification(alert)
  })
}, { deep: true })

function showNotification(alert: Alert) {
  const notification: Notification = {
    id: alert.id,
    title: alert.title,
    message: alert.message,
    severity: alert.severity,
  }

  notifications.value.push(notification)

  // Auto-remove after timeout
  setTimeout(() => {
    removeNotification(notification.id)
  }, notificationTimeout)
}

function removeNotification(id: string) {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

function getSeverityColor(severity: AlertSeverity): string {
  return alertsStore.getSeverityColor(severity)
}

function getSeverityIcon(severity: AlertSeverity): string {
  return alertsStore.getSeverityIcon(severity)
}
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 76px;
  right: 1rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  pointer-events: none;
}

.notification {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(10, 36, 99, 0.98);
  backdrop-filter: blur(10px);
  border-left: 4px solid;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s;
}

.notification:hover {
  transform: translateX(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.notification-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.25rem 0;
}

.notification-message {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-close {
  flex-shrink: 0;
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: color 0.2s;
}

.notification-close:hover {
  color: white;
}

.icon {
  width: 1rem;
  height: 1rem;
}

/* Severity-specific styles */
.notification.severity-critical {
  animation: pulse-critical 1s infinite;
}

@keyframes pulse-critical {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
  }
  50% {
    box-shadow: 0 4px 20px rgba(220, 38, 38, 0.6);
  }
}

/* Transition animations */
.notification-enter-active {
  animation: slide-in 0.3s ease-out;
}

.notification-leave-active {
  animation: slide-out 0.3s ease-in;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>

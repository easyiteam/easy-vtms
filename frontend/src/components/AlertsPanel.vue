<template>
  <div class="alerts-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-left">
        <h3 class="panel-title">
          <span class="title-icon">🚨</span>
          Alerts
        </h3>
        <div class="alert-stats">
          <span v-if="alertsStore.criticalCount > 0" class="stat-badge critical">
            {{ alertsStore.criticalCount }} Critical
          </span>
          <span v-if="alertsStore.alertStatistics.high > 0" class="stat-badge high">
            {{ alertsStore.alertStatistics.high }} High
          </span>
        </div>
      </div>
      <div class="header-actions">
        <button 
          @click="alertsStore.toggleSound()" 
          class="icon-button"
          :title="alertsStore.soundEnabled ? 'Mute alerts' : 'Unmute alerts'"
        >
          <svg v-if="alertsStore.soundEnabled" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        </button>
        <button @click="$emit('close')" class="icon-button">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <button 
        v-for="severity in severityFilters" 
        :key="severity"
        @click="toggleFilter(severity)"
        :class="['filter-button', { active: activeFilters.includes(severity) }]"
        :style="{ borderColor: alertsStore.getSeverityColor(severity) }"
      >
        <span>{{ alertsStore.getSeverityIcon(severity) }}</span>
        <span>{{ severity }}</span>
        <span class="count">({{ getCountBySeverity(severity) }})</span>
      </button>
    </div>

    <!-- Alerts List -->
    <div class="alerts-list">
      <div v-if="filteredAlerts.length === 0" class="empty-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>No active alerts</p>
      </div>

      <TransitionGroup name="alert-list" tag="div">
        <div
          v-for="alert in filteredAlerts"
          :key="alert.id"
          class="alert-item"
          :class="[`severity-${alert.severity.toLowerCase()}`]"
          :style="{ borderLeftColor: alertsStore.getSeverityColor(alert.severity) }"
        >
          <div class="alert-header">
            <div class="alert-icon">
              {{ alertsStore.getSeverityIcon(alert.severity) }}
            </div>
            <div class="alert-info">
              <h4 class="alert-title">{{ alert.title }}</h4>
              <span class="alert-type">{{ alertsStore.getAlertTypeLabel(alert.type) }}</span>
            </div>
            <div class="alert-time">
              {{ formatTime(alert.createdAt) }}
            </div>
          </div>

          <div class="alert-body">
            <p class="alert-message">{{ alert.message }}</p>
            
            <div v-if="alert.vesselName" class="alert-vessels">
              <div class="vessel-tag">
                <svg class="icon-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {{ alert.vesselName }}
              </div>
              <div v-if="alert.relatedVesselName" class="vessel-tag">
                <svg class="icon-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {{ alert.relatedVesselName }}
              </div>
            </div>

            <div v-if="alert.metadata" class="alert-metadata">
              <div v-if="alert.metadata.cpa !== undefined" class="metadata-item">
                <span class="label">CPA:</span>
                <span class="value">{{ alert.metadata.cpa.toFixed(2) }} NM</span>
              </div>
              <div v-if="alert.metadata.tcpa !== undefined" class="metadata-item">
                <span class="label">TCPA:</span>
                <span class="value">{{ alert.metadata.tcpa.toFixed(1) }} min</span>
              </div>
              <div v-if="alert.metadata.distance !== undefined" class="metadata-item">
                <span class="label">Distance:</span>
                <span class="value">{{ alert.metadata.distance.toFixed(2) }} NM</span>
              </div>
            </div>
          </div>

          <div class="alert-actions">
            <button 
              v-if="alert.status === 'ACTIVE'"
              @click="alertsStore.acknowledgeAlert(alert.id)" 
              class="action-btn acknowledge"
            >
              <svg class="icon-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Acknowledge
            </button>
            <button 
              @click="alertsStore.resolveAlert(alert.id)" 
              class="action-btn resolve"
            >
              <svg class="icon-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resolve
            </button>
            <button 
              @click="alertsStore.dismissAlert(alert.id)" 
              class="action-btn dismiss"
            >
              <svg class="icon-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Dismiss
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAlertsStore, AlertSeverity } from '@/stores/alerts'

defineEmits<{
  close: []
}>()

const alertsStore = useAlertsStore()

const severityFilters = [
  AlertSeverity.CRITICAL,
  AlertSeverity.HIGH,
  AlertSeverity.MEDIUM,
  AlertSeverity.LOW,
]

const activeFilters = ref<AlertSeverity[]>([])

const filteredAlerts = computed(() => {
  if (activeFilters.value.length === 0) {
    return alertsStore.activeAlerts
  }
  return alertsStore.activeAlerts.filter(alert => 
    activeFilters.value.includes(alert.severity)
  )
})

function toggleFilter(severity: AlertSeverity) {
  const index = activeFilters.value.indexOf(severity)
  if (index > -1) {
    activeFilters.value.splice(index, 1)
  } else {
    activeFilters.value.push(severity)
  }
}

function getCountBySeverity(severity: AlertSeverity): number {
  return alertsStore.activeAlerts.filter(a => a.severity === severity).length
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.alerts-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(10, 36, 99, 0.98);
  color: white;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.title-icon {
  font-size: 1.25rem;
}

.alert-stats {
  display: flex;
  gap: 0.5rem;
}

.stat-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.stat-badge.critical {
  background: rgba(220, 38, 38, 0.2);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.4);
}

.stat-badge.high {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-button {
  padding: 0.375rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.icon {
  width: 1rem;
  height: 1rem;
}

.icon-xs {
  width: 0.875rem;
  height: 0.875rem;
}

.filters {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-button.active {
  background: rgba(255, 255, 255, 0.15);
  border-width: 2px;
}

.filter-button .count {
  color: rgba(255, 255, 255, 0.6);
}

.alerts-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
}

.alert-item {
  background: rgba(255, 255, 255, 0.05);
  border-left: 4px solid;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s;
}

.alert-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.alert-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-info {
  flex: 1;
}

.alert-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.alert-type {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.alert-time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.alert-body {
  margin-bottom: 0.75rem;
}

.alert-message {
  font-size: 0.875rem;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.alert-vessels {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.vessel-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(62, 146, 204, 0.2);
  border: 1px solid rgba(62, 146, 204, 0.4);
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.alert-metadata {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.metadata-item {
  display: flex;
  gap: 0.375rem;
  font-size: 0.75rem;
}

.metadata-item .label {
  color: rgba(255, 255, 255, 0.6);
}

.metadata-item .value {
  font-weight: 600;
}

.alert-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.acknowledge {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.4);
  color: #3b82f6;
}

.action-btn.acknowledge:hover {
  background: rgba(59, 130, 246, 0.2);
}

.action-btn.resolve {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.4);
  color: #10b981;
}

.action-btn.resolve:hover {
  background: rgba(16, 185, 129, 0.2);
}

.action-btn.dismiss {
  background: rgba(107, 114, 128, 0.1);
  border-color: rgba(107, 114, 128, 0.4);
  color: #6b7280;
}

.action-btn.dismiss:hover {
  background: rgba(107, 114, 128, 0.2);
}

/* Animations */
.alert-list-enter-active,
.alert-list-leave-active {
  transition: all 0.3s ease;
}

.alert-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.alert-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.alert-list-move {
  transition: transform 0.3s ease;
}
</style>

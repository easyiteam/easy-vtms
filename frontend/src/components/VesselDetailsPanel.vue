<template>
  <Transition name="slide">
    <div v-if="vessel && visible" class="vessel-details-panel">
      <!-- Header -->
      <div class="panel-header">
        <div class="header-content">
          <h2 class="vessel-name">{{ vessel.name }}</h2>
          <div class="vessel-type-badge" :style="{ backgroundColor: getNavigationStatusColor(vessel.navigationStatus || 15) }">
            {{ getVesselTypeName(vessel.vesselType || 0) }}
          </div>
        </div>
        <button @click="$emit('close')" class="close-button">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="panel-content">
        <!-- Identification Section -->
        <div class="detail-section">
          <h3 class="section-title">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            Identification
          </h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">MMSI</span>
              <span class="detail-value">{{ vessel.mmsi }}</span>
            </div>
            <div v-if="vessel.imoNumber" class="detail-item">
              <span class="detail-label">IMO Number</span>
              <span class="detail-value">{{ vessel.imoNumber }}</span>
            </div>
            <div v-if="vessel.callSign" class="detail-item">
              <span class="detail-label">Call Sign</span>
              <span class="detail-value">{{ vessel.callSign }}</span>
            </div>
          </div>
        </div>

        <!-- Vessel Characteristics -->
        <div class="detail-section">
          <h3 class="section-title">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Vessel Characteristics
          </h3>
          <div class="detail-grid">
            <div v-if="vessel.length" class="detail-item">
              <span class="detail-label">Length</span>
              <span class="detail-value">{{ vessel.length.toFixed(1) }} m</span>
            </div>
            <div v-if="vessel.width" class="detail-item">
              <span class="detail-label">Beam</span>
              <span class="detail-value">{{ vessel.width.toFixed(1) }} m</span>
            </div>
            <div v-if="vessel.height" class="detail-item">
              <span class="detail-label">Height</span>
              <span class="detail-value">{{ vessel.height.toFixed(1) }} m</span>
            </div>
            <div v-if="vessel.draught" class="detail-item">
              <span class="detail-label">Draught</span>
              <span class="detail-value">{{ vessel.draught.toFixed(1) }} m</span>
            </div>
          </div>
        </div>

        <!-- Navigation Status -->
        <div class="detail-section">
          <h3 class="section-title">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Navigation
          </h3>
          <div class="status-badge" :style="{ backgroundColor: getNavigationStatusColor(vessel.navigationStatus || 15) }">
            {{ getNavigationStatusName(vessel.navigationStatus || 15) }}
          </div>
          <div class="detail-grid mt-3">
            <div class="detail-item">
              <span class="detail-label">Speed</span>
              <span class="detail-value">{{ vessel.speed.toFixed(1) }} kts</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Course</span>
              <span class="detail-value">{{ vessel.course.toFixed(1) }}°</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Heading</span>
              <span class="detail-value">{{ vessel.heading }}°</span>
            </div>
            <div v-if="vessel.rateOfTurn" class="detail-item">
              <span class="detail-label">Rate of Turn</span>
              <span class="detail-value">{{ vessel.rateOfTurn.toFixed(1) }}°/min</span>
            </div>
          </div>
        </div>

        <!-- Position -->
        <div class="detail-section">
          <h3 class="section-title">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Position
          </h3>
          <div class="detail-grid">
            <div class="detail-item full-width">
              <span class="detail-label">Latitude</span>
              <span class="detail-value mono">{{ formatCoordinate(vessel.latitude, 'lat') }}</span>
            </div>
            <div class="detail-item full-width">
              <span class="detail-label">Longitude</span>
              <span class="detail-value mono">{{ formatCoordinate(vessel.longitude, 'lon') }}</span>
            </div>
            <div class="detail-item full-width">
              <span class="detail-label">Last Update</span>
              <span class="detail-value">{{ formatTimestamp(vessel.timestamp) }}</span>
            </div>
          </div>
        </div>

        <!-- Destination -->
        <div v-if="vessel.destination" class="detail-section">
          <h3 class="section-title">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Destination
          </h3>
          <div class="detail-grid">
            <div class="detail-item full-width">
              <span class="detail-label">Port</span>
              <span class="detail-value">{{ vessel.destination }}</span>
            </div>
            <div v-if="vessel.eta" class="detail-item full-width">
              <span class="detail-label">ETA</span>
              <span class="detail-value">{{ formatETA(vessel.eta) }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="detail-section">
          <h3 class="section-title">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Actions
          </h3>
          <div class="action-buttons">
            <button @click="$emit('centerOnVessel', vessel)" class="action-button">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              Center on Map
            </button>
            <button @click="copyVesselInfo" class="action-button">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Info
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { VesselPosition } from '@/stores/websocket'
import { getVesselTypeName, getNavigationStatusName, getNavigationStatusColor } from '@/types/vessel'

defineProps<{
  vessel: VesselPosition | null
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  centerOnVessel: [vessel: VesselPosition]
}>()

function formatCoordinate(value: number, type: 'lat' | 'lon'): string {
  const abs = Math.abs(value)
  const degrees = Math.floor(abs)
  const minutes = (abs - degrees) * 60
  const direction = type === 'lat' 
    ? (value >= 0 ? 'N' : 'S')
    : (value >= 0 ? 'E' : 'W')
  
  return `${degrees}° ${minutes.toFixed(3)}' ${direction}`
}

function formatTimestamp(timestamp: Date): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatETA(eta: Date | undefined): string {
  if (!eta) return 'N/A'
  const date = new Date(eta)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function copyVesselInfo() {
  const vessel = defineProps<{ vessel: VesselPosition | null }>().vessel
  if (!vessel) return
  
  const info = `Vessel Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${vessel.name}
Type: ${getVesselTypeName(vessel.vesselType || 0)}
MMSI: ${vessel.mmsi}
${vessel.imoNumber ? `IMO: ${vessel.imoNumber}` : ''}
${vessel.callSign ? `Call Sign: ${vessel.callSign}` : ''}

Position: ${formatCoordinate(vessel.latitude, 'lat')}, ${formatCoordinate(vessel.longitude, 'lon')}
Speed: ${vessel.speed.toFixed(1)} kts
Course: ${vessel.course.toFixed(1)}°
Heading: ${vessel.heading}°

Status: ${getNavigationStatusName(vessel.navigationStatus || 15)}
${vessel.destination ? `Destination: ${vessel.destination}` : ''}
${vessel.eta ? `ETA: ${formatETA(vessel.eta)}` : ''}`
  
  navigator.clipboard.writeText(info)
  alert('Vessel information copied to clipboard!')
}
</script>

<style scoped>
.vessel-details-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: rgba(10, 36, 99, 0.98);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(62, 146, 204, 0.3);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
  z-index: 1500;
  display: flex;
  flex-direction: column;
  color: white;
}

.panel-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-content {
  flex: 1;
}

.vessel-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: white;
}

.vessel-type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.close-button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  color: white;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.detail-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #3E92CC;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
}

.section-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
}

.detail-value.mono {
  font-family: 'Courier New', monospace;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.mt-3 {
  margin-top: 0.75rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(62, 146, 204, 0.2);
  border: 1px solid rgba(62, 146, 204, 0.4);
  border-radius: 0.375rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background: rgba(62, 146, 204, 0.3);
  border-color: rgba(62, 146, 204, 0.6);
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(100%);
}
</style>

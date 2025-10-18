<template>
  <div
    v-if="vessel"
    class="vessel-tooltip"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
  >
    <div class="tooltip-header">
      <strong>{{ vessel.name }}</strong>
      <div class="vessel-type">{{ getVesselTypeName(vessel.vesselType || 0) }}</div>
    </div>
    <div class="tooltip-content">
      <div class="tooltip-section">
        <div class="section-title">Identification</div>
        <div class="tooltip-row">
          <span class="label">MMSI:</span>
          <span class="value">{{ vessel.mmsi }}</span>
        </div>
        <div v-if="vessel.imoNumber" class="tooltip-row">
          <span class="label">IMO:</span>
          <span class="value">{{ vessel.imoNumber }}</span>
        </div>
        <div v-if="vessel.callSign" class="tooltip-row">
          <span class="label">Call Sign:</span>
          <span class="value">{{ vessel.callSign }}</span>
        </div>
      </div>

      <div v-if="vessel.length || vessel.width" class="tooltip-section">
        <div class="section-title">Dimensions</div>
        <div v-if="vessel.length" class="tooltip-row">
          <span class="label">Length:</span>
          <span class="value">{{ vessel.length.toFixed(1) }} m</span>
        </div>
        <div v-if="vessel.width" class="tooltip-row">
          <span class="label">Width:</span>
          <span class="value">{{ vessel.width.toFixed(1) }} m</span>
        </div>
        <div v-if="vessel.draught" class="tooltip-row">
          <span class="label">Draught:</span>
          <span class="value">{{ vessel.draught.toFixed(1) }} m</span>
        </div>
      </div>

      <div class="tooltip-section">
        <div class="section-title">Navigation</div>
        <div class="tooltip-row">
          <span class="label">Status:</span>
          <span class="value" :style="{ color: getNavigationStatusColor(vessel.navigationStatus || 15) }">
            {{ getNavigationStatusName(vessel.navigationStatus || 15) }}
          </span>
        </div>
        <div class="tooltip-row">
          <span class="label">Speed:</span>
          <span class="value">{{ vessel.speed.toFixed(1) }} kts</span>
        </div>
        <div class="tooltip-row">
          <span class="label">Course:</span>
          <span class="value">{{ vessel.course.toFixed(0) }}°</span>
        </div>
        <div class="tooltip-row">
          <span class="label">Heading:</span>
          <span class="value">{{ vessel.heading }}°</span>
        </div>
      </div>

      <div class="tooltip-section">
        <div class="section-title">Position</div>
        <div class="tooltip-row">
          <span class="label">Lat/Lon:</span>
          <span class="value">
            {{ vessel.latitude.toFixed(4) }}°, {{ vessel.longitude.toFixed(4) }}°
          </span>
        </div>
      </div>

      <div v-if="vessel.destination" class="tooltip-section">
        <div class="section-title">Destination</div>
        <div class="tooltip-row">
          <span class="label">Port:</span>
          <span class="value">{{ vessel.destination }}</span>
        </div>
        <div v-if="vessel.eta" class="tooltip-row">
          <span class="label">ETA:</span>
          <span class="value">{{ formatETA(vessel.eta) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VesselPosition } from '@/stores/websocket'
import { getVesselTypeName, getNavigationStatusName, getNavigationStatusColor } from '@/types/vessel'

defineProps<{
  vessel: VesselPosition | null
  position: { x: number; y: number }
}>()

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
</script>

<style scoped>
.vessel-tooltip {
  position: fixed;
  background: rgba(10, 36, 99, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(62, 146, 204, 0.5);
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: white;
  font-size: 0.875rem;
  pointer-events: none;
  z-index: 1000;
  min-width: 250px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transform: translate(10px, 10px);
}

.tooltip-header {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.vessel-type {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

.tooltip-section {
  margin-bottom: 0.75rem;
}

.tooltip-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #3E92CC;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.375rem;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.value {
  font-family: 'Courier New', monospace;
  color: #3E92CC;
}
</style>

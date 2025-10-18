<template>
  <div
    v-if="vessel && visible"
    class="context-menu"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    @click.stop
  >
    <div class="menu-header">
      <strong>{{ vessel.name }}</strong>
      <span class="text-xs text-gray-400">{{ vessel.mmsi }}</span>
    </div>
    <div class="menu-items">
      <button class="menu-item" @click="viewDetails">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        View Details
      </button>
      <button class="menu-item" @click="copyInfo">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy Information
      </button>
      <button class="menu-item" @click="copyPosition">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Copy Position
      </button>
      <button class="menu-item" @click="callVessel">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        Call Vessel
      </button>
      <button class="menu-item" @click="centerOnVessel">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
        Center on Map
      </button>
      <button class="menu-item" @click="trackVessel">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Track Vessel
      </button>
      <div class="menu-divider"></div>
      <button class="menu-item" @click="viewTrajectory">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        View Trajectory
      </button>
      <button class="menu-item" @click="predictTrajectory">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Predict Trajectory
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VesselPosition } from '@/stores/websocket'

const props = defineProps<{
  vessel: VesselPosition | null
  position: { x: number; y: number }
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  centerOnVessel: [vessel: VesselPosition]
  viewDetails: [vessel: VesselPosition]
  viewTrajectory: [vessel: VesselPosition]
  predictTrajectory: [vessel: VesselPosition]
}>()

function viewDetails() {
  if (!props.vessel) return
  emit('viewDetails', props.vessel)
  emit('close')
}

function copyInfo() {
  if (!props.vessel) return
  
  const info = `Vessel: ${props.vessel.name}
MMSI: ${props.vessel.mmsi}
Position: ${props.vessel.latitude.toFixed(4)}°, ${props.vessel.longitude.toFixed(4)}°
Speed: ${props.vessel.speed.toFixed(1)} kts
Course: ${props.vessel.course.toFixed(0)}°
Heading: ${props.vessel.heading}°`
  
  navigator.clipboard.writeText(info)
  alert('Vessel information copied to clipboard!')
  emit('close')
}

function copyPosition() {
  if (!props.vessel) return
  
  const position = `${props.vessel.latitude.toFixed(6)}, ${props.vessel.longitude.toFixed(6)}`
  navigator.clipboard.writeText(position)
  alert('Position copied to clipboard!')
  emit('close')
}

function callVessel() {
  if (!props.vessel) return
  alert(`Calling vessel ${props.vessel.name} (MMSI: ${props.vessel.mmsi})...`)
  emit('close')
}

function centerOnVessel() {
  if (!props.vessel) return
  emit('centerOnVessel', props.vessel)
  emit('close')
}

function trackVessel() {
  if (!props.vessel) return
  alert(`Now tracking vessel ${props.vessel.name}`)
  emit('close')
}

function viewTrajectory() {
  if (!props.vessel) return
  emit('viewTrajectory', props.vessel)
  emit('close')
}

function predictTrajectory() {
  if (!props.vessel) return
  emit('predictTrajectory', props.vessel)
  emit('close')
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: rgba(10, 36, 99, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(62, 146, 204, 0.5);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  z-index: 2000;
  min-width: 220px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.menu-header {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.menu-items {
  padding: 0.25rem;
}

.menu-item {
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: transparent;
  border: none;
  color: white;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.25rem;
}

.menu-item:hover {
  background: rgba(62, 146, 204, 0.2);
}

.menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.25rem 0;
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}
</style>

<template>
  <div v-if="predictionStore.showPrediction && predictionStore.currentPrediction" class="prediction-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-left">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <h3 class="panel-title">Trajectory Prediction</h3>
      </div>
      <button @click="closePrediction" class="close-button">
        <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="panel-content">
      <!-- Vessel Info -->
      <div class="info-section">
        <div class="info-label">Vessel MMSI</div>
        <div class="info-value">{{ predictionStore.currentPrediction.mmsi }}</div>
      </div>

      <!-- Current Position -->
      <div class="info-section">
        <div class="section-title">Current Position</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Latitude:</span>
            <span class="value">{{ predictionStore.currentPrediction.currentPosition.latitude.toFixed(6) }}°</span>
          </div>
          <div class="info-item">
            <span class="label">Longitude:</span>
            <span class="value">{{ predictionStore.currentPrediction.currentPosition.longitude.toFixed(6) }}°</span>
          </div>
          <div class="info-item">
            <span class="label">Time:</span>
            <span class="value">{{ formatTime(predictionStore.currentPrediction.currentPosition.timestamp) }}</span>
          </div>
        </div>
      </div>

      <!-- Prediction Info -->
      <div class="info-section">
        <div class="section-title">Prediction</div>
        <div class="info-item">
          <span class="label">Points:</span>
          <span class="value">{{ predictionStore.currentPrediction.predictedPoints.length }}</span>
        </div>
        <div class="info-item">
          <span class="label">Duration:</span>
          <span class="value">{{ calculateDuration() }}</span>
        </div>
        <div v-if="averageConfidence" class="info-item">
          <span class="label">Confidence:</span>
          <span class="value">
            <div class="confidence-bar">
              <div class="confidence-fill" :style="{ width: `${averageConfidence * 100}%` }"></div>
            </div>
            {{ (averageConfidence * 100).toFixed(0) }}%
          </span>
        </div>
      </div>

      <!-- ETA Info (if available) -->
      <div v-if="predictionStore.currentPrediction.estimatedArrival" class="info-section eta-section">
        <div class="section-title">
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Estimated Arrival
        </div>
        <div class="eta-info">
          <div class="info-item">
            <span class="label">Destination:</span>
            <span class="value">
              {{ predictionStore.currentPrediction.estimatedArrival.latitude.toFixed(4) }}°,
              {{ predictionStore.currentPrediction.estimatedArrival.longitude.toFixed(4) }}°
            </span>
          </div>
          <div class="info-item">
            <span class="label">Distance:</span>
            <span class="value">{{ predictionStore.currentPrediction.estimatedArrival.distance.toFixed(1) }} NM</span>
          </div>
          <div class="info-item eta-highlight">
            <span class="label">ETA:</span>
            <span class="value">{{ formatETA(predictionStore.currentPrediction.estimatedArrival.eta) }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="panel-actions">
        <button @click="refreshPrediction" class="action-button">
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
        <button @click="clearPrediction" class="action-button secondary">
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePredictionStore } from '@/stores/prediction'

const predictionStore = usePredictionStore()

const averageConfidence = computed(() => {
  if (!predictionStore.currentPrediction) return 0
  const points = predictionStore.currentPrediction.predictedPoints
  if (points.length === 0) return 0
  const sum = points.reduce((acc, p) => acc + p.confidence, 0)
  return sum / points.length
})

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatETA(eta: string): string {
  const date = new Date(eta)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  const diffMinutes = Math.floor((diffMs % 3600000) / 60000)
  
  return `${date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })} (${diffHours}h ${diffMinutes}m)`
}

function calculateDuration(): string {
  if (!predictionStore.currentPrediction) return '0m'
  const points = predictionStore.currentPrediction.predictedPoints
  if (points.length === 0) return '0m'
  
  const start = new Date(predictionStore.currentPrediction.currentPosition.timestamp)
  const end = new Date(points[points.length - 1].timestamp)
  const diffMs = end.getTime() - start.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  
  if (diffMinutes < 60) {
    return `${diffMinutes}m`
  } else {
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}h ${minutes}m`
  }
}

async function refreshPrediction() {
  if (!predictionStore.currentPrediction) return
  try {
    await predictionStore.fetchPrediction(predictionStore.currentPrediction.mmsi)
  } catch (error) {
    console.error('Failed to refresh prediction:', error)
  }
}

function clearPrediction() {
  predictionStore.clearPrediction()
}

function closePrediction() {
  predictionStore.togglePredictionVisibility()
}
</script>

<style scoped>
.prediction-panel {
  position: absolute;
  top: 76px;
  right: 1rem;
  width: 380px;
  max-height: calc(100vh - 92px);
  background: rgba(10, 36, 99, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(62, 146, 204, 0.3);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 950;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(62, 146, 204, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.panel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
  color: rgba(62, 146, 204, 1);
}

.icon-sm {
  width: 1.25rem;
  height: 1.25rem;
}

.close-button {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(62, 146, 204, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.info-item .label {
  color: rgba(255, 255, 255, 0.7);
}

.info-item .value {
  color: white;
  font-weight: 500;
}

.confidence-bar {
  width: 100px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-right: 0.5rem;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #10b981);
  transition: width 0.3s;
}

.eta-section {
  background: rgba(62, 146, 204, 0.1);
  border-color: rgba(62, 146, 204, 0.3);
}

.eta-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.eta-highlight {
  padding: 0.5rem;
  background: rgba(62, 146, 204, 0.2);
  border-radius: 0.25rem;
  font-weight: 600;
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.5rem;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem;
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

.action-button.secondary {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.action-button.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}
</style>

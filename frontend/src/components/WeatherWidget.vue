<template>
  <div v-if="weatherStore.showWeatherWidget && weatherStore.currentWeather" class="weather-widget">
    <!-- Header -->
    <div class="widget-header">
      <div class="header-left">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
        <h3 class="widget-title">Weather</h3>
      </div>
      <div class="header-actions">
        <button @click="refresh" class="icon-button" title="Refresh">
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button @click="weatherStore.toggleWeatherWidget()" class="icon-button" title="Close">
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Current Weather -->
    <div class="widget-content">
      <div class="current-weather">
        <div class="weather-main">
          <img 
            :src="`https://openweathermap.org/img/wn/${weatherStore.currentWeather.current.weather.icon}@2x.png`" 
            :alt="weatherStore.currentWeather.current.weather.description"
            class="weather-icon"
          />
          <div class="temperature">
            <span class="temp-value">{{ Math.round(weatherStore.currentWeather.current.temperature) }}</span>
            <span class="temp-unit">°C</span>
          </div>
        </div>
        <div class="weather-description">
          {{ weatherStore.currentWeather.current.weather.description }}
        </div>
      </div>

      <!-- Weather Details -->
      <div class="weather-details">
        <div class="detail-item">
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span class="detail-label">Wind:</span>
          <span class="detail-value">{{ weatherStore.windSpeedKnots.toFixed(1) }} kts</span>
        </div>
        <div class="detail-item">
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span class="detail-label">Visibility:</span>
          <span class="detail-value">{{ weatherStore.visibilityNM.toFixed(1) }} NM</span>
        </div>
        <div class="detail-item">
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <span class="detail-label">Pressure:</span>
          <span class="detail-value">{{ weatherStore.currentWeather.current.pressure }} hPa</span>
        </div>
        <div class="detail-item">
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
          </svg>
          <span class="detail-label">Humidity:</span>
          <span class="detail-value">{{ weatherStore.currentWeather.current.humidity }}%</span>
        </div>
      </div>

      <!-- Maritime Conditions -->
      <div v-if="weatherStore.maritimeConditions" class="maritime-section">
        <div class="section-title">Maritime Conditions</div>
        <div class="maritime-details">
          <div class="maritime-item">
            <span class="label">Sea State:</span>
            <span class="value">{{ weatherStore.maritimeConditions.seaState.description }}</span>
          </div>
          <div class="maritime-item">
            <span class="label">Wave Height:</span>
            <span class="value">{{ weatherStore.maritimeConditions.seaState.waveHeight.toFixed(1) }} m</span>
          </div>
          <div class="maritime-item">
            <span class="label">Beaufort:</span>
            <span class="value">{{ weatherStore.maritimeConditions.windConditions.beaufortScale }} - {{ weatherStore.maritimeConditions.windConditions.description }}</span>
          </div>
          <div v-if="!weatherStore.maritimeConditions.windConditions.isSafeForNavigation" class="warning-badge">
            ⚠️ Conditions not safe for navigation
          </div>
        </div>
      </div>

      <!-- Warnings -->
      <div v-if="weatherStore.maritimeConditions?.warnings.length" class="warnings-section">
        <div class="section-title">Warnings</div>
        <div class="warning-item" v-for="(warning, index) in weatherStore.maritimeConditions.warnings" :key="index">
          {{ warning }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWeatherStore } from '@/stores/weather'

const weatherStore = useWeatherStore()

async function refresh() {
  if (!weatherStore.currentWeather) return
  const { latitude, longitude } = weatherStore.currentWeather.location
  await weatherStore.refreshWeatherData(latitude, longitude)
}
</script>

<style scoped>
.weather-widget {
  position: absolute;
  top: 76px;
  left: 1rem;
  width: 320px;
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

.widget-header {
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

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.widget-title {
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

.icon-button {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.widget-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.current-weather {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.weather-icon {
  width: 80px;
  height: 80px;
}

.temperature {
  display: flex;
  align-items: flex-start;
}

.temp-value {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.temp-unit {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
}

.weather-description {
  margin-top: 0.5rem;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  text-transform: capitalize;
}

.weather-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.detail-item svg {
  color: rgba(62, 146, 204, 1);
}

.detail-label {
  color: rgba(255, 255, 255, 0.7);
  flex: 1;
}

.detail-value {
  color: white;
  font-weight: 600;
}

.maritime-section,
.warnings-section {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(62, 146, 204, 1);
  margin-bottom: 0.75rem;
}

.maritime-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.maritime-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.maritime-item .label {
  color: rgba(255, 255, 255, 0.7);
}

.maritime-item .value {
  color: white;
  font-weight: 500;
}

.warning-badge {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 0.375rem;
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
}

.warning-item {
  padding: 0.5rem;
  background: rgba(245, 158, 11, 0.2);
  border-left: 3px solid #f59e0b;
  border-radius: 0.25rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.warning-item:last-child {
  margin-bottom: 0;
}
</style>

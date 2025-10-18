<template>
  <div class="heatmap-control">
    <button 
      @click="toggleHeatmap" 
      :class="['heatmap-button', { active: isActive }]"
      :title="isActive ? 'Hide Heatmap' : 'Show Heatmap'"
    >
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <span class="button-text">Heatmap</span>
      <span v-if="isActive" class="active-badge">ON</span>
    </button>

    <!-- Time Range Selector (shown when heatmap is active) -->
    <Transition name="slide-down">
      <div v-if="isActive" class="time-range-selector">
        <label class="range-label">Time Range:</label>
        <select v-model="selectedRange" @change="handleRangeChange" class="range-select">
          <option value="1h">Last Hour</option>
          <option value="6h">Last 6 Hours</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
        
        <div v-if="loading" class="loading-indicator">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>
        
        <div v-if="pointCount > 0" class="point-count">
          {{ pointCount }} points
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  toggle: [active: boolean]
  rangeChange: [range: string]
}>()

const isActive = ref(false)
const selectedRange = ref('24h')
const loading = ref(false)
const pointCount = ref(0)

function toggleHeatmap() {
  isActive.value = !isActive.value
  emit('toggle', isActive.value)
}

function handleRangeChange() {
  emit('rangeChange', selectedRange.value)
}

defineExpose({
  setLoading: (value: boolean) => { loading.value = value },
  setPointCount: (count: number) => { pointCount.value = count },
})
</script>

<style scoped>
.heatmap-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.heatmap-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(10, 36, 99, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(62, 146, 204, 0.3);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.heatmap-button:hover {
  background: rgba(62, 146, 204, 0.2);
  border-color: rgba(62, 146, 204, 0.5);
}

.heatmap-button.active {
  background: rgba(62, 146, 204, 0.3);
  border-color: rgba(62, 146, 204, 0.6);
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
}

.button-text {
  flex: 1;
}

.active-badge {
  padding: 0.125rem 0.5rem;
  background: rgba(16, 185, 129, 0.3);
  color: #10b981;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.time-range-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(10, 36, 99, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(62, 146, 204, 0.3);
  border-radius: 0.5rem;
}

.range-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.range-select {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.range-select:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.range-select:focus {
  outline: none;
  border-color: rgba(62, 146, 204, 0.6);
}

.range-select option {
  background: rgba(10, 36, 99, 0.98);
  color: white;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(62, 146, 204, 0.8);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.point-count {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

<template>
  <div class="trajectory-timeline">
    <!-- Header -->
    <div class="timeline-header">
      <div class="header-left">
        <h4 class="timeline-title">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Trajectory Replay
        </h4>
        <div v-if="trajectoryStore.hasTrajectory" class="timeline-info">
          <span class="info-text">{{ trajectoryStore.currentTrajectory.length }} points</span>
          <span class="info-separator">•</span>
          <span class="info-text">{{ formatDuration(duration) }}</span>
        </div>
      </div>
      <button @click="$emit('close')" class="close-button">
        <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Controls -->
    <div class="timeline-controls">
      <!-- Play/Pause/Stop -->
      <div class="control-buttons">
        <button 
          @click="handleStop" 
          class="control-btn"
          :disabled="!trajectoryStore.hasTrajectory"
          title="Stop"
        >
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        </button>
        
        <button 
          @click="handlePlayPause" 
          class="control-btn primary"
          :disabled="!trajectoryStore.hasTrajectory"
          :title="trajectoryStore.replayState.isPlaying ? 'Pause' : 'Play'"
        >
          <svg v-if="!trajectoryStore.replayState.isPlaying" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <!-- Speed Control -->
      <div class="speed-control">
        <span class="speed-label">Speed:</span>
        <div class="speed-buttons">
          <button 
            v-for="speed in speedOptions" 
            :key="speed"
            @click="trajectoryStore.setReplaySpeed(speed)"
            :class="['speed-btn', { active: trajectoryStore.replayState.speed === speed }]"
          >
            {{ speed }}x
          </button>
        </div>
      </div>

      <!-- Loop Toggle -->
      <button 
        @click="trajectoryStore.toggleLoop()"
        :class="['control-btn', { active: trajectoryStore.replayState.loop }]"
        title="Loop"
      >
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <!-- Progress Bar -->
    <div class="timeline-progress">
      <div class="progress-bar-container" @click="handleProgressClick">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${trajectoryStore.replayProgress}%` }"
          ></div>
          <div 
            class="progress-handle"
            :style="{ left: `${trajectoryStore.replayProgress}%` }"
            @mousedown="startDrag"
          ></div>
        </div>
      </div>
      
      <div class="progress-time">
        <span>{{ formatTime(currentTime) }}</span>
        <span>{{ formatTime(endTime) }}</span>
      </div>
    </div>

    <!-- Current Point Info -->
    <div v-if="currentPoint" class="current-point-info">
      <div class="info-item">
        <span class="info-label">Position:</span>
        <span class="info-value">{{ currentPoint.latitude.toFixed(5) }}°N, {{ currentPoint.longitude.toFixed(5) }}°E</span>
      </div>
      <div class="info-item">
        <span class="info-label">Speed:</span>
        <span class="info-value">{{ currentPoint.speed.toFixed(1) }} kts</span>
      </div>
      <div class="info-item">
        <span class="info-label">Course:</span>
        <span class="info-value">{{ currentPoint.course.toFixed(0) }}°</span>
      </div>
      <div class="info-item">
        <span class="info-label">Time:</span>
        <span class="info-value">{{ formatDateTime(currentPoint.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTrajectoryStore } from '@/stores/trajectory'

defineEmits<{
  close: []
}>()

const trajectoryStore = useTrajectoryStore()

const speedOptions = [1, 2, 5, 10, 20]
const isDragging = ref(false)

const currentPoint = computed(() => trajectoryStore.currentReplayPoint)

const duration = computed(() => {
  if (trajectoryStore.currentTrajectory.length < 2) return 0
  const start = new Date(trajectoryStore.currentTrajectory[0].timestamp)
  const end = new Date(trajectoryStore.currentTrajectory[trajectoryStore.currentTrajectory.length - 1].timestamp)
  return (end.getTime() - start.getTime()) / 1000 / 60 // Minutes
})

const currentTime = computed(() => {
  if (!currentPoint.value || trajectoryStore.currentTrajectory.length === 0) return new Date()
  return new Date(currentPoint.value.timestamp)
})

const endTime = computed(() => {
  if (trajectoryStore.currentTrajectory.length === 0) return new Date()
  return new Date(trajectoryStore.currentTrajectory[trajectoryStore.currentTrajectory.length - 1].timestamp)
})

function handlePlayPause() {
  if (trajectoryStore.replayState.isPlaying) {
    trajectoryStore.pauseReplay()
  } else {
    trajectoryStore.startReplay()
  }
}

function handleStop() {
  trajectoryStore.stopReplay()
}

function handleProgressClick(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const percent = ((event.clientX - rect.left) / rect.width) * 100
  trajectoryStore.seekToPercent(percent)
}

function startDrag(event: MouseEvent) {
  isDragging.value = true
  const wasPlaying = trajectoryStore.replayState.isPlaying
  if (wasPlaying) {
    trajectoryStore.pauseReplay()
  }

  const handleMouseMove = (e: MouseEvent) => {
    const progressBar = (event.target as HTMLElement).closest('.progress-bar-container')
    if (!progressBar) return
    
    const rect = progressBar.getBoundingClientRect()
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    trajectoryStore.seekToPercent(percent)
  }

  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    
    if (wasPlaying) {
      trajectoryStore.startReplay()
    }
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return `${hours}h ${mins}m`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.trajectory-timeline {
  background: rgba(10, 36, 99, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(62, 146, 204, 0.3);
  border-radius: 0.5rem;
  padding: 1rem;
  color: white;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.timeline-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.info-separator {
  color: rgba(255, 255, 255, 0.3);
}

.close-button {
  padding: 0.375rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.timeline-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.control-buttons {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-btn.primary {
  background: rgba(62, 146, 204, 0.3);
  border-color: rgba(62, 146, 204, 0.5);
}

.control-btn.primary:hover:not(:disabled) {
  background: rgba(62, 146, 204, 0.4);
  border-color: rgba(62, 146, 204, 0.6);
}

.control-btn.active {
  background: rgba(62, 146, 204, 0.4);
  border-color: rgba(62, 146, 204, 0.6);
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.speed-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.speed-buttons {
  display: flex;
  gap: 0.25rem;
}

.speed-btn {
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.speed-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.speed-btn.active {
  background: rgba(62, 146, 204, 0.3);
  border-color: rgba(62, 146, 204, 0.5);
}

.timeline-progress {
  margin-bottom: 1rem;
}

.progress-bar-container {
  padding: 0.5rem 0;
  cursor: pointer;
}

.progress-bar {
  position: relative;
  height: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  overflow: visible;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(62, 146, 204, 0.6), rgba(62, 146, 204, 0.8));
  border-radius: 0.25rem;
  transition: width 0.1s linear;
}

.progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 1rem;
  height: 1rem;
  background: white;
  border: 2px solid rgba(62, 146, 204, 0.8);
  border-radius: 50%;
  cursor: grab;
  transition: transform 0.1s;
}

.progress-handle:hover {
  transform: translate(-50%, -50%) scale(1.2);
}

.progress-handle:active {
  cursor: grabbing;
}

.progress-time {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

.current-point-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.375rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.info-value {
  font-size: 0.875rem;
  font-weight: 500;
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}
</style>

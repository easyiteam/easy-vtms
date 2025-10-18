<template>
  <div class="map-container">
    <!-- Map (Full Screen) -->
    <div id="map" ref="mapElement" class="map-view"></div>

    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-bar-left">
        <h1 class="app-title">VTMS</h1>
        <div class="status-badge" :class="wsStore.connected ? 'status-connected' : 'status-disconnected'">
          <div class="status-dot"></div>
          <span>{{ wsStore.connected ? 'Connected' : 'Disconnected' }}</span>
        </div>
      </div>
      
      <div class="top-bar-right">
        <button @click="toggleAlertsPanel" class="icon-button alerts-button" title="Toggle Alerts Panel">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span v-if="alertsStore.alertCount > 0" class="alert-badge" :class="{ critical: alertsStore.criticalCount > 0 }">
            {{ alertsStore.alertCount }}
          </span>
        </button>
        <button @click="toggleControlPanel" class="icon-button" title="Toggle Control Panel">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Search & Filters Bar -->
    <div class="search-bar-container">
      <div class="search-bar-compact">
        <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search vessels (MMSI, name, IMO)..."
          class="search-input-compact"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-button">
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="quick-actions">
        <button @click="toggleFilters" :class="['action-button', { active: showFilters }]">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>
        
        <button @click="showTrails = !showTrails" :class="['action-button', { active: showTrails }]">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Trails
          <span v-if="showTrails" class="badge-active">ON</span>
        </button>

        <HeatmapControl 
          ref="heatmapControl"
          @toggle="handleHeatmapToggle"
          @rangeChange="handleHeatmapRangeChange"
        />

        <button @click="toggleWeather" :class="['action-button', { active: weatherStore.showWeatherWidget }]">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          Weather
          <span v-if="weatherStore.showWeatherWidget" class="badge-active">ON</span>
        </button>

        <button @click="vtsStore.toggleMessagesPanel()" :class="['action-button', { active: vtsStore.showMessagesPanel }]">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Messages
          <span v-if="vtsStore.unreadCount > 0" class="badge-count">{{ vtsStore.unreadCount }}</span>
        </button>
        
        <div class="vessel-count-badge">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          {{ wsStore.vessels.size }}
        </div>
      </div>
    </div>

    <!-- Filters Panel (Expandable) -->
    <Transition name="slide-down">
      <div v-if="showFilters" class="filters-panel">
        <VesselFilters
          :vessels="wsStore.vessels"
          :filteredCount="wsStore.vessels.size"
          @search="handleSearch"
          @filterTypes="handleFilterTypes"
          @filterStatuses="handleFilterStatuses"
          @filterSpeed="handleFilterSpeed"
        />
      </div>
    </Transition>

    <!-- Vessel Tooltip -->
    <VesselTooltip :vessel="hoveredVessel" :position="tooltipPosition" />

    <!-- Vessel Context Menu -->
    <VesselContextMenu
      :vessel="contextMenuVessel"
      :position="contextMenuPosition"
      :visible="showContextMenu"
      @close="closeContextMenu"
      @centerOnVessel="centerOnVessel"
      @viewDetails="openDetailsPanel"
      @viewTrajectory="handleViewTrajectory"
      @predictTrajectory="handlePredictTrajectory"
    />

    <!-- Vessel Details Panel -->
    <VesselDetailsPanel
      :vessel="selectedVessel"
      :visible="showDetailsPanel"
      @close="closeDetailsPanel"
      @centerOnVessel="centerOnVessel"
    />

    <!-- Alerts Panel -->
    <Transition name="slide-left">
      <div v-if="showAlertsPanel" class="alerts-panel-container">
        <AlertsPanel @close="showAlertsPanel = false" />
      </div>
    </Transition>

    <!-- Alert Notifications -->
    <AlertNotification />

    <!-- Trajectory Timeline -->
    <Transition name="slide-up">
      <div v-if="showTimeline" class="timeline-container">
        <TrajectoryTimeline @close="showTimeline = false" />
      </div>
    </Transition>

    <!-- Prediction Panel -->
    <PredictionPanel />

    <!-- Anomaly Notifications -->
    <div class="anomaly-notifications">
      <AnomalyNotification
        v-for="(anomalyList, mmsi) in predictionStore.anomalies"
        :key="`${mmsi}-${anomalyList[0]?.type}`"
        :anomaly="anomalyList[0]"
        :autoDismiss="true"
        :dismissDelay="8000"
        @dismiss="predictionStore.dismissAnomaly(mmsi as string, 0)"
      />
    </div>

    <!-- Weather Widget -->
    <WeatherWidget />

    <!-- Messages Panel -->
    <MessagesPanel />

    <!-- Compose Message Dialog -->
    <ComposeMessageDialog />

    <!-- Control Panel (Collapsible) -->
    <Transition name="slide-left">
      <div v-if="showControlPanel" class="control-panel-new">
        <div class="panel-header-new">
          <h3 class="panel-title">Control Panel</h3>
          <button @click="showControlPanel = false" class="close-button-panel">
            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab', activeTab === tab.id && 'tab-active']"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Layers Tab -->
        <div v-if="activeTab === 'layers'" class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold mb-2">ENC Layers</h3>
            <button
              @click="showUploadDialog = true"
              class="btn btn-primary w-full mb-3"
            >
              Upload ENC File (.000)
            </button>
            
            <div v-if="encStore.loading" class="text-center py-4">
              <span class="text-gray-400">Loading...</span>
            </div>
            
            <div v-else-if="encStore.layers.length === 0" class="text-center py-4">
              <span class="text-gray-400">No layers available</span>
            </div>
            
            <div v-else class="space-y-2">
              <div
                v-for="layer in encStore.layers"
                :key="layer.id"
                class="layer-item"
              >
                <div class="flex-1">
                  <div class="font-medium">{{ layer.name }}</div>
                  <div class="text-xs text-gray-400">{{ layer.type }}</div>
                </div>
                <div class="flex gap-2">
                  <button
                    @click="toggleLayer(layer)"
                    :class="['btn btn-sm', visibleLayers.has(layer.id) ? 'btn-success' : 'btn-secondary']"
                  >
                    {{ visibleLayers.has(layer.id) ? 'Hide' : 'Show' }}
                  </button>
                  <button
                    @click="deleteLayer(layer.id)"
                    class="btn btn-sm btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vessels Tab -->
        <div v-if="activeTab === 'vessels'" class="space-y-4">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-lg font-semibold">Active Vessels</h3>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" v-model="showTrails" class="checkbox" />
              <span>Show Trails</span>
            </label>
          </div>
          
          <div v-if="wsStore.vessels.size === 0" class="text-center py-4">
            <span class="text-gray-400">No vessels detected</span>
          </div>
          
          <div v-else class="space-y-2">
            <div
              v-for="[mmsi, vessel] in wsStore.vessels"
              :key="mmsi"
              class="vessel-item"
              @click="centerOnVessel(vessel)"
            >
              <div class="flex-1">
                <div class="font-medium">{{ vessel.name }}</div>
                <div class="text-xs text-gray-400">MMSI: {{ vessel.mmsi }}</div>
              </div>
              <div class="text-right text-sm">
                <div>{{ vessel.speed.toFixed(1) }} kts</div>
                <div class="text-gray-400">{{ vessel.course.toFixed(0) }}°</div>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-700">
            <button
              @click="wsStore.startSimulation()"
              class="btn btn-primary w-full mb-2"
            >
              Start Simulation
            </button>
            <button
              @click="wsStore.stopSimulation()"
              class="btn btn-secondary w-full"
            >
              Stop Simulation
            </button>
          </div>
        </div>

        <!-- NMEA Tab -->
        <div v-if="activeTab === 'nmea'" class="space-y-4">
          <h3 class="text-lg font-semibold mb-2">NMEA Messages</h3>
          
          <div class="nmea-log">
            <div
              v-for="(msg, index) in wsStore.nmeaMessages.slice(0, 20)"
              :key="index"
              class="nmea-message"
            >
              <div class="text-xs text-gray-400">
                {{ msg.timestamp.toLocaleTimeString() }}
              </div>
              <div class="text-sm font-mono">{{ msg.type }}</div>
              <div v-if="msg.latitude && msg.longitude" class="text-xs">
                {{ msg.latitude.toFixed(4) }}, {{ msg.longitude.toFixed(4) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Transition>

    <!-- Upload Dialog -->
    <div v-if="showUploadDialog" class="modal-overlay" @click="showUploadDialog = false">
      <div class="modal" @click.stop>
        <h3 class="text-xl font-bold mb-4">Upload ENC File</h3>
        <input
          type="file"
          accept=".000,.s57"
          @change="handleFileSelect"
          class="file-input mb-4"
        />
        <div class="flex gap-2">
          <button
            @click="uploadFile"
            :disabled="!selectedFile || encStore.loading"
            class="btn btn-primary flex-1"
          >
            {{ encStore.loading ? 'Uploading...' : 'Upload' }}
          </button>
          <button
            @click="showUploadDialog = false"
            class="btn btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
        <div v-if="encStore.error" class="mt-4 text-red-500 text-sm">
          {{ encStore.error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Map as OLMap, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import { OSM } from 'ol/source'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Fill, Stroke, Circle } from 'ol/style'
import { Feature } from 'ol'
import { Point, LineString } from 'ol/geom'
import { fromLonLat, toLonLat } from 'ol/proj'
import { useWebSocketStore } from '@/stores/websocket'
import { useEncStore, type EncLayer } from '@/stores/enc'
import { useAlertsStore } from '@/stores/alerts'
import { useTrajectoryStore } from '@/stores/trajectory'
import { usePredictionStore } from '@/stores/prediction'
import { useWeatherStore } from '@/stores/weather'
import { useVtsStore } from '@/stores/vts'
import type { VesselPosition } from '@/stores/websocket'
import VesselTooltip from '@/components/VesselTooltip.vue'
import VesselContextMenu from '@/components/VesselContextMenu.vue'
import VesselDetailsPanel from '@/components/VesselDetailsPanel.vue'
import VesselFilters from '@/components/VesselFilters.vue'
import AlertsPanel from '@/components/AlertsPanel.vue'
import AlertNotification from '@/components/AlertNotification.vue'
import TrajectoryTimeline from '@/components/TrajectoryTimeline.vue'
import HeatmapControl from '@/components/HeatmapControl.vue'
import PredictionPanel from '@/components/PredictionPanel.vue'
import AnomalyNotification from '@/components/AnomalyNotification.vue'
import WeatherWidget from '@/components/WeatherWidget.vue'
import MessagesPanel from '@/components/MessagesPanel.vue'
import ComposeMessageDialog from '@/components/ComposeMessageDialog.vue'
import { createVesselStyle } from '@/components/VesselIcon'

const wsStore = useWebSocketStore()
const encStore = useEncStore()
const alertsStore = useAlertsStore()
const trajectoryStore = useTrajectoryStore()
const predictionStore = usePredictionStore()
const weatherStore = useWeatherStore()
const vtsStore = useVtsStore()

const mapElement = ref<HTMLElement | null>(null)
let map: OLMap | null = null
const vesselsLayer = ref<VectorLayer<VectorSource> | null>(null)
const trailsLayer = ref<VectorLayer<VectorSource> | null>(null)
const heatmapLayer = ref<VectorLayer<VectorSource> | null>(null)
const encLayersMap = new Map<number, VectorLayer<VectorSource>>()
const visibleLayers = ref<Set<number>>(new Set())
const showTrails = ref(true)
const heatmapControl = ref<InstanceType<typeof HeatmapControl> | null>(null)

const activeTab = ref('layers')
const tabs = [
  { id: 'layers', label: 'Layers' },
  { id: 'vessels', label: 'Vessels' },
  { id: 'nmea', label: 'NMEA' },
]

const showUploadDialog = ref(false)
const selectedFile = ref<File | null>(null)

// Tooltip and context menu state
const hoveredVessel = ref<VesselPosition | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })
const contextMenuVessel = ref<VesselPosition | null>(null)
const contextMenuPosition = ref({ x: 0, y: 0 })
const showContextMenu = ref(false)

// Details panel state
const selectedVessel = ref<VesselPosition | null>(null)
const showDetailsPanel = ref(false)

// UI state
const showControlPanel = ref(false)
const showAlertsPanel = ref(false)
const showFilters = ref(false)
const showTimeline = ref(false)
const searchQuery = ref('')

// Animation frame for smooth vessel movement
const vesselPositions = new Map<string, { current: VesselPosition; target: VesselPosition; lastUpdate: number }>()
let animationFrameId: number | null = null

onMounted(async () => {
  // Initialize map
  initMap()

  // Connect WebSocket
  wsStore.connect()
  
  // Setup alerts listeners
  alertsStore.setupListeners()

  // Fetch ENC layers
  await encStore.fetchLayers()

  // Watch for vessel updates
  watch(() => wsStore.vessels, updateVessels, { deep: true })
})

onUnmounted(() => {
  wsStore.disconnect()
  if (map) {
    map.setTarget(undefined)
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})

function initMap() {
  if (!mapElement.value) return

  // Create trails layer
  const trailsSource = new VectorSource()
  trailsLayer.value = new VectorLayer({
    source: trailsSource,
    style: new Style({
      stroke: new Stroke({
        color: 'rgba(62, 146, 204, 0.6)',
        width: 2,
        lineDash: [5, 5],
      }),
    }),
    zIndex: 1,
  })

  // Create vessels layer
  const vesselsSource = new VectorSource()
  vesselsLayer.value = new VectorLayer({
    source: vesselsSource,
    style: (feature) => {
      const vessel = feature.get('vessel') as VesselPosition
      return vessel ? createVesselStyle(vessel) : undefined
    },
    zIndex: 2,
  })

  // Create map
  map = new OLMap({
    target: mapElement.value,
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
      trailsLayer.value as any,
      vesselsLayer.value as any,
    ],
    view: new View({
      center: fromLonLat([-1.6778, 48.1173]), // Default: Brittany, France
      zoom: 10,
    }),
  })

  // Add hover and context menu interactions
  map.on('pointermove', handlePointerMove)
  map.on('dblclick', handleDoubleClick)
  map.getViewport().addEventListener('contextmenu', handleContextMenu)
  map.getViewport().addEventListener('click', closeContextMenu)

  // Start animation loop
  startAnimationLoop()
}

function handlePointerMove(evt: any) {
  if (!map) return

  const pixel = map.getEventPixel(evt.originalEvent)
  const feature = map.forEachFeatureAtPixel(pixel, (f) => f)

  if (feature) {
    const vessel = feature.get('vessel') as VesselPosition
    if (vessel) {
      hoveredVessel.value = vessel
      tooltipPosition.value = {
        x: evt.originalEvent.clientX,
        y: evt.originalEvent.clientY,
      }
      map.getTargetElement().style.cursor = 'pointer'
      return
    }
  }

  hoveredVessel.value = null
  map.getTargetElement().style.cursor = ''
}

function handleDoubleClick(evt: any) {
  if (!map) return

  const pixel = map.getEventPixel(evt.originalEvent)
  const feature = map.forEachFeatureAtPixel(pixel, (f) => f)

  if (feature) {
    const vessel = feature.get('vessel') as VesselPosition
    if (vessel) {
      openDetailsPanel(vessel)
      evt.preventDefault()
      evt.stopPropagation()
    }
  }
}

function handleContextMenu(evt: MouseEvent) {
  evt.preventDefault()
  if (!map) return

  const pixel = map.getEventPixel(evt)
  const feature = map.forEachFeatureAtPixel(pixel, (f) => f)

  if (feature) {
    const vessel = feature.get('vessel') as VesselPosition
    if (vessel) {
      contextMenuVessel.value = vessel
      contextMenuPosition.value = {
        x: evt.clientX,
        y: evt.clientY,
      }
      showContextMenu.value = true
    }
  }
}

function closeContextMenu() {
  showContextMenu.value = false
}

function closeDetailsPanel() {
  showDetailsPanel.value = false
  selectedVessel.value = null
}

function openDetailsPanel(vessel: VesselPosition) {
  selectedVessel.value = vessel
  showDetailsPanel.value = true
  closeContextMenu()
}

function toggleControlPanel() {
  showControlPanel.value = !showControlPanel.value
}

function toggleAlertsPanel() {
  showAlertsPanel.value = !showAlertsPanel.value
}

function toggleFilters() {
  showFilters.value = !showFilters.value
}

function handleSearch(query: string) {
  // TODO: Implement vessel search filtering
  console.log('Search:', query)
}

function handleFilterTypes(types: string[]) {
  // TODO: Implement vessel type filtering
  console.log('Filter types:', types)
}

async function handleViewTrajectory(vessel: VesselPosition) {
  try {
    // Load trajectory for last 24 hours
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000)
    
    await trajectoryStore.loadTrajectoryForReplay(vessel.mmsi, startTime, endTime)
    
    // Show timeline
    showTimeline.value = true
    
    // Draw trajectory on map
    drawTrajectoryOnMap()
  } catch (error) {
    console.error('Failed to load trajectory:', error)
  }
}

function drawTrajectoryOnMap() {
  if (!map || trajectoryStore.currentTrajectory.length === 0) return
  
  // Create trajectory line
  const coordinates = trajectoryStore.currentTrajectory.map(point =>
    fromLonLat([point.longitude, point.latitude])
  )
  
  const lineFeature = new Feature({
    geometry: new LineString(coordinates),
  })
  
  lineFeature.setStyle(new Style({
    stroke: new Stroke({
      color: 'rgba(62, 146, 204, 0.8)',
      width: 3,
    }),
  }))
  
  // Add to trails layer
  if (trailsLayer.value) {
    const source = trailsLayer.value.getSource()
    if (source) {
      // Clear existing trajectory
      source.clear()
      source.addFeature(lineFeature)
    }
  }
}

function handleFilterStatuses(statuses: number[]) {
  // TODO: Implement status filtering
  console.log('Filter statuses:', statuses)
}

function handleFilterSpeed(range: [number, number]) {
  // TODO: Implement speed filtering
  console.log('Filter speed:', range)
}

function updateVessels() {
  // Update target positions for smooth interpolation
  wsStore.vessels.forEach((vessel) => {
    const existing = vesselPositions.get(vessel.mmsi)
    if (existing) {
      existing.target = vessel
      existing.lastUpdate = Date.now()
    } else {
      vesselPositions.set(vessel.mmsi, {
        current: vessel,
        target: vessel,
        lastUpdate: Date.now(),
      })
    }
  })

  // Remove vessels that no longer exist
  vesselPositions.forEach((_, mmsi) => {
    if (!wsStore.vessels.has(mmsi)) {
      vesselPositions.delete(mmsi)
    }
  })
}

function updateTrails() {
  if (!trailsLayer.value || !showTrails.value) return

  const source = trailsLayer.value.getSource()
  if (!source) return

  source.clear()

  wsStore.vesselTrails.forEach((trail) => {
    if (trail.positions.length < 2) return

    const coordinates = trail.positions.map(pos => fromLonLat([pos.lon, pos.lat]))
    
    const lineFeature = new Feature({
      geometry: new LineString(coordinates),
      mmsi: trail.mmsi,
    })

    source.addFeature(lineFeature)
  })
}

function startAnimationLoop() {
  function animate() {
    if (!vesselsLayer.value) {
      animationFrameId = requestAnimationFrame(animate)
      return
    }

    const source = vesselsLayer.value.getSource()
    if (!source) {
      animationFrameId = requestAnimationFrame(animate)
      return
    }

    const now = Date.now()
    source.clear()

    vesselPositions.forEach((vesselData, mmsi) => {
      const { current, target, lastUpdate } = vesselData
      const timeSinceUpdate = now - lastUpdate
      const interpolationFactor = Math.min(timeSinceUpdate / 100, 1) // Smooth over 100ms

      // Interpolate position
      const lat = current.latitude + (target.latitude - current.latitude) * interpolationFactor
      const lon = current.longitude + (target.longitude - current.longitude) * interpolationFactor
      const course = current.course + (target.course - current.course) * interpolationFactor

      const interpolatedVessel: VesselPosition = {
        ...target,
        latitude: lat,
        longitude: lon,
        course: course,
      }

      // Update current position
      vesselData.current = interpolatedVessel

      const feature = new Feature({
        geometry: new Point(fromLonLat([lon, lat])),
        vessel: interpolatedVessel,
      })

      feature.setId(mmsi)
      source.addFeature(feature)
    })

    // Update trails periodically (every 60 frames = 1 second)
    if (Math.floor(now / 1000) !== Math.floor((now - 16) / 1000)) {
      updateTrails()
    }

    animationFrameId = requestAnimationFrame(animate)
  }

  animate()
}

function centerOnVessel(vessel: VesselPosition) {
  if (!map) return

  map.getView().animate({
    center: fromLonLat([vessel.longitude, vessel.latitude]),
    zoom: 12,
    duration: 1000,
  })
}

async function toggleLayer(layer: EncLayer) {
  if (visibleLayers.value.has(layer.id)) {
    // Hide layer
    const olLayer = encLayersMap.get(layer.id)
    if (olLayer && map) {
      map.removeLayer(olLayer as any)
    }
    encLayersMap.delete(layer.id)
    visibleLayers.value.delete(layer.id)
  } else {
    // Show layer
    try {
      const geoJson = await encStore.getLayerGeoJSON(layer.id)
      
      const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(geoJson, {
          featureProjection: 'EPSG:3857',
        }) as Feature[],
      })

      const vectorLayer = new VectorLayer({
        source: vectorSource as any,
        style: new Style({
          stroke: new Stroke({
            color: '#0A2463',
            width: 2,
          }),
          fill: new Fill({
            color: 'rgba(62, 146, 204, 0.2)',
          }),
        }),
      })

      if (map) {
        map.addLayer(vectorLayer as any)
        
        // Zoom to layer extent
        const extent = vectorSource.getExtent()
        map.getView().fit(extent, { padding: [50, 50, 50, 50] })
      }

      encLayersMap.set(layer.id, vectorLayer)
      visibleLayers.value.add(layer.id)
    } catch (error) {
      console.error('Failed to load layer:', error)
    }
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
  }
}

async function uploadFile() {
  if (!selectedFile.value) return

  try {
    await encStore.uploadEncFile(selectedFile.value)
    showUploadDialog.value = false
    selectedFile.value = null
  } catch (error) {
    console.error('Upload failed:', error)
  }
}

async function deleteLayer(id: number) {
  if (!confirm('Are you sure you want to delete this layer?')) return

  try {
    // Hide layer if visible
    if (visibleLayers.value.has(id)) {
      const olLayer = encLayersMap.get(id)
      if (olLayer && map) {
        map.removeLayer(olLayer as any)
      }
      encLayersMap.delete(id)
      visibleLayers.value.delete(id)
    }

    await encStore.deleteLayer(id)
  } catch (error) {
    console.error('Delete failed:', error)
  }
}

async function handleDeleteVessel(mmsi: string) {
  try {
    console.log('Delete vessel:', mmsi)
    // TODO: Implement vessel deletion
  } catch (error) {
    console.error('Delete failed:', error)
  }
}

async function handleHeatmapToggle(active: boolean) {
  if (active) {
    await loadHeatmapData('24h')
  } else {
    clearHeatmap()
  }
}

async function handleHeatmapRangeChange(range: string) {
  await loadHeatmapData(range)
}

async function loadHeatmapData(range: string) {
  if (!heatmapControl.value) return
  
  heatmapControl.value.setLoading(true)
  
  try {
    const endTime = new Date()
    const startTime = new Date()
    
    // Calculate start time based on range
    switch (range) {
      case '1h':
        startTime.setHours(endTime.getHours() - 1)
        break
      case '6h':
        startTime.setHours(endTime.getHours() - 6)
        break
      case '24h':
        startTime.setHours(endTime.getHours() - 24)
        break
      case '7d':
        startTime.setDate(endTime.getDate() - 7)
        break
      case '30d':
        startTime.setDate(endTime.getDate() - 30)
        break
    }
    
    const data = await trajectoryStore.fetchHeatmapData(startTime, endTime, 0.01)
    
    heatmapControl.value.setPointCount(data.length)
    
    // Draw heatmap on map
    drawHeatmap(data)
  } catch (error) {
    console.error('Failed to load heatmap:', error)
  } finally {
    heatmapControl.value.setLoading(false)
  }
}

function drawHeatmap(data: Array<{ latitude: number; longitude: number; count: number }>) {
  if (!map) return
  
  // Clear existing heatmap
  if (heatmapLayer.value) {
    map.removeLayer(heatmapLayer.value)
  }
  
  // Create features from heatmap data
  const features = data.map(point => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([point.longitude, point.latitude])),
      weight: point.count,
    })
    return feature
  })
  
  // Create heatmap layer
  const source = new VectorSource({
    features,
  })
  
  // Use a simple circle style with opacity based on count
  const maxCount = Math.max(...data.map(p => p.count))
  
  const layer = new VectorLayer({
    source,
    style: (feature) => {
      const weight = feature.get('weight') || 1
      const opacity = Math.min(weight / maxCount, 1)
      const radius = Math.log(weight + 1) * 3
      
      return new Style({
        image: new Circle({
          radius,
          fill: new Fill({
            color: `rgba(255, 0, 0, ${opacity * 0.6})`,
          }),
        }),
      })
    },
    zIndex: 5,
  })
  
  heatmapLayer.value = layer
  map.addLayer(layer)
}

function clearHeatmap() {
  if (map && heatmapLayer.value) {
    map.removeLayer(heatmapLayer.value)
    heatmapLayer.value = null
  }
}

async function handlePredictTrajectory(vessel: VesselPosition) {
  try {
    // Predict trajectory for next 60 minutes
    await predictionStore.fetchPrediction(vessel.mmsi, 60, 5)
    
    // Draw predicted trajectory on map
    drawPredictedTrajectory()
    
    // Check for anomalies
    await predictionStore.fetchAnomalies(vessel.mmsi)
  } catch (error) {
    console.error('Failed to predict trajectory:', error)
  }
}

function drawPredictedTrajectory() {
  if (!map || !predictionStore.currentPrediction) return
  
  const prediction = predictionStore.currentPrediction
  
  // Create line from predicted points
  const coordinates = prediction.predictedPoints.map(point =>
    fromLonLat([point.longitude, point.latitude])
  )
  
  const lineFeature = new Feature({
    geometry: new LineString(coordinates),
  })
  
  // Style with dashed line to differentiate from historical trajectory
  lineFeature.setStyle(new Style({
    stroke: new Stroke({
      color: 'rgba(245, 158, 11, 0.8)',
      width: 3,
      lineDash: [10, 5],
    }),
  }))
  
  // Add to trails layer
  if (trailsLayer.value) {
    const source = trailsLayer.value.getSource()
    if (source) {
      source.addFeature(lineFeature)
    }
  }
  
  // If there's an ETA destination, add a marker
  if (prediction.estimatedArrival) {
    const destFeature = new Feature({
      geometry: new Point(fromLonLat([
        prediction.estimatedArrival.longitude,
        prediction.estimatedArrival.latitude
      ])),
    })
    
    destFeature.setStyle(new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({
          color: 'rgba(245, 158, 11, 0.8)',
        }),
        stroke: new Stroke({
          color: 'white',
          width: 2,
        }),
      }),
    }))
    
    if (trailsLayer.value) {
      const source = trailsLayer.value.getSource()
      if (source) {
        source.addFeature(destFeature)
      }
    }
  }
}

async function toggleWeather() {
  weatherStore.toggleWeatherWidget()
  
  if (weatherStore.showWeatherWidget && !weatherStore.hasWeatherData) {
    // Get map center coordinates
    if (map) {
      const view = map.getView()
      const center = view.getCenter()
      if (center) {
        const [lon, lat] = toLonLat(center)
        await weatherStore.refreshWeatherData(lat, lon)
      }
    }
  }
}
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.map-view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* Top Bar */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(180deg, rgba(10, 36, 99, 0.95) 0%, rgba(10, 36, 99, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(62, 146, 204, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.1em;
  margin: 0;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-connected {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-disconnected {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.top-bar-right {
  display: flex;
  gap: 0.75rem;
}

.icon-button {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.alerts-button {
  position: relative;
}

.alert-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
  background: #f59e0b;
  border: 2px solid rgba(10, 36, 99, 0.95);
  border-radius: 0.625rem;
  font-size: 0.625rem;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse-badge 2s infinite;
}

.alert-badge.critical {
  background: #dc2626;
  animation: pulse-critical-badge 1s infinite;
}

@keyframes pulse-badge {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes pulse-critical-badge {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 0 0 4px rgba(220, 38, 38, 0);
  }
}

.badge-count {
  background: #ef4444;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  margin-left: 0.5rem;
  min-width: 1.25rem;
  text-align: center;
}

.badge-active {
  background: #10b981;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  margin-left: 0.5rem;
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}

/* Search Bar Container */
.search-bar-container {
  position: absolute;
  top: 76px;
  left: 1rem;
  right: 1rem;
  display: flex;
  gap: 1rem;
  z-index: 900;
}

.search-bar-compact {
  flex: 1;
  max-width: 500px;
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(10, 36, 99, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(62, 146, 204, 0.3);
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.search-icon {
  position: absolute;
  left: 1rem;
  width: 1.25rem;
  height: 1.25rem;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

.search-input-compact {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  background: transparent;
  border: none;
  color: white;
  font-size: 0.875rem;
  outline: none;
}

.search-input-compact::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.clear-button {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: color 0.2s;
}

.clear-button:hover {
  color: white;
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.action-button {
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

.action-button:hover {
  background: rgba(62, 146, 204, 0.2);
  border-color: rgba(62, 146, 204, 0.5);
}

.action-button.active {
  background: rgba(62, 146, 204, 0.3);
  border-color: rgba(62, 146, 204, 0.6);
}

.checkbox-hidden {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.badge-active {
  padding: 0.125rem 0.5rem;
  background: rgba(16, 185, 129, 0.3);
  color: #10b981;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.vessel-count-badge {
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
  font-weight: 600;
}

/* Filters Panel */
.filters-panel {
  position: absolute;
  top: 136px;
  left: 1rem;
  width: 350px;
  max-height: calc(100vh - 160px);
  background: rgba(10, 36, 99, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(62, 146, 204, 0.3);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 1rem;
  overflow-y: auto;
  z-index: 850;
}

/* Alerts Panel Container */
.alerts-panel-container {
  position: absolute;
  top: 76px;
  right: 1rem;
  width: 450px;
  max-height: calc(100vh - 92px);
  background: rgba(10, 36, 99, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(62, 146, 204, 0.3);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 950;
}

/* Timeline Container */
.timeline-container {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 2rem);
  max-width: 900px;
  z-index: 900;
}

/* Anomaly Notifications */
.anomaly-notifications {
  position: fixed;
  top: 76px;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 1000;
  pointer-events: none;
}

.anomaly-notifications > * {
  pointer-events: auto;
}

/* Control Panel (New Collapsible) */
.control-panel-new {
  position: absolute;
  top: 76px;
  right: 1rem;
  width: 350px;
  max-height: calc(100vh - 92px);
  background: rgba(10, 36, 99, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(62, 146, 204, 0.3);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 900;
}

.panel-header-new {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.close-button-panel {
  padding: 0.375rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.close-button-panel:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Transitions */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from {
  transform: translate(-50%, 100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translate(-50%, 100%);
  opacity: 0;
}

/* Old styles kept for compatibility */
.control-panel {
  display: none;
}

#map {
  width: 100%;
  height: 100%;
}

.control-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 400px;
  max-height: calc(100vh - 2rem);
  background: rgba(10, 36, 99, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab {
  flex: 1;
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
}

.tab-active {
  color: white;
  background: rgba(62, 146, 204, 0.2);
  border-bottom: 2px solid #3E92CC;
}

.tab-content {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.layer-item,
.vessel-item {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.vessel-item {
  cursor: pointer;
}

.vessel-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nmea-log {
  max-height: 400px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.25rem;
  padding: 0.5rem;
}

.nmea-message {
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nmea-message:last-child {
  border-bottom: none;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3E92CC;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2d7ab8;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #0A2463;
  padding: 2rem;
  border-radius: 0.5rem;
  max-width: 500px;
  width: 90%;
  color: white;
}

.file-input {
  width: 100%;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: white;
}

.file-input::file-selector-button {
  padding: 0.5rem 1rem;
  background: #3E92CC;
  border: none;
  border-radius: 0.25rem;
  color: white;
  cursor: pointer;
  margin-right: 1rem;
}

.checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  accent-color: #3E92CC;
}
</style>

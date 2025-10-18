<template>
  <div class="vessel-filters">
    <!-- Search Bar -->
    <div class="search-bar">
      <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by MMSI, name, or IMO..."
        class="search-input"
        @input="$emit('search', searchQuery)"
      />
      <button v-if="searchQuery" @click="clearSearch" class="clear-button">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Filter by Type -->
    <div class="filter-section">
      <h4 class="filter-title">Vessel Type</h4>
      <div class="filter-options">
        <label v-for="type in vesselTypes" :key="type.value" class="filter-option">
          <input
            type="checkbox"
            :value="type.value"
            v-model="selectedTypes"
            @change="$emit('filterTypes', selectedTypes)"
            class="checkbox"
          />
          <span>{{ type.label }}</span>
          <span class="count">({{ type.count }})</span>
        </label>
      </div>
    </div>

    <!-- Filter by Status -->
    <div class="filter-section">
      <h4 class="filter-title">Navigation Status</h4>
      <div class="filter-options">
        <label v-for="status in navigationStatuses" :key="status.value" class="filter-option">
          <input
            type="checkbox"
            :value="status.value"
            v-model="selectedStatuses"
            @change="$emit('filterStatuses', selectedStatuses)"
            class="checkbox"
          />
          <span class="status-dot" :style="{ backgroundColor: status.color }"></span>
          <span>{{ status.label }}</span>
          <span class="count">({{ status.count }})</span>
        </label>
      </div>
    </div>

    <!-- Speed Range Filter -->
    <div class="filter-section">
      <h4 class="filter-title">Speed Range</h4>
      <div class="range-filter">
        <input
          type="range"
          v-model.number="speedRange[0]"
          min="0"
          max="50"
          step="1"
          @input="$emit('filterSpeed', speedRange)"
          class="range-input"
        />
        <div class="range-labels">
          <span>{{ speedRange[0] }} kts</span>
          <span>{{ speedRange[1] }} kts</span>
        </div>
        <input
          type="range"
          v-model.number="speedRange[1]"
          min="0"
          max="50"
          step="1"
          @input="$emit('filterSpeed', speedRange)"
          class="range-input"
        />
      </div>
    </div>

    <!-- Reset Filters -->
    <button @click="resetFilters" class="reset-button">
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Reset Filters
    </button>

    <!-- Vessel Count -->
    <div class="vessel-count">
      Showing {{ filteredCount }} of {{ totalCount }} vessels
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { VesselCategory, getNavigationStatusColor, getNavigationStatusName } from '@/types/vessel'

const props = defineProps<{
  vessels: Map<string, any>
  filteredCount: number
}>()

const emit = defineEmits<{
  search: [query: string]
  filterTypes: [types: string[]]
  filterStatuses: [statuses: number[]]
  filterSpeed: [range: [number, number]]
}>()

const searchQuery = ref('')
const selectedTypes = ref<string[]>([])
const selectedStatuses = ref<number[]>([])
const speedRange = ref<[number, number]>([0, 50])

const totalCount = computed(() => props.vessels.size)

const vesselTypes = computed(() => {
  const counts: Record<string, number> = {}
  props.vessels.forEach(vessel => {
    const category = vessel.vesselType ? getVesselCategory(vessel.vesselType) : 'UNKNOWN'
    counts[category] = (counts[category] || 0) + 1
  })

  return [
    { value: VesselCategory.CARGO, label: 'Cargo', count: counts[VesselCategory.CARGO] || 0 },
    { value: VesselCategory.TANKER, label: 'Tanker', count: counts[VesselCategory.TANKER] || 0 },
    { value: VesselCategory.PASSENGER, label: 'Passenger', count: counts[VesselCategory.PASSENGER] || 0 },
    { value: VesselCategory.FISHING, label: 'Fishing', count: counts[VesselCategory.FISHING] || 0 },
    { value: VesselCategory.HSC, label: 'High Speed', count: counts[VesselCategory.HSC] || 0 },
    { value: VesselCategory.SPECIAL, label: 'Special', count: counts[VesselCategory.SPECIAL] || 0 },
    { value: VesselCategory.OTHER, label: 'Other', count: counts[VesselCategory.OTHER] || 0 },
  ]
})

const navigationStatuses = computed(() => {
  const counts: Record<number, number> = {}
  props.vessels.forEach(vessel => {
    const status = vessel.navigationStatus ?? 15
    counts[status] = (counts[status] || 0) + 1
  })

  return [
    { value: 0, label: 'Under way', color: getNavigationStatusColor(0), count: counts[0] || 0 },
    { value: 1, label: 'At anchor', color: getNavigationStatusColor(1), count: counts[1] || 0 },
    { value: 5, label: 'Moored', color: getNavigationStatusColor(5), count: counts[5] || 0 },
    { value: 7, label: 'Fishing', color: getNavigationStatusColor(7), count: counts[7] || 0 },
  ]
})

function getVesselCategory(type: number): string {
  if (type >= 30 && type <= 39) return VesselCategory.FISHING
  if (type >= 40 && type <= 49) return VesselCategory.HSC
  if (type >= 50 && type <= 59) return VesselCategory.SPECIAL
  if (type >= 60 && type <= 69) return VesselCategory.PASSENGER
  if (type >= 70 && type <= 79) return VesselCategory.CARGO
  if (type >= 80 && type <= 89) return VesselCategory.TANKER
  if (type >= 90 && type <= 99) return VesselCategory.OTHER
  return VesselCategory.UNKNOWN
}

function clearSearch() {
  searchQuery.value = ''
  emit('search', '')
}

function resetFilters() {
  searchQuery.value = ''
  selectedTypes.value = []
  selectedStatuses.value = []
  speedRange.value = [0, 50]
  emit('search', '')
  emit('filterTypes', [])
  emit('filterStatuses', [])
  emit('filterSpeed', [0, 50])
}
</script>

<style scoped>
.vessel-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  width: 1.25rem;
  height: 1.25rem;
  color: rgba(255, 255, 255, 0.5);
}

.search-input {
  width: 100%;
  padding: 0.625rem 0.75rem 0.625rem 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: white;
  font-size: 0.875rem;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.search-input:focus {
  outline: none;
  border-color: #3E92CC;
  background: rgba(255, 255, 255, 0.15);
}

.clear-button {
  position: absolute;
  right: 0.5rem;
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: color 0.2s;
}

.clear-button:hover {
  color: white;
}

.icon {
  width: 1rem;
  height: 1rem;
}

.filter-section {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.375rem;
}

.filter-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #3E92CC;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: color 0.2s;
}

.filter-option:hover {
  color: #3E92CC;
}

.checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  accent-color: #3E92CC;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.count {
  margin-left: auto;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.range-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.range-input {
  width: 100%;
  accent-color: #3E92CC;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

.reset-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 0.375rem;
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
}

.vessel-count {
  text-align: center;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.375rem;
}
</style>

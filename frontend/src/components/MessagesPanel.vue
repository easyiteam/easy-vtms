<template>
  <Transition name="slide-right">
    <div v-if="vtsStore.showMessagesPanel" class="messages-panel">
      <!-- Header -->
      <div class="panel-header">
        <div class="header-left">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 class="panel-title">VTS Messages</h3>
          <span v-if="vtsStore.unreadCount > 0" class="unread-badge">{{ vtsStore.unreadCount }}</span>
        </div>
        <div class="header-actions">
          <button @click="vtsStore.openComposeDialog()" class="icon-button" title="New Message">
            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button @click="refresh" class="icon-button" title="Refresh">
            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button @click="vtsStore.toggleMessagesPanel()" class="icon-button" title="Close">
            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <select v-model="filterType" class="filter-select">
          <option value="">All Types</option>
          <option value="instruction">Instructions</option>
          <option value="information">Information</option>
          <option value="warning">Warnings</option>
          <option value="clearance">Clearances</option>
          <option value="emergency">Emergency</option>
        </select>
        <select v-model="filterStatus" class="filter-select">
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="read">Read</option>
          <option value="acknowledged">Acknowledged</option>
        </select>
      </div>

      <!-- Messages List -->
      <div class="messages-list">
        <div v-if="vtsStore.loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading messages...</p>
        </div>

        <div v-else-if="filteredMessages.length === 0" class="empty-state">
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>No messages</p>
        </div>

        <div
          v-for="message in filteredMessages"
          :key="message.id"
          :class="['message-item', { 
            unread: message.status === 'sent' || message.status === 'delivered',
            selected: vtsStore.selectedMessage?.id === message.id,
            urgent: message.priority === 'urgent' || message.priority === 'emergency'
          }]"
          @click="vtsStore.selectMessage(message)"
        >
          <div class="message-header">
            <div class="message-meta">
              <span :class="['priority-badge', message.priority]">
                {{ message.priority }}
              </span>
              <span :class="['type-badge', message.type]">
                {{ message.type }}
              </span>
            </div>
            <span class="message-time">{{ formatTime(message.createdAt) }}</span>
          </div>
          
          <div class="message-subject">{{ message.subject }}</div>
          
          <div class="message-sender">
            From: {{ message.senderName || message.senderType }}
            <span v-if="message.senderMmsi">({{ message.senderMmsi }})</span>
          </div>

          <div class="message-actions">
            <button
              v-if="message.status === 'sent' || message.status === 'delivered'"
              @click.stop="vtsStore.acknowledgeMessage(message.id)"
              class="action-btn acknowledge"
            >
              Acknowledge
            </button>
            <button
              @click.stop="vtsStore.deleteMessage(message.id)"
              class="action-btn delete"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Message Detail (if selected) -->
      <Transition name="slide-up">
        <div v-if="vtsStore.selectedMessage" class="message-detail">
          <div class="detail-header">
            <h4>{{ vtsStore.selectedMessage.subject }}</h4>
            <button @click="vtsStore.clearSelection()" class="icon-button">
              <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="detail-content">
            <div class="detail-row">
              <span class="label">From:</span>
              <span class="value">
                {{ vtsStore.selectedMessage.senderName || vtsStore.selectedMessage.senderType }}
                <span v-if="vtsStore.selectedMessage.senderMmsi">({{ vtsStore.selectedMessage.senderMmsi }})</span>
              </span>
            </div>
            
            <div class="detail-row">
              <span class="label">To:</span>
              <span class="value">
                {{ vtsStore.selectedMessage.recipientName || vtsStore.selectedMessage.recipientType }}
                <span v-if="vtsStore.selectedMessage.recipientMmsi">({{ vtsStore.selectedMessage.recipientMmsi }})</span>
              </span>
            </div>
            
            <div class="detail-row">
              <span class="label">Time:</span>
              <span class="value">{{ formatDateTime(vtsStore.selectedMessage.createdAt) }}</span>
            </div>
            
            <div v-if="vtsStore.selectedMessage.locationDescription" class="detail-row">
              <span class="label">Location:</span>
              <span class="value">{{ vtsStore.selectedMessage.locationDescription }}</span>
            </div>
            
            <div class="message-content">
              {{ vtsStore.selectedMessage.content }}
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVtsStore } from '@/stores/vts'

const vtsStore = useVtsStore()

const filterType = ref('')
const filterStatus = ref('')

const filteredMessages = computed(() => {
  let filtered = vtsStore.messages

  if (filterType.value) {
    filtered = filtered.filter(m => m.type === filterType.value)
  }

  if (filterStatus.value) {
    filtered = filtered.filter(m => m.status === filterStatus.value)
  }

  return filtered
})

async function refresh() {
  await vtsStore.fetchMessages()
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString()
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString()
}
</script>

<style scoped>
.messages-panel {
  position: absolute;
  top: 76px;
  right: 1rem;
  width: 400px;
  max-height: calc(100vh - 92px);
  background: rgba(10, 36, 99, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(62, 146, 204, 0.3);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  z-index: 960;
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

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.panel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.unread-badge {
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
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

.filters-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-select {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: white;
  padding: 0.5rem;
  font-size: 0.875rem;
}

.filter-select:focus {
  outline: none;
  border-color: rgba(62, 146, 204, 0.5);
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.5);
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(62, 146, 204, 1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
}

.message-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.message-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(62, 146, 204, 0.5);
}

.message-item.unread {
  border-left: 3px solid #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.message-item.urgent {
  border-left: 3px solid #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.message-item.selected {
  background: rgba(62, 146, 204, 0.2);
  border-color: rgba(62, 146, 204, 0.8);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.message-meta {
  display: flex;
  gap: 0.5rem;
}

.priority-badge,
.type-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
}

.priority-badge.emergency {
  background: #ef4444;
  color: white;
}

.priority-badge.urgent {
  background: #f59e0b;
  color: white;
}

.priority-badge.high {
  background: #eab308;
  color: black;
}

.priority-badge.normal {
  background: #3b82f6;
  color: white;
}

.priority-badge.low {
  background: #6b7280;
  color: white;
}

.type-badge {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.message-time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.message-subject {
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
}

.message-sender {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
}

.message-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.action-btn {
  flex: 1;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.acknowledge {
  background: #10b981;
  color: white;
}

.action-btn.acknowledge:hover {
  background: #059669;
}

.action-btn.delete {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.action-btn.delete:hover {
  background: #ef4444;
  color: white;
}

.message-detail {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  max-height: 50%;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-header h4 {
  margin: 0;
  color: white;
  font-size: 1rem;
}

.detail-content {
  padding: 1rem;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.detail-row .label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  min-width: 80px;
}

.detail-row .value {
  color: white;
}

.message-content {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.375rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Transitions */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>

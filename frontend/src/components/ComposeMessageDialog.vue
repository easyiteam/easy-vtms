<template>
  <Transition name="fade">
    <div v-if="vtsStore.showComposeDialog" class="dialog-overlay" @click.self="close">
      <div class="dialog-content">
        <!-- Header -->
        <div class="dialog-header">
          <h3>New Message</h3>
          <button @click="close" class="icon-button">
            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <div class="dialog-body">
          <div class="form-group">
            <label>Type</label>
            <select v-model="form.type" class="form-control">
              <option value="instruction">Instruction</option>
              <option value="information">Information</option>
              <option value="warning">Warning</option>
              <option value="clearance">Clearance</option>
              <option value="query">Query</option>
              <option value="response">Response</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div class="form-group">
            <label>Priority</label>
            <select v-model="form.priority" class="form-control">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div class="form-group">
            <label>Recipient Type</label>
            <select v-model="form.recipientType" class="form-control">
              <option value="vessel">Vessel</option>
              <option value="vts">VTS</option>
              <option value="port">Port</option>
              <option value="broadcast">Broadcast</option>
            </select>
          </div>

          <div v-if="form.recipientType === 'vessel'" class="form-group">
            <label>Vessel MMSI</label>
            <input v-model="form.recipientMmsi" type="text" class="form-control" placeholder="Enter MMSI" />
          </div>

          <div class="form-group">
            <label>Subject</label>
            <input v-model="form.subject" type="text" class="form-control" placeholder="Message subject" />
          </div>

          <div class="form-group">
            <label>Content</label>
            <textarea v-model="form.content" class="form-control" rows="6" placeholder="Message content"></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <button @click="close" class="btn btn-secondary">Cancel</button>
          <button @click="sendMessage" class="btn btn-primary" :disabled="!isValid">
            Send Message
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVtsStore, MessageType, MessagePriority } from '@/stores/vts'

const vtsStore = useVtsStore()

const form = ref({
  type: MessageType.INFORMATION,
  priority: MessagePriority.NORMAL,
  subject: '',
  content: '',
  recipientType: 'vessel' as 'vts' | 'vessel' | 'port' | 'broadcast',
  recipientMmsi: '',
})

const isValid = computed(() => {
  return form.value.subject.trim() !== '' && form.value.content.trim() !== ''
})

function close() {
  vtsStore.closeComposeDialog()
  resetForm()
}

function resetForm() {
  form.value = {
    type: MessageType.INFORMATION,
    priority: MessagePriority.NORMAL,
    subject: '',
    content: '',
    recipientType: 'vessel',
    recipientMmsi: '',
  }
}

async function sendMessage() {
  if (!isValid.value) return

  try {
    const message = await vtsStore.createMessage({
      type: form.value.type,
      priority: form.value.priority,
      subject: form.value.subject,
      content: form.value.content,
      senderType: 'vts',
      senderName: 'VTS Control',
      recipientType: form.value.recipientType,
      recipientMmsi: form.value.recipientType === 'vessel' ? form.value.recipientMmsi : undefined,
    })

    // Send the message immediately
    await vtsStore.sendMessage(message.id)

    close()
  } catch (error) {
    console.error('Failed to send message:', error)
    alert('Failed to send message. Please try again.')
  }
}
</script>

<style scoped>
.dialog-overlay {
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
  padding: 1rem;
}

.dialog-content {
  background: rgba(10, 36, 99, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(62, 146, 204, 0.5);
  border-radius: 0.5rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-header h3 {
  margin: 0;
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
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

.icon-sm {
  width: 1.25rem;
  height: 1.25rem;
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  font-weight: 600;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: white;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: rgba(62, 146, 204, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.form-control::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

textarea.form-control {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

select.form-control {
  cursor: pointer;
}

.dialog-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: rgba(59, 130, 246, 0.5);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .dialog-content,
.fade-leave-active .dialog-content {
  transition: transform 0.3s ease;
}

.fade-enter-from .dialog-content {
  transform: scale(0.9);
}

.fade-leave-to .dialog-content {
  transform: scale(0.9);
}
</style>

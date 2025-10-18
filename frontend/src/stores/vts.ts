import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export enum MessageType {
  INSTRUCTION = 'instruction',
  INFORMATION = 'information',
  WARNING = 'warning',
  CLEARANCE = 'clearance',
  QUERY = 'query',
  RESPONSE = 'response',
  EMERGENCY = 'emergency',
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}

export enum MessageStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  ACKNOWLEDGED = 'acknowledged',
  ARCHIVED = 'archived',
}

export interface VtsMessage {
  id: string
  type: MessageType
  priority: MessagePriority
  status: MessageStatus
  subject: string
  content: string
  senderType: 'vts' | 'vessel' | 'port' | 'system'
  senderName?: string
  senderMmsi?: string
  recipientType: 'vts' | 'vessel' | 'port' | 'broadcast'
  recipientName?: string
  recipientMmsi?: string
  templateId?: string
  templateData?: Record<string, any>
  latitude?: number
  longitude?: number
  locationDescription?: string
  deliveredAt?: string
  readAt?: string
  acknowledgedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface MessageTemplate {
  id: string
  code: string
  name: string
  description?: string
  type: MessageType
  priority: MessagePriority
  category: string
  subjectTemplate: string
  contentTemplate: string
  variables: Array<{
    name: string
    label: string
    type: 'text' | 'number' | 'date' | 'select' | 'vessel' | 'location'
    required: boolean
    defaultValue?: any
    options?: string[]
    placeholder?: string
  }>
  usageCount: number
  lastUsedAt?: string
  isActive: boolean
  isStandard: boolean
}

export const useVtsStore = defineStore('vts', () => {
  // State
  const messages = ref<VtsMessage[]>([])
  const templates = ref<MessageTemplate[]>([])
  const selectedMessage = ref<VtsMessage | null>(null)
  const showMessagesPanel = ref(false)
  const showComposeDialog = ref(false)
  const loading = ref(false)

  // Computed
  const unreadMessages = computed(() =>
    messages.value.filter(m => m.status === MessageStatus.SENT || m.status === MessageStatus.DELIVERED)
  )

  const unreadCount = computed(() => unreadMessages.value.length)

  const urgentMessages = computed(() =>
    messages.value.filter(m => 
      m.priority === MessagePriority.URGENT || m.priority === MessagePriority.EMERGENCY
    )
  )

  const messagesByType = computed(() => {
    const grouped: Record<string, VtsMessage[]> = {}
    messages.value.forEach(msg => {
      if (!grouped[msg.type]) {
        grouped[msg.type] = []
      }
      grouped[msg.type].push(msg)
    })
    return grouped
  })

  const templatesByCategory = computed(() => {
    const grouped: Record<string, MessageTemplate[]> = {}
    templates.value.forEach(tpl => {
      if (!grouped[tpl.category]) {
        grouped[tpl.category] = []
      }
      grouped[tpl.category].push(tpl)
    })
    return grouped
  })

  // Actions
  async function fetchMessages(mmsi?: string) {
    loading.value = true
    try {
      const params: any = {}
      if (mmsi) params.mmsi = mmsi

      const response = await axios.get<VtsMessage[]>(
        `${API_BASE}/api/vts/messages`,
        { params }
      )
      messages.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchTemplates(category?: string) {
    try {
      const params: any = {}
      if (category) params.category = category

      const response = await axios.get<MessageTemplate[]>(
        `${API_BASE}/api/vts/templates`,
        { params }
      )
      templates.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to fetch templates:', error)
      throw error
    }
  }

  async function createMessage(data: {
    type: MessageType
    priority: MessagePriority
    subject: string
    content: string
    senderType: 'vts' | 'vessel' | 'port' | 'system'
    senderName?: string
    senderMmsi?: string
    recipientType: 'vts' | 'vessel' | 'port' | 'broadcast'
    recipientName?: string
    recipientMmsi?: string
    latitude?: number
    longitude?: number
    locationDescription?: string
  }) {
    try {
      const response = await axios.post<VtsMessage>(
        `${API_BASE}/api/vts/messages`,
        data
      )
      messages.value.unshift(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to create message:', error)
      throw error
    }
  }

  async function createMessageFromTemplate(
    templateId: string,
    data: Record<string, any>,
    sender: { type: string; name?: string; mmsi?: string },
    recipient: { type: string; name?: string; mmsi?: string }
  ) {
    try {
      const response = await axios.post<VtsMessage>(
        `${API_BASE}/api/vts/messages/from-template`,
        { templateId, data, sender, recipient }
      )
      messages.value.unshift(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to create message from template:', error)
      throw error
    }
  }

  async function sendMessage(messageId: string) {
    try {
      const response = await axios.put<VtsMessage>(
        `${API_BASE}/api/vts/messages/${messageId}/send`
      )
      
      const index = messages.value.findIndex(m => m.id === messageId)
      if (index !== -1) {
        messages.value[index] = response.data
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }

  async function markAsRead(messageId: string) {
    try {
      const response = await axios.put<VtsMessage>(
        `${API_BASE}/api/vts/messages/${messageId}/read`
      )
      
      const index = messages.value.findIndex(m => m.id === messageId)
      if (index !== -1) {
        messages.value[index] = response.data
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to mark message as read:', error)
      throw error
    }
  }

  async function acknowledgeMessage(messageId: string) {
    try {
      const response = await axios.put<VtsMessage>(
        `${API_BASE}/api/vts/messages/${messageId}/acknowledge`
      )
      
      const index = messages.value.findIndex(m => m.id === messageId)
      if (index !== -1) {
        messages.value[index] = response.data
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to acknowledge message:', error)
      throw error
    }
  }

  async function deleteMessage(messageId: string) {
    try {
      await axios.delete(`${API_BASE}/api/vts/messages/${messageId}`)
      
      const index = messages.value.findIndex(m => m.id === messageId)
      if (index !== -1) {
        messages.value.splice(index, 1)
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
      throw error
    }
  }

  function toggleMessagesPanel() {
    showMessagesPanel.value = !showMessagesPanel.value
  }

  function openComposeDialog(template?: MessageTemplate) {
    showComposeDialog.value = true
    if (template) {
      // Pre-fill with template data
    }
  }

  function closeComposeDialog() {
    showComposeDialog.value = false
  }

  function selectMessage(message: VtsMessage) {
    selectedMessage.value = message
    if (message.status === MessageStatus.SENT || message.status === MessageStatus.DELIVERED) {
      markAsRead(message.id)
    }
  }

  function clearSelection() {
    selectedMessage.value = null
  }

  // Auto-refresh messages
  let refreshInterval: number | null = null

  function startAutoRefresh(mmsi?: string, intervalMs: number = 30000) { // 30 seconds
    if (refreshInterval) {
      stopAutoRefresh()
    }

    // Initial fetch
    fetchMessages(mmsi)

    // Then refresh periodically
    refreshInterval = window.setInterval(() => {
      fetchMessages(mmsi)
    }, intervalMs)
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  return {
    // State
    messages,
    templates,
    selectedMessage,
    showMessagesPanel,
    showComposeDialog,
    loading,
    
    // Computed
    unreadMessages,
    unreadCount,
    urgentMessages,
    messagesByType,
    templatesByCategory,
    
    // Actions
    fetchMessages,
    fetchTemplates,
    createMessage,
    createMessageFromTemplate,
    sendMessage,
    markAsRead,
    acknowledgeMessage,
    deleteMessage,
    toggleMessagesPanel,
    openComposeDialog,
    closeComposeDialog,
    selectMessage,
    clearSelection,
    startAutoRefresh,
    stopAutoRefresh,
  }
})

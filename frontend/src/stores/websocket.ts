import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io, Socket } from 'socket.io-client'

export interface VesselPosition {
  // Identification
  mmsi: string
  imoNumber?: string
  callSign?: string
  name: string
  
  // Vessel characteristics
  vesselType?: number
  length?: number
  width?: number
  height?: number
  draught?: number
  
  // Position & movement
  latitude: number
  longitude: number
  speed: number
  course: number
  heading: number
  rateOfTurn?: number
  
  // Navigation
  navigationStatus?: number
  destination?: string
  eta?: Date
  timestamp: Date
}

export interface NmeaData {
  type: string
  timestamp: Date
  latitude?: number
  longitude?: number
  speed?: number
  course?: number
  mmsi?: string
  vesselName?: string
  raw?: string
}

export interface VesselTrail {
  mmsi: string
  positions: Array<{ lat: number; lon: number; timestamp: Date }>
  maxLength: number
}

export const useWebSocketStore = defineStore('websocket', () => {
  const socket = ref<Socket | null>(null)
  const connected = ref(false)
  const vessels = ref<Map<string, VesselPosition>>(new Map())
  const vesselTrails = ref<Map<string, VesselTrail>>(new Map())
  const nmeaMessages = ref<NmeaData[]>([])

  const connect = () => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000'
    
    socket.value = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.value.on('connect', () => {
      console.log('✅ WebSocket connected')
      connected.value = true
    })

    socket.value.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
      connected.value = false
    })

    socket.value.on('vessel:position', (data: VesselPosition) => {
      const vesselData = {
        ...data,
        timestamp: new Date(data.timestamp),
      }
      vessels.value.set(data.mmsi, vesselData)
      
      // Update trail
      let trail = vesselTrails.value.get(data.mmsi)
      if (!trail) {
        trail = {
          mmsi: data.mmsi,
          positions: [],
          maxLength: 50, // Keep last 50 positions
        }
        vesselTrails.value.set(data.mmsi, trail)
      }
      
      // Add new position to trail (only if position changed significantly)
      const lastPos = trail.positions[trail.positions.length - 1]
      const distanceThreshold = 0.0001 // ~10 meters
      
      if (!lastPos || 
          Math.abs(lastPos.lat - data.latitude) > distanceThreshold ||
          Math.abs(lastPos.lon - data.longitude) > distanceThreshold) {
        trail.positions.push({
          lat: data.latitude,
          lon: data.longitude,
          timestamp: vesselData.timestamp,
        })
        
        // Keep only last N positions
        if (trail.positions.length > trail.maxLength) {
          trail.positions.shift()
        }
      }
    })

    socket.value.on('nmea:data', (data: NmeaData) => {
      nmeaMessages.value.unshift({
        ...data,
        timestamp: new Date(data.timestamp),
      })
      
      // Keep only last 100 messages
      if (nmeaMessages.value.length > 100) {
        nmeaMessages.value = nmeaMessages.value.slice(0, 100)
      }
    })

    socket.value.on('ais:data', (data: any) => {
      console.log('AIS data received:', data)
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      connected.value = false
    }
  }

  const startSimulation = () => {
    if (socket.value) {
      socket.value.emit('simulation:start')
    }
  }

  const stopSimulation = () => {
    if (socket.value) {
      socket.value.emit('simulation:stop')
    }
  }

  const sendNmea = (sentence: string) => {
    if (socket.value) {
      socket.value.emit('nmea:send', { sentence })
    }
  }

  return {
    socket,
    connected,
    vessels,
    vesselTrails,
    nmeaMessages,
    connect,
    disconnect,
    startSimulation,
    stopSimulation,
    sendNmea,
  }
})

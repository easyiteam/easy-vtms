import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface EncLayer {
  id: number
  name: string
  type: string
  createdAt: Date
  metadata?: any
}

export const useEncStore = defineStore('enc', () => {
  const layers = ref<EncLayer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const fetchLayers = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${apiUrl}/api/enc/layers`)
      layers.value = response.data.layers.map((layer: any) => ({
        ...layer,
        createdAt: new Date(layer.createdAt),
      }))
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch layers'
      console.error('Error fetching layers:', err)
    } finally {
      loading.value = false
    }
  }

  const getLayerGeoJSON = async (id: number): Promise<any> => {
    try {
      const response = await axios.get(`${apiUrl}/api/enc/layers/${id}/geojson`)
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch GeoJSON'
      console.error('Error fetching GeoJSON:', err)
      throw err
    }
  }

  const uploadEncFile = async (file: File): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(`${apiUrl}/api/enc/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      console.log('Upload successful:', response.data)
      
      // Refresh layers list
      await fetchLayers()
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to upload file'
      console.error('Error uploading file:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteLayer = async (id: number): Promise<void> => {
    try {
      await axios.delete(`${apiUrl}/api/enc/layers/${id}`)
      
      // Refresh layers list
      await fetchLayers()
    } catch (err: any) {
      error.value = err.message || 'Failed to delete layer'
      console.error('Error deleting layer:', err)
      throw err
    }
  }

  return {
    layers,
    loading,
    error,
    fetchLayers,
    getLayerGeoJSON,
    uploadEncFile,
    deleteLayer,
  }
})

import { Icon, Style } from 'ol/style'
import type { VesselPosition } from '@/stores/websocket'
import { getNavigationStatusColor, getVesselCategory, VesselCategory } from '@/types/vessel'

function getVesselPath(category: VesselCategory): string {
  switch (category) {
    case VesselCategory.CARGO:
      // Cargo ship - rectangular with containers
      return `
        <rect x="14" y="12" width="12" height="14" />
        <rect x="15" y="8" width="10" height="4" />
        <path d="M 20 8 L 24 4 L 16 4 Z" />
      `
    
    case VesselCategory.TANKER:
      // Tanker - rounded hull
      return `
        <ellipse cx="20" cy="20" rx="6" ry="10" />
        <rect x="17" y="8" width="6" height="6" />
        <circle cx="20" cy="11" r="1.5" />
      `
    
    case VesselCategory.PASSENGER:
      // Passenger ship - multi-deck
      return `
        <path d="M 14 18 L 14 24 L 26 24 L 26 18 Z" />
        <rect x="15" y="14" width="10" height="4" />
        <rect x="16" y="10" width="8" height="4" />
        <path d="M 20 8 L 23 10 L 17 10 Z" />
      `
    
    case VesselCategory.FISHING:
      // Fishing vessel - with crane
      return `
        <path d="M 16 16 L 16 24 L 24 24 L 24 16 Z" />
        <line x1="24" y1="16" x2="28" y2="12" stroke-width="1.5" />
        <path d="M 20 12 L 22 16 L 18 16 Z" />
      `
    
    case VesselCategory.HSC:
      // High speed craft - sleek
      return `
        <path d="M 20 8 L 26 24 L 20 22 L 14 24 Z" />
        <ellipse cx="20" cy="16" rx="4" ry="6" />
      `
    
    case VesselCategory.SPECIAL:
      // Special vessels (pilot, SAR, etc.) - distinctive
      return `
        <rect x="17" y="14" width="6" height="12" rx="1" />
        <circle cx="20" cy="10" r="3" />
        <path d="M 18 10 L 20 8 L 22 10" fill="none" stroke-width="1" />
      `
    
    default:
      // Default generic ship
      return `
        <path d="M 20 8 L 28 28 L 20 25 L 12 28 Z" />
        <circle cx="20" cy="12" r="2" />
      `
  }
}

export function createVesselSVG(vessel: VesselPosition): string {
  const rotation = vessel.course || 0
  const color = getNavigationStatusColor(vessel.navigationStatus || 15)
  const category = getVesselCategory(vessel.vesselType || 0)
  const vesselPath = getVesselPath(category)
  
  return `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(20,20) rotate(${rotation}) translate(-20,-20)">
        <g fill="${color}" stroke="#ffffff" stroke-width="1.5">
          ${vesselPath}
        </g>
        <!-- Direction indicator -->
        <circle cx="20" cy="8" r="1.5" fill="#ffffff"/>
      </g>
    </svg>
  `
}

export function createVesselStyle(vessel: VesselPosition): Style {
  const svg = createVesselSVG(vessel)
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  
  return new Style({
    image: new Icon({
      src: svgUrl,
      scale: 1,
      anchor: [0.5, 0.5],
    }),
  })
}

// Vessel Type Enum (simplified categories)
export enum VesselCategory {
  UNKNOWN = 'UNKNOWN',
  FISHING = 'FISHING',
  HSC = 'HSC',
  SPECIAL = 'SPECIAL',
  PASSENGER = 'PASSENGER',
  CARGO = 'CARGO',
  TANKER = 'TANKER',
  OTHER = 'OTHER',
}

// Navigation Status Enum
export enum NavigationStatus {
  UNDERWAY_ENGINE = 0,
  AT_ANCHOR = 1,
  NOT_UNDER_COMMAND = 2,
  RESTRICTED_MANOEUVRABILITY = 3,
  CONSTRAINED_BY_DRAUGHT = 4,
  MOORED = 5,
  AGROUND = 6,
  FISHING = 7,
  UNDERWAY_SAILING = 8,
  RESERVED_HSC = 9,
  RESERVED_WIG = 10,
  RESERVED_11 = 11,
  RESERVED_12 = 12,
  RESERVED_13 = 13,
  AIS_SART = 14,
  NOT_DEFINED = 15,
}

// Helper functions
export function getVesselCategory(type: number): VesselCategory {
  if (type >= 30 && type <= 39) return VesselCategory.FISHING
  if (type >= 40 && type <= 49) return VesselCategory.HSC
  if (type >= 50 && type <= 59) return VesselCategory.SPECIAL
  if (type >= 60 && type <= 69) return VesselCategory.PASSENGER
  if (type >= 70 && type <= 79) return VesselCategory.CARGO
  if (type >= 80 && type <= 89) return VesselCategory.TANKER
  if (type >= 90 && type <= 99) return VesselCategory.OTHER
  return VesselCategory.UNKNOWN
}

export function getVesselTypeName(type: number): string {
  const category = getVesselCategory(type)
  
  switch (category) {
    case VesselCategory.FISHING: return 'Fishing'
    case VesselCategory.HSC: return 'High Speed Craft'
    case VesselCategory.PASSENGER: return 'Passenger'
    case VesselCategory.CARGO: return 'Cargo'
    case VesselCategory.TANKER: return 'Tanker'
    case VesselCategory.SPECIAL:
      if (type === 50) return 'Pilot'
      if (type === 51) return 'Search & Rescue'
      if (type === 52) return 'Tug'
      if (type === 58) return 'Medical'
      return 'Special'
    case VesselCategory.OTHER: return 'Other'
    default: return 'Unknown'
  }
}

export function getNavigationStatusName(status: number): string {
  switch (status) {
    case NavigationStatus.UNDERWAY_ENGINE:
      return 'Under way using engine'
    case NavigationStatus.AT_ANCHOR:
      return 'At anchor'
    case NavigationStatus.NOT_UNDER_COMMAND:
      return 'Not under command'
    case NavigationStatus.RESTRICTED_MANOEUVRABILITY:
      return 'Restricted manoeuvrability'
    case NavigationStatus.CONSTRAINED_BY_DRAUGHT:
      return 'Constrained by draught'
    case NavigationStatus.MOORED:
      return 'Moored'
    case NavigationStatus.AGROUND:
      return 'Aground'
    case NavigationStatus.FISHING:
      return 'Engaged in fishing'
    case NavigationStatus.UNDERWAY_SAILING:
      return 'Under way sailing'
    case NavigationStatus.AIS_SART:
      return 'AIS-SART'
    default:
      return 'Not defined'
  }
}

export function getNavigationStatusColor(status: number): string {
  switch (status) {
    case NavigationStatus.UNDERWAY_ENGINE:
    case NavigationStatus.UNDERWAY_SAILING:
      return '#10b981' // Green
    case NavigationStatus.AT_ANCHOR:
      return '#3b82f6' // Blue
    case NavigationStatus.MOORED:
      return '#6b7280' // Gray
    case NavigationStatus.NOT_UNDER_COMMAND:
    case NavigationStatus.AGROUND:
      return '#ef4444' // Red
    case NavigationStatus.RESTRICTED_MANOEUVRABILITY:
    case NavigationStatus.CONSTRAINED_BY_DRAUGHT:
      return '#f59e0b' // Orange
    case NavigationStatus.FISHING:
      return '#8b5cf6' // Purple
    case NavigationStatus.AIS_SART:
      return '#dc2626' // Dark red
    default:
      return '#9ca3af' // Light gray
  }
}

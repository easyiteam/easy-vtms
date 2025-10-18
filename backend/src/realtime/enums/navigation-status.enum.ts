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

// Helper function to get status name
export function getNavigationStatusName(status: NavigationStatus): string {
  switch (status) {
    case NavigationStatus.UNDERWAY_ENGINE:
      return 'Under way using engine';
    case NavigationStatus.AT_ANCHOR:
      return 'At anchor';
    case NavigationStatus.NOT_UNDER_COMMAND:
      return 'Not under command';
    case NavigationStatus.RESTRICTED_MANOEUVRABILITY:
      return 'Restricted manoeuvrability';
    case NavigationStatus.CONSTRAINED_BY_DRAUGHT:
      return 'Constrained by draught';
    case NavigationStatus.MOORED:
      return 'Moored';
    case NavigationStatus.AGROUND:
      return 'Aground';
    case NavigationStatus.FISHING:
      return 'Engaged in fishing';
    case NavigationStatus.UNDERWAY_SAILING:
      return 'Under way sailing';
    case NavigationStatus.AIS_SART:
      return 'AIS-SART';
    default:
      return 'Not defined';
  }
}

// Helper function to get status color
export function getNavigationStatusColor(status: NavigationStatus): string {
  switch (status) {
    case NavigationStatus.UNDERWAY_ENGINE:
    case NavigationStatus.UNDERWAY_SAILING:
      return '#10b981'; // Green
    case NavigationStatus.AT_ANCHOR:
      return '#3b82f6'; // Blue
    case NavigationStatus.MOORED:
      return '#6b7280'; // Gray
    case NavigationStatus.NOT_UNDER_COMMAND:
    case NavigationStatus.AGROUND:
      return '#ef4444'; // Red
    case NavigationStatus.RESTRICTED_MANOEUVRABILITY:
    case NavigationStatus.CONSTRAINED_BY_DRAUGHT:
      return '#f59e0b'; // Orange
    case NavigationStatus.FISHING:
      return '#8b5cf6'; // Purple
    case NavigationStatus.AIS_SART:
      return '#dc2626'; // Dark red
    default:
      return '#9ca3af'; // Light gray
  }
}

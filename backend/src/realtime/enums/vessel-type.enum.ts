export enum VesselType {
  UNKNOWN = 0,
  RESERVED_1 = 1,
  RESERVED_2 = 2,
  RESERVED_3 = 3,
  RESERVED_4 = 4,
  RESERVED_5 = 5,
  RESERVED_6 = 6,
  RESERVED_7 = 7,
  RESERVED_8 = 8,
  RESERVED_9 = 9,
  RESERVED_10 = 10,
  RESERVED_11 = 11,
  RESERVED_12 = 12,
  RESERVED_13 = 13,
  RESERVED_14 = 14,
  RESERVED_15 = 15,
  RESERVED_16 = 16,
  RESERVED_17 = 17,
  RESERVED_18 = 18,
  RESERVED_19 = 19,
  WIG = 20, // Wing in ground
  WIG_HAZARDOUS_A = 21,
  WIG_HAZARDOUS_B = 22,
  WIG_HAZARDOUS_C = 23,
  WIG_HAZARDOUS_D = 24,
  WIG_RESERVED_1 = 25,
  WIG_RESERVED_2 = 26,
  WIG_RESERVED_3 = 27,
  WIG_RESERVED_4 = 28,
  WIG_RESERVED_5 = 29,
  FISHING = 30,
  TOWING = 31,
  TOWING_LARGE = 32,
  DREDGING = 33,
  DIVING = 34,
  MILITARY = 35,
  SAILING = 36,
  PLEASURE = 37,
  RESERVED_38 = 38,
  RESERVED_39 = 39,
  HSC = 40, // High speed craft
  HSC_HAZARDOUS_A = 41,
  HSC_HAZARDOUS_B = 42,
  HSC_HAZARDOUS_C = 43,
  HSC_HAZARDOUS_D = 44,
  HSC_RESERVED_1 = 45,
  HSC_RESERVED_2 = 46,
  HSC_RESERVED_3 = 47,
  HSC_RESERVED_4 = 48,
  HSC_NO_INFO = 49,
  PILOT = 50,
  SAR = 51, // Search and Rescue
  TUG = 52,
  PORT_TENDER = 53,
  ANTI_POLLUTION = 54,
  LAW_ENFORCEMENT = 55,
  SPARE_LOCAL_1 = 56,
  SPARE_LOCAL_2 = 57,
  MEDICAL = 58,
  NONCOMBATANT = 59,
  PASSENGER = 60,
  PASSENGER_HAZARDOUS_A = 61,
  PASSENGER_HAZARDOUS_B = 62,
  PASSENGER_HAZARDOUS_C = 63,
  PASSENGER_HAZARDOUS_D = 64,
  PASSENGER_RESERVED_1 = 65,
  PASSENGER_RESERVED_2 = 66,
  PASSENGER_RESERVED_3 = 67,
  PASSENGER_RESERVED_4 = 68,
  PASSENGER_NO_INFO = 69,
  CARGO = 70,
  CARGO_HAZARDOUS_A = 71,
  CARGO_HAZARDOUS_B = 72,
  CARGO_HAZARDOUS_C = 73,
  CARGO_HAZARDOUS_D = 74,
  CARGO_RESERVED_1 = 75,
  CARGO_RESERVED_2 = 76,
  CARGO_RESERVED_3 = 77,
  CARGO_RESERVED_4 = 78,
  CARGO_NO_INFO = 79,
  TANKER = 80,
  TANKER_HAZARDOUS_A = 81,
  TANKER_HAZARDOUS_B = 82,
  TANKER_HAZARDOUS_C = 83,
  TANKER_HAZARDOUS_D = 84,
  TANKER_RESERVED_1 = 85,
  TANKER_RESERVED_2 = 86,
  TANKER_RESERVED_3 = 87,
  TANKER_RESERVED_4 = 88,
  TANKER_NO_INFO = 89,
  OTHER = 90,
  OTHER_HAZARDOUS_A = 91,
  OTHER_HAZARDOUS_B = 92,
  OTHER_HAZARDOUS_C = 93,
  OTHER_HAZARDOUS_D = 94,
  OTHER_RESERVED_1 = 95,
  OTHER_RESERVED_2 = 96,
  OTHER_RESERVED_3 = 97,
  OTHER_RESERVED_4 = 98,
  OTHER_NO_INFO = 99,
}

// Helper function to get vessel category
export function getVesselCategory(type: VesselType): string {
  if (type >= 30 && type <= 39) return 'FISHING';
  if (type >= 40 && type <= 49) return 'HSC';
  if (type >= 50 && type <= 59) return 'SPECIAL';
  if (type >= 60 && type <= 69) return 'PASSENGER';
  if (type >= 70 && type <= 79) return 'CARGO';
  if (type >= 80 && type <= 89) return 'TANKER';
  if (type >= 90 && type <= 99) return 'OTHER';
  return 'UNKNOWN';
}

// Helper function to get vessel type name
export function getVesselTypeName(type: VesselType): string {
  const category = getVesselCategory(type);
  
  switch (category) {
    case 'FISHING': return 'Fishing';
    case 'HSC': return 'High Speed Craft';
    case 'PASSENGER': return 'Passenger';
    case 'CARGO': return 'Cargo';
    case 'TANKER': return 'Tanker';
    case 'SPECIAL':
      if (type === VesselType.PILOT) return 'Pilot';
      if (type === VesselType.SAR) return 'Search & Rescue';
      if (type === VesselType.TUG) return 'Tug';
      if (type === VesselType.MEDICAL) return 'Medical';
      return 'Special';
    case 'OTHER': return 'Other';
    default: return 'Unknown';
  }
}

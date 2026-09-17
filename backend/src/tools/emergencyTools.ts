import { dataStore, Coordinates, Ambulance, Hospital, RescueTeam, Shelter, Road, calculateDistanceKm } from '../services/dataStore';
import { routingService, RouteResult } from '../services/routingService';

export interface ToolCallRecord {
  toolName: string;
  params?: any;
  resultSummary: string;
  timestamp: string;
}

/**
 * Tool: calculateDistance
 * Calculates real Haversine distance in kilometers between two geographic coordinates.
 */
export function calculateDistance(origin: Coordinates, destination: Coordinates): number {
  return calculateDistanceKm(origin, destination);
}

/**
 * Tool: findAvailableAmbulances
 * Queries real-time fleet registry in dataStore for operational ambulances with status === 'AVAILABLE'.
 * NEVER invents ambulance IDs or fictional vehicles.
 */
export function findAvailableAmbulances(opts?: {
  origin?: Coordinates;
  capability?: 'ICU' | 'Advanced Life Support (ALS)' | 'Basic Life Support (BLS)';
  maxDistanceKm?: number;
}): (Ambulance & { distanceKm: number })[] {
  const allAmbulances = dataStore.getAmbulances();
  const available = allAmbulances.filter((a) => a.status === 'AVAILABLE');

  const withDistance = available.map((amb) => {
    const distanceKm = opts?.origin ? calculateDistance(opts.origin, amb.coordinates) : 0;
    return { ...amb, distanceKm };
  });

  let filtered = withDistance;
  if (opts?.capability) {
    filtered = filtered.filter((a) => a.medicalCapability === opts.capability);
    // If none found with strict capability, fallback to all available so caller can review
    if (filtered.length === 0) {
      filtered = withDistance;
    }
  }

  if (opts?.maxDistanceKm && opts.origin) {
    const withinRadius = filtered.filter((a) => a.distanceKm <= (opts.maxDistanceKm || 50));
    if (withinRadius.length > 0) filtered = withinRadius;
  }

  // Sort by distance ascending
  filtered.sort((a, b) => a.distanceKm - b.distanceKm);
  return filtered;
}

/**
 * Tool: findSuitableHospitals
 * Queries real regional hospitals for emergency & ICU bed availability.
 * NEVER invents hospital names or bed numbers.
 */
export function findSuitableHospitals(opts: {
  origin?: Coordinates;
  isCritical?: boolean;
  minEmergencyBeds?: number;
  minIcuBeds?: number;
  injuredCount?: number;
}): (Hospital & { distanceKm: number })[] {
  const hospitals = dataStore.getHospitals();

  const candidates = hospitals
    .filter((h) => h.emergencyBedsAvailable > 0 || (opts.isCritical && h.icuBedsAvailable > 0))
    .map((h) => {
      const distanceKm = opts.origin ? calculateDistance(opts.origin, h.coordinates) : 0;
      return { ...h, distanceKm };
    });

  // Prioritize critical facilities if isCritical
  candidates.sort((a, b) => {
    if (opts.isCritical) {
      if (b.icuBedsAvailable !== a.icuBedsAvailable) {
        return b.icuBedsAvailable - a.icuBedsAvailable;
      }
    }
    if (a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }
    return b.emergencyBedsAvailable - a.emergencyBedsAvailable;
  });

  return candidates;
}

/**
 * Tool: findAvailableRescueTeams
 * Queries active NDRF/SDRF and Fire rescue teams with status === 'AVAILABLE'.
 * NEVER invents rescue team IDs or equipment.
 */
export function findAvailableRescueTeams(opts?: {
  origin?: Coordinates;
  teamType?: string;
}): (RescueTeam & { distanceKm: number })[] {
  const teams = dataStore.getRescueTeams();
  const available = teams.filter((t) => t.status === 'AVAILABLE');

  const withDistance = available.map((team) => {
    const distanceKm = opts?.origin ? calculateDistance(opts.origin, team.coordinates) : 0;
    return { ...team, distanceKm };
  });

  let filtered = withDistance;
  if (opts?.teamType) {
    const matching = filtered.filter((t) => t.teamType.toLowerCase().includes(opts.teamType!.toLowerCase()));
    if (matching.length > 0) filtered = matching;
  }

  filtered.sort((a, b) => a.distanceKm - b.distanceKm);
  return filtered;
}

/**
 * Tool: getShelterCapacity
 * Queries municipal disaster shelters for current capacity, remaining space, and facilities.
 * NEVER invents shelter IDs or capacities.
 */
export function getShelterCapacity(opts?: {
  origin?: Coordinates;
  requiredCapacity?: number;
}): (Shelter & { distanceKm: number })[] {
  const shelters = dataStore.getShelters();
  const openShelters = shelters.filter((s) => s.status !== 'FULL' && s.remainingCapacity > 0);

  const withDistance = openShelters.map((s) => {
    const distanceKm = opts?.origin ? calculateDistance(opts.origin, s.coordinates) : 0;
    return { ...s, distanceKm };
  });

  withDistance.sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }
    return b.remainingCapacity - a.remainingCapacity;
  });

  return withDistance;
}

/**
 * Tool: getRoadConditions
 * Queries real road condition telemetry, checking for blockades, waterlogging, and traffic congestion.
 */
export function getRoadConditions(opts?: {
  area?: string;
}): {
  allRoads: Road[];
  blockedRoads: Road[];
  restrictedRoads: Road[];
  openRoads: Road[];
  summary: string;
} {
  const allRoads = dataStore.getRoads();
  const blockedRoads = allRoads.filter((r) => r.status === 'blocked');
  const restrictedRoads = allRoads.filter((r) => r.status === 'restricted');
  const openRoads = allRoads.filter((r) => r.status === 'open');

  const summary = blockedRoads.length > 0
    ? `Identified ${blockedRoads.length} blocked road(s): ${blockedRoads.map((r) => `${r.name} (${r.hazard})`).join('; ')}. ${openRoads.length} open corridor(s) available.`
    : `All ${openRoads.length} monitored primary road segments are currently open and passable.`;

  return {
    allRoads,
    blockedRoads,
    restrictedRoads,
    openRoads,
    summary,
  };
}

/**
 * Tool: findAlternativeRoute
 * Computes an optimal or detour route connecting origin and destination, navigating around blocked roads.
 */
export function findAlternativeRoute(opts: {
  origin: Coordinates;
  destination: Coordinates;
  emergencyVehicle?: boolean;
  avoidBlockades?: boolean;
}): RouteResult {
  const roads = dataStore.getRoads();
  return routingService.calculateRoute(opts.origin, opts.destination, roads, {
    emergencyVehicle: opts.emergencyVehicle ?? true,
    avoidBlockades: opts.avoidBlockades ?? true,
  });
}

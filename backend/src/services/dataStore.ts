import fs from 'fs';
import path from 'path';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  title: string;
  disasterType: string;
  location: string;
  coordinates: Coordinates;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'ANALYZING' | 'ACTIVE' | 'RESOURCES_DISPATCHED' | 'EVACUATING' | 'RESOLVED';
  peopleAffected: number;
  injured: number;
  missing: number;
  waterLevel?: string;
  fireIntensity?: string;
  damageLevel?: string;
  description: string;
  imageUrl?: string;
  imageAnalysis?: any;
  createdAt: string;
  assignedResources: string[];
  selectedHospitalId?: string | null;
  selectedShelterId?: string | null;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'MODIFIED' | 'REJECTED';
  responsePlan?: any;
}

export interface Ambulance {
  id: string;
  callSign: string;
  vehicleNumber: string;
  locationName: string;
  coordinates: Coordinates;
  status: 'AVAILABLE' | 'BUSY' | 'EN_ROUTE' | 'MAINTENANCE';
  medicalCapability: 'ICU' | 'Advanced Life Support (ALS)' | 'Basic Life Support (BLS)';
  capacity: number;
  assignedIncidentId: string | null;
  etaMinutes: number;
  currentTraffic: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Hospital {
  id: string;
  name: string;
  location: string;
  coordinates: Coordinates;
  emergencyBeds: number;
  emergencyBedsAvailable: number;
  icuBeds: number;
  icuBedsAvailable: number;
  currentOccupancy: number;
  status: 'OPERATIONAL' | 'HIGH_LOAD' | 'CRITICAL_CAPACITY';
  specialties: string[];
  phone: string;
}

export interface RescueTeam {
  id: string;
  name: string;
  locationName: string;
  coordinates: Coordinates;
  teamType: string;
  personnelCount: number;
  status: 'AVAILABLE' | 'BUSY' | 'EN_ROUTE' | 'MAINTENANCE';
  equipment: string[];
  assignedIncidentId: string | null;
}

export interface Shelter {
  id: string;
  name: string;
  location: string;
  coordinates: Coordinates;
  totalCapacity: number;
  occupied: number;
  remainingCapacity: number;
  facilities: string[];
  status: 'OPEN' | 'NEAR_CAPACITY' | 'FULL';
  contactPerson: string;
  distanceKm?: number;
}

export interface Road {
  id: string;
  name: string;
  area: string;
  status: 'open' | 'blocked' | 'restricted';
  traffic: 'LOW' | 'MEDIUM' | 'HIGH' | 'JAMMED';
  hazard: string;
  points: [number, number][];
}

export interface Alert {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO' | 'RESOLVED';
  title: string;
  message: string;
  timestamp: string;
  incidentId?: string;
  resourceId?: string;
}

// Calculate distance in kilometers using Haversine formula
export function calculateDistanceKm(c1: Coordinates, c2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLon = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

class DataStore {
  private incidents: Incident[] = [];
  private ambulances: Ambulance[] = [];
  private hospitals: Hospital[] = [];
  private rescueTeams: RescueTeam[] = [];
  private shelters: Shelter[] = [];
  private roads: Road[] = [];
  private alerts: Alert[] = [];

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    try {
      const possibleDirs = [
        path.resolve(process.cwd(), 'backend/src/data'),
        path.resolve(process.cwd(), 'src/data'),
        typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../data') : '',
      ].filter(Boolean);

      const foundDir = possibleDirs.find((dir) => fs.existsSync(path.join(dir, 'incidents.json')));
      const dataDir = foundDir || path.resolve(process.cwd(), 'backend/src/data');

      this.incidents = JSON.parse(fs.readFileSync(path.join(dataDir, 'incidents.json'), 'utf-8'));
      this.ambulances = JSON.parse(fs.readFileSync(path.join(dataDir, 'ambulances.json'), 'utf-8'));
      this.hospitals = JSON.parse(fs.readFileSync(path.join(dataDir, 'hospitals.json'), 'utf-8'));
      this.rescueTeams = JSON.parse(fs.readFileSync(path.join(dataDir, 'rescueTeams.json'), 'utf-8'));
      this.shelters = JSON.parse(fs.readFileSync(path.join(dataDir, 'shelters.json'), 'utf-8'));
      this.roads = JSON.parse(fs.readFileSync(path.join(dataDir, 'roads.json'), 'utf-8'));
      this.alerts = JSON.parse(fs.readFileSync(path.join(dataDir, 'alerts.json'), 'utf-8'));
    } catch (err) {
      console.warn('Could not load files directly from disk, using fallback empty structures', err);
    }
  }

  // Incidents
  getIncidents(): Incident[] {
    return [...this.incidents];
  }

  getIncidentById(id: string): Incident | undefined {
    return this.incidents.find((i) => i.id === id);
  }

  createIncident(
    incidentData: Omit<Incident, 'id' | 'createdAt' | 'assignedResources'> & {
      id?: string;
      assignedResources?: string[];
    }
  ): Incident {
    const id = incidentData.id || `INC-${Date.now().toString().slice(-4)}`;
    const newIncident: Incident = {
      ...incidentData,
      id,
      createdAt: new Date().toISOString(),
      assignedResources: incidentData.assignedResources || [],
      status: incidentData.status || 'NEW',
      approvalStatus: incidentData.approvalStatus || 'PENDING',
    };
    this.incidents.unshift(newIncident);

    // Add alert
    this.addAlert({
      type: newIncident.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      title: `Emergency Incident Reported: ${newIncident.title}`,
      message: `Type: ${newIncident.disasterType} at ${newIncident.location}. ${newIncident.peopleAffected} affected, ${newIncident.injured} injured.`,
      incidentId: newIncident.id,
    });

    return newIncident;
  }

  updateIncident(id: string, updates: Partial<Incident>): Incident | undefined {
    const idx = this.incidents.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    this.incidents[idx] = { ...this.incidents[idx], ...updates };
    return this.incidents[idx];
  }

  // Ambulances
  getAmbulances(): Ambulance[] {
    return [...this.ambulances];
  }

  getAmbulanceById(id: string): Ambulance | undefined {
    return this.ambulances.find((a) => a.id === id);
  }

  updateAmbulance(id: string, updates: Partial<Ambulance>): Ambulance | undefined {
    const idx = this.ambulances.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.ambulances[idx] = { ...this.ambulances[idx], ...updates };
    return this.ambulances[idx];
  }

  // Hospitals
  getHospitals(): Hospital[] {
    return [...this.hospitals];
  }

  getHospitalById(id: string): Hospital | undefined {
    return this.hospitals.find((h) => h.id === id);
  }

  updateHospital(id: string, updates: Partial<Hospital>): Hospital | undefined {
    const idx = this.hospitals.findIndex((h) => h.id === id);
    if (idx === -1) return undefined;
    this.hospitals[idx] = { ...this.hospitals[idx], ...updates };
    return this.hospitals[idx];
  }

  // Rescue Teams
  getRescueTeams(): RescueTeam[] {
    return [...this.rescueTeams];
  }

  getRescueTeamById(id: string): RescueTeam | undefined {
    return this.rescueTeams.find((r) => r.id === id);
  }

  updateRescueTeam(id: string, updates: Partial<RescueTeam>): RescueTeam | undefined {
    const idx = this.rescueTeams.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.rescueTeams[idx] = { ...this.rescueTeams[idx], ...updates };
    return this.rescueTeams[idx];
  }

  // Shelters
  getShelters(): Shelter[] {
    return [...this.shelters];
  }

  getShelterById(id: string): Shelter | undefined {
    return this.shelters.find((s) => s.id === id);
  }

  updateShelter(id: string, updates: Partial<Shelter>): Shelter | undefined {
    const idx = this.shelters.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.shelters[idx] = { ...this.shelters[idx], ...updates };
    return this.shelters[idx];
  }

  // Roads
  getRoads(): Road[] {
    return [...this.roads];
  }

  getRoadById(id: string): Road | undefined {
    return this.roads.find((r) => r.id === id);
  }

  updateRoad(id: string, updates: Partial<Road>): Road | undefined {
    const idx = this.roads.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.roads[idx] = { ...this.roads[idx], ...updates };
    return this.roads[idx];
  }

  // Alerts
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  addAlert(alertData: Omit<Alert, 'id' | 'timestamp'>): Alert {
    const newAlert: Alert = {
      ...alertData,
      id: `ALT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
    };
    this.alerts.unshift(newAlert);
    if (this.alerts.length > 50) this.alerts.pop();
    return newAlert;
  }

  // Helper tools for Agents
  findAvailableAmbulances(opts?: { capability?: string; maxDistanceKm?: number; origin?: Coordinates }): (Ambulance & { distanceKm?: number })[] {
    return this.ambulances
      .filter((a) => a.status === 'AVAILABLE')
      .map((a) => {
        const distanceKm = opts?.origin ? calculateDistanceKm(opts.origin, a.coordinates) : undefined;
        return { ...a, distanceKm };
      })
      .sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        return 0;
      });
  }

  findAvailableRescueTeams(opts?: { teamType?: string; origin?: Coordinates }): (RescueTeam & { distanceKm?: number })[] {
    return this.rescueTeams
      .filter((r) => r.status === 'AVAILABLE')
      .map((r) => {
        const distanceKm = opts?.origin ? calculateDistanceKm(opts.origin, r.coordinates) : undefined;
        return { ...r, distanceKm };
      })
      .sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        return 0;
      });
  }

  findSuitableHospitals(opts: { injuredCount: number; isCritical: boolean; origin?: Coordinates }): (Hospital & { distanceKm?: number })[] {
    return this.hospitals
      .filter((h) => h.emergencyBedsAvailable > 0 || (opts.isCritical && h.icuBedsAvailable > 0))
      .map((h) => {
        const distanceKm = opts.origin ? calculateDistanceKm(opts.origin, h.coordinates) : undefined;
        return { ...h, distanceKm };
      })
      .sort((a, b) => {
        // For critical patients, prioritize ICU availability and total capacity
        if (opts.isCritical) {
          if (b.icuBedsAvailable !== a.icuBedsAvailable) {
            return b.icuBedsAvailable - a.icuBedsAvailable;
          }
        }
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        return b.emergencyBedsAvailable - a.emergencyBedsAvailable;
      });
  }

  findSuitableShelters(opts: { evacueeCount: number; origin?: Coordinates }): (Shelter & { distanceKm?: number })[] {
    return this.shelters
      .filter((s) => s.status !== 'FULL' && s.remainingCapacity > 0)
      .map((s) => {
        const distanceKm = opts.origin ? calculateDistanceKm(opts.origin, s.coordinates) : undefined;
        return { ...s, distanceKm };
      })
      .sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        return b.remainingCapacity - a.remainingCapacity;
      });
  }

  // Simulation & Failure triggers
  simulateWorseSituation(incidentId?: string) {
    const targetIncident = incidentId ? this.getIncidentById(incidentId) : this.incidents[0];
    const results: string[] = [];

    // 1. Block an active road near Kukatpally or current incident
    const openRoad = this.roads.find((r) => r.status === 'open');
    if (openRoad) {
      this.updateRoad(openRoad.id, {
        status: 'blocked',
        traffic: 'JAMMED',
        hazard: 'Sudden flash surge & collapsed drainage pipeline',
      });
      results.push(`Road ${openRoad.name} (${openRoad.id}) has been BLOCKED.`);
      this.addAlert({
        type: 'CRITICAL',
        title: `CRITICAL ROUTE DISRUPTION: ${openRoad.name}`,
        message: `Surge has rendered ${openRoad.name} completely impassable. Re-routing emergency response convoys.`,
        incidentId: targetIncident?.id,
      });
    }

    // 2. Make an assigned or available ambulance unavailable
    let targetAmb = this.ambulances.find((a) => targetIncident?.assignedResources.includes(a.id));
    if (!targetAmb) {
      targetAmb = this.ambulances.find((a) => a.status === 'AVAILABLE');
    }
    if (targetAmb) {
      this.updateAmbulance(targetAmb.id, {
        status: 'MAINTENANCE',
        assignedIncidentId: null,
      });
      results.push(`Ambulance ${targetAmb.callSign} (${targetAmb.id}) suffered mechanical failure in deep water.`);
      this.addAlert({
        type: 'CRITICAL',
        title: `RESOURCE COMPROMISED: ${targetAmb.callSign}`,
        message: `${targetAmb.callSign} (${targetAmb.id}) rendered UNAVAILABLE due to engine water ingress. Immediate reallocation needed.`,
        incidentId: targetIncident?.id,
        resourceId: targetAmb.id,
      });
    }

    // 3. Severely reduce hospital capacity or surge patients (hospital loses ICU capacity)
    const primaryHospital = this.hospitals.find((h) => h.id === targetIncident?.selectedHospitalId) || this.hospitals[0];
    if (primaryHospital) {
      this.updateHospital(primaryHospital.id, {
        emergencyBedsAvailable: Math.max(0, primaryHospital.emergencyBedsAvailable - 10),
        icuBedsAvailable: 0, // Hospital loses ICU capacity completely
        currentOccupancy: 100,
        status: 'CRITICAL_CAPACITY',
      });
      results.push(`Hospital ${primaryHospital.name} lost ICU capacity due to critical trauma overflow.`);
      this.addAlert({
        type: 'CRITICAL',
        title: `ICU EXHAUSTION: ${primaryHospital.name}`,
        message: `Emergency influx has completely depleted ICU capacity (0 ICU beds). Critical casualties must be redirected to alternate trauma hospital!`,
        incidentId: targetIncident?.id,
      });
    }

    // 4. Increase affected / injured counts
    if (targetIncident) {
      this.updateIncident(targetIncident.id, {
        peopleAffected: targetIncident.peopleAffected + 40,
        injured: targetIncident.injured + 5,
        severity: 'CRITICAL',
        status: 'ACTIVE',
      });
      results.push(`Incident ${targetIncident.id} casualty count increased (+40 affected, +5 injured).`);
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      disruptions: results,
      targetIncidentId: targetIncident?.id,
    };
  }

  resetAll() {
    this.loadInitialData();
    return { success: true, message: 'All simulation data reset to baseline.' };
  }
}

export const dataStore = new DataStore();

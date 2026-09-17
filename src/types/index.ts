export interface Coordinates {
  lat: number;
  lng: number;
}

export type DisasterType =
  | 'Flood'
  | 'Fire'
  | 'Earthquake'
  | 'Building Collapse'
  | 'Landslide'
  | 'Cyclone'
  | 'Chemical Incident'
  | 'Other';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'NEW'
  | 'ANALYZING'
  | 'ACTIVE'
  | 'RESOURCES_DISPATCHED'
  | 'EVACUATING'
  | 'RESOLVED';

export type ResourceStatus = 'AVAILABLE' | 'BUSY' | 'EN_ROUTE' | 'MAINTENANCE';

export interface Incident {
  id: string;
  title: string;
  disasterType: DisasterType;
  location: string;
  coordinates: Coordinates;
  severity: SeverityLevel;
  status: IncidentStatus;
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
  responsePlan?: UnifiedResponsePlan;
}

export interface Ambulance {
  id: string;
  callSign: string;
  vehicleNumber: string;
  locationName: string;
  coordinates: Coordinates;
  status: ResourceStatus;
  medicalCapability: 'ICU' | 'Advanced Life Support (ALS)' | 'Basic Life Support (BLS)';
  capacity: number;
  assignedIncidentId: string | null;
  etaMinutes: number;
  currentTraffic: 'LOW' | 'MEDIUM' | 'HIGH';
  distanceKm?: number;
  matchReason?: string;
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
  distanceKm?: number;
}

export interface RescueTeam {
  id: string;
  name: string;
  locationName: string;
  coordinates: Coordinates;
  teamType: string;
  personnelCount: number;
  status: ResourceStatus;
  equipment: string[];
  assignedIncidentId: string | null;
  distanceKm?: number;
  matchReason?: string;
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

export interface CoordinatedAction {
  priority: number;
  action: string;
  resource: string;
  reason: string;
}

export interface UnifiedResponsePlan {
  incidentId: string;
  priority: string;
  summary: string;
  actions: CoordinatedAction[];
  ambulanceAssignments: {
    ambulanceId: string;
    callSign: string;
    capability: string;
    etaMinutes: number;
    destinationHospital: string;
    routeDetour: boolean;
  }[];
  rescueAssignments: {
    teamId: string;
    name: string;
    type: string;
    mission: string;
  }[];
  hospitalAssignments: {
    hospitalId: string;
    name: string;
    emergencyBedsReserved: number;
    icuBedsReserved: number;
    phone: string;
  }[];
  evacuationPlan: {
    shelterId: string;
    shelterName: string;
    peopleCount: number;
    status: string;
  }[];
  citizenMessage: string;
  responderMessage: string;
  requiresHumanApproval: boolean;
  generatedAt: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'MODIFIED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  operatorComments?: string;
}

export interface ToolCallRecord {
  toolName: string;
  params?: any;
  resultSummary?: string;
  timestamp?: string;
}

export interface AgentActivityStep {
  agentName: string;
  agentRole: string;
  timestamp: string;
  startTime?: string;
  endTime?: string;
  status: 'running' | 'completed' | 'warning' | 'failed';
  decision?: string;
  toolsCalled?: ToolCallRecord[];
  result?: any;
  summary: string;
  details?: any;
  durationMs?: number;
}

export interface WorkflowResult {
  incidentId: string;
  incident: Incident;
  timeline: AgentActivityStep[];
  analysis: any;
  risk: any;
  resources: any;
  routes: any;
  medical: any;
  shelter: any;
  communication: any;
  plan: UnifiedResponsePlan;
  executionTimeMs: number;
  providerStatus: {
    geminiOnline: boolean;
    note: string;
  };
}

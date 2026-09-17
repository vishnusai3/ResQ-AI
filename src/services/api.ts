import {
  Incident,
  Ambulance,
  Hospital,
  RescueTeam,
  Shelter,
  Road,
  Alert,
  WorkflowResult,
  UnifiedResponsePlan,
} from '../types';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errorJson = await res.json();
      errorMsg = errorJson.error || errorJson.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // System
  getStatus: () => request<{ status: string; aiProvider: string; timestamp: string }>('/api/status'),

  // Incidents
  getIncidents: () => request<Incident[]>('/api/incidents'),
  getIncidentById: (id: string) => request<Incident>(`/api/incidents/${id}`),
  createIncident: (incidentData: Partial<Incident> & { autoTriggerAgents?: boolean }) =>
    request<{ data: Incident; workflow?: WorkflowResult }>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    }),
  updateIncident: (id: string, updates: Partial<Incident>) =>
    request<Incident>(`/api/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // Resources
  getAmbulances: () => request<Ambulance[]>('/api/ambulances'),
  updateAmbulance: (id: string, updates: Partial<Ambulance>) =>
    request<Ambulance>(`/api/ambulances/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  getRescueTeams: () => request<RescueTeam[]>('/api/rescue-teams'),
  updateRescueTeam: (id: string, updates: Partial<RescueTeam>) =>
    request<RescueTeam>(`/api/rescue-teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  getHospitals: () => request<Hospital[]>('/api/hospitals'),
  updateHospital: (id: string, updates: Partial<Hospital>) =>
    request<Hospital>(`/api/hospitals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  getShelters: () => request<Shelter[]>('/api/shelters'),
  updateShelter: (id: string, updates: Partial<Shelter>) =>
    request<Shelter>(`/api/shelters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  getRoads: () => request<Road[]>('/api/roads'),
  updateRoad: (id: string, updates: Partial<Road>) =>
    request<Road>(`/api/roads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  getAlerts: () => request<Alert[]>('/api/alerts'),

  // Multi-Agent Workflow
  runWorkflow: (incidentId: string) =>
    request<WorkflowResult>('/api/agents/run-workflow', {
      method: 'POST',
      body: JSON.stringify({ incidentId }),
    }),

  analyzeImage: (imageBase64: string, mimeType: string = 'image/jpeg') =>
    request<any>('/api/agents/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, mimeType }),
    }),

  // Simulation & Deterioration
  startSimulation: (scenario: string) =>
    request<{ incident: Incident; workflow: WorkflowResult }>('/api/simulation/start', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    }),

  triggerWorseSituation: (incidentId?: string) =>
    request<{
      disruption: any;
      incident: Incident;
      replannedWorkflow: WorkflowResult;
      message: string;
    }>('/api/simulation/worse', {
      method: 'POST',
      body: JSON.stringify({ incidentId }),
    }),

  resetSimulation: () =>
    request<{ success: boolean; message: string }>('/api/simulation/reset', {
      method: 'POST',
    }),

  // Human-in-the-Loop Plan Actions
  approvePlan: (incidentId: string, approvedBy?: string, comments?: string) =>
    request<Incident>('/api/response/approve', {
      method: 'POST',
      body: JSON.stringify({ incidentId, approvedBy, comments }),
    }),

  modifyPlan: (incidentId: string, modifiedActions?: any[], comments?: string) =>
    request<Incident>('/api/response/modify', {
      method: 'POST',
      body: JSON.stringify({ incidentId, modifiedActions, comments }),
    }),

  rejectPlan: (incidentId: string, reason?: string) =>
    request<Incident>('/api/response/reject', {
      method: 'POST',
      body: JSON.stringify({ incidentId, reason }),
    }),
};

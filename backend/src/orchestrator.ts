import { Incident, dataStore } from './services/dataStore';
import { runIncidentAnalysisAgent, IncidentAnalysisOutput } from './agents/incidentAnalysisAgent';
import { runRiskAssessmentAgent, RiskAssessmentOutput } from './agents/riskAssessmentAgent';
import { runResourceAllocationAgent, ResourceAllocationOutput } from './agents/resourceAllocationAgent';
import { runRouteOptimizationAgent, RouteOptimizationOutput } from './agents/routeOptimizationAgent';
import { runMedicalCoordinationAgent, MedicalCoordinationOutput } from './agents/medicalCoordinationAgent';
import { runShelterAgent, ShelterEvacuationOutput } from './agents/shelterAgent';
import { runCommunicationAgent, CommunicationOutput } from './agents/communicationAgent';
import { runResponseCoordinatorAgent, UnifiedResponsePlan } from './agents/responseCoordinatorAgent';
import { ToolCallRecord } from './tools/emergencyTools';

export interface ToolCallLog {
  toolName: string;
  params?: any;
  resultSummary: string;
  timestamp: string;
}

export interface AgentActivityStep {
  agentName: string;
  agentRole: string;
  timestamp: string;
  startTime: string;
  endTime: string;
  status: 'running' | 'completed' | 'warning' | 'failed';
  decision: string;
  toolsCalled: ToolCallRecord[];
  result: any;
  summary: string;
  details?: any;
  durationMs?: number;
}

export interface WorkflowResult {
  incidentId: string;
  incident: Incident;
  timeline: AgentActivityStep[];
  analysis: IncidentAnalysisOutput;
  risk: RiskAssessmentOutput;
  resources: ResourceAllocationOutput;
  routes: RouteOptimizationOutput;
  medical: MedicalCoordinationOutput;
  shelter: ShelterEvacuationOutput;
  communication: CommunicationOutput;
  plan: UnifiedResponsePlan;
  executionTimeMs: number;
  providerStatus: {
    geminiOnline: boolean;
    note: string;
  };
}

export async function runIncidentWorkflow(incidentInput: Incident): Promise<WorkflowResult> {
  const workflowStartTime = Date.now();
  const timeline: AgentActivityStep[] = [];
  const incident = dataStore.getIncidentById(incidentInput.id) || incidentInput;

  function recordStep(envelope: {
    agentName: string;
    agentRole: string;
    status: 'completed' | 'warning' | 'failed';
    startTime: string;
    endTime: string;
    durationMs: number;
    decision: string;
    toolsCalled: ToolCallRecord[];
    summary: string;
    result: any;
  }) {
    timeline.push({
      agentName: envelope.agentName,
      agentRole: envelope.agentRole,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      startTime: envelope.startTime,
      endTime: envelope.endTime,
      status: envelope.status,
      decision: envelope.decision,
      toolsCalled: envelope.toolsCalled,
      summary: envelope.summary,
      details: envelope.result,
      result: envelope.result,
      durationMs: envelope.durationMs,
    });
  }

  // 1. Incident Analysis Agent
  const analysisEnvelope = await runIncidentAnalysisAgent({
    incident,
    environmentalContext: {
      weather: incident.waterLevel ? 'Monsoon Cloudburst (Heavy Rainfall)' : 'High Heat Index',
      rainMmPerHour: incident.disasterType === 'Flood' ? 85 : 0,
    },
  });
  recordStep(analysisEnvelope);
  const analysis = analysisEnvelope.result;

  // 2. Risk Assessment Agent
  const riskEnvelope = await runRiskAssessmentAgent({
    incident,
    analysis,
  });
  recordStep(riskEnvelope);
  const risk = riskEnvelope.result;

  // 3. Resource Allocation Agent
  const resourcesEnvelope = await runResourceAllocationAgent({
    incident,
    analysis,
    risk,
  });
  recordStep(resourcesEnvelope);
  const resources = resourcesEnvelope.result;

  // 4. Route Optimization Agent (Sequenced immediately after Resource Allocation)
  const routesEnvelope = await runRouteOptimizationAgent({
    incident,
    analysis,
    risk,
    resources,
  });
  recordStep(routesEnvelope);
  const routes = routesEnvelope.result;

  // 5. Medical Coordination Agent (Uses road conditions from Route Optimization)
  const medicalEnvelope = await runMedicalCoordinationAgent({
    incident,
    analysis,
    risk,
    resources,
    routes,
  });
  recordStep(medicalEnvelope);
  const medical = medicalEnvelope.result;

  // 6. Shelter / Evacuation Agent
  const shelterEnvelope = await runShelterAgent({
    incident,
    analysis,
    risk,
    routes,
  });
  recordStep(shelterEnvelope);
  const shelter = shelterEnvelope.result;

  // 7. Communication Agent
  const communicationEnvelope = await runCommunicationAgent({
    incident,
    analysis,
    risk,
    resources,
    routes,
    medical,
    shelter,
  });
  recordStep(communicationEnvelope);
  const communication = communicationEnvelope.result;

  // 8. Response Coordinator Agent
  const responseCoordinatorEnvelope = await runResponseCoordinatorAgent({
    incident,
    analysis,
    risk,
    resources,
    routes,
    medical,
    shelter,
    communication,
  });
  recordStep(responseCoordinatorEnvelope);
  const plan = responseCoordinatorEnvelope.result;

  // Persist assignments in dataStore
  dataStore.updateIncident(incident.id, {
    status: 'ACTIVE',
    severity: analysis.severity,
    assignedResources: resources.selectedResources,
    selectedHospitalId: medical.selectedHospital.id,
    selectedShelterId: shelter.selectedShelter.id,
    responsePlan: plan,
  });

  const executionTimeMs = Date.now() - workflowStartTime;

  return {
    incidentId: incident.id,
    incident: dataStore.getIncidentById(incident.id) || incident,
    timeline,
    analysis,
    risk,
    resources,
    routes,
    medical,
    shelter,
    communication,
    plan,
    executionTimeMs,
    providerStatus: {
      geminiOnline: analysis.provider === 'GEMINI_LLM',
      note: analysis.provider === 'GEMINI_LLM'
        ? 'Real-time Gemini 3.8 Flash Active'
        : 'Deterministic Emergency Decision Engine Active',
    },
  };
}

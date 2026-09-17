import { Incident, Hospital } from '../services/dataStore';
import { RouteResult } from '../services/routingService';
import { geminiService } from '../services/geminiService';
import { IncidentAnalysisOutput, AgentExecutionEnvelope } from './incidentAnalysisAgent';
import { RiskAssessmentOutput } from './riskAssessmentAgent';
import { ResourceAllocationOutput } from './resourceAllocationAgent';
import { RouteOptimizationOutput } from './routeOptimizationAgent';
import {
  findSuitableHospitals,
  findAlternativeRoute,
  ToolCallRecord,
} from '../tools/emergencyTools';

// Input Schema
export interface MedicalCoordinationInput {
  incident: Incident;
  analysis: IncidentAnalysisOutput;
  risk: RiskAssessmentOutput;
  resources: ResourceAllocationOutput;
  routes: RouteOptimizationOutput;
}

// Output Schema
export interface MedicalCoordinationOutput {
  selectedHospital: Hospital & { distanceKm: number };
  backupHospital: Hospital & { distanceKm: number };
  criticalCareNeeded: boolean;
  reservedEmergencyBeds: number;
  reservedIcuBeds: number;
  patientTriageSummary: string;
  hospitalRoute?: RouteResult;
  reason: string;
}

export async function runMedicalCoordinationAgent(
  input: MedicalCoordinationInput
): Promise<AgentExecutionEnvelope<MedicalCoordinationOutput>> {
  const startTime = new Date().toISOString();
  const startMs = Date.now();
  const toolsCalled: ToolCallRecord[] = [];
  const { incident, risk } = input;

  // Validation
  if (!incident || !incident.coordinates) {
    throw new Error('MedicalCoordinationAgent Error: Valid incident with coordinates is required.');
  }

  const origin = incident.coordinates;
  const isCritical = risk.riskLevel === 'CRITICAL' || (incident.injured || 0) >= 3;
  const injuredCount = incident.injured || 1;

  // 1. Tool Call: findSuitableHospitals
  const candidates = findSuitableHospitals({
    origin,
    isCritical,
    injuredCount,
  });

  toolsCalled.push({
    toolName: 'findSuitableHospitals',
    params: { origin, isCritical, injuredCount },
    resultSummary: `Located ${candidates.length} suitable hospitals with open beds`,
    timestamp: new Date().toISOString(),
  });

  if (candidates.length === 0) {
    throw new Error('MedicalCoordinationAgent Error: No regional hospitals with available emergency beds.');
  }

  const primary = candidates[0];
  const backup = candidates[1] || primary;

  // Reserve beds strictly bounded by real available beds
  const reservedEmergencyBeds = Math.min(primary.emergencyBedsAvailable, Math.max(1, injuredCount));
  const reservedIcuBeds = isCritical
    ? Math.min(primary.icuBedsAvailable, Math.max(1, Math.ceil(injuredCount / 2)))
    : 0;

  // 2. Tool Call: findAlternativeRoute (incident scene to hospital)
  const hospitalRoute = findAlternativeRoute({
    origin: incident.coordinates,
    destination: primary.coordinates,
    emergencyVehicle: true,
    avoidBlockades: true,
  });

  toolsCalled.push({
    toolName: 'findAlternativeRoute',
    params: {
      origin: incident.coordinates,
      destination: primary.coordinates,
      emergencyVehicle: true,
    },
    resultSummary: `Hospital transport route: ${hospitalRoute.totalDistanceKm} km, ETA: ${hospitalRoute.estimatedTimeMinutes} min (${hospitalRoute.routeType})`,
    timestamp: new Date().toISOString(),
  });

  let reason = isCritical
    ? `Selected ${primary.name} (${primary.distanceKm} km). Prioritized for ${primary.icuBedsAvailable} active ICU beds, ${primary.emergencyBedsAvailable} ER bays, and specialized trauma capabilities (${primary.specialties.slice(0, 2).join(' & ')}). Backup hospital designated at ${backup.name}.`
    : `Selected ${primary.name} (${primary.distanceKm} km away) with ${primary.emergencyBedsAvailable} available emergency beds. Transport ETA: ${hospitalRoute.estimatedTimeMinutes} mins.`;

  if (geminiService.isAvailable()) {
    try {
      const prompt = `You are the Medical Coordination Agent for ResQAI Emergency Platform.
We have selected the verified hospital from our operational medical registry:
- Selected Hospital: ${primary.name} (${primary.distanceKm} km away)
- Available Beds in Facility: ${primary.emergencyBedsAvailable} ER beds, ${primary.icuBedsAvailable} ICU beds
- Reserved for Incident: ${reservedEmergencyBeds} ER beds, ${reservedIcuBeds} ICU beds
- Casualty Profile: ${injuredCount} injured, Critical Trauma Required: ${isCritical}
- Transport ETA: ${hospitalRoute.estimatedTimeMinutes} minutes

Explain the clinical triage justification for this facility selection.
Do NOT invent new bed numbers or change hospital names. Return 2 sentences.`;

      const llmText = await geminiService.generateText(prompt, 'Clinical disaster triage coordinator.');
      if (llmText && llmText.trim().length > 20) {
        reason = llmText.trim();
      }
    } catch (err) {
      console.warn('MedicalCoordinationAgent LLM failed, using fallback rationale', err);
    }
  }

  const endMs = Date.now();
  const decision = `Designated ${primary.name} as primary trauma center. Reserved ${reservedEmergencyBeds} emergency bed(s) and ${reservedIcuBeds} ICU bed(s). Backup facility: ${backup.name}.`;

  const output: MedicalCoordinationOutput = {
    selectedHospital: primary,
    backupHospital: backup,
    criticalCareNeeded: isCritical,
    reservedEmergencyBeds,
    reservedIcuBeds,
    patientTriageSummary: `${injuredCount} casualty triage allocation (${reservedIcuBeds} Critical ICU, ${reservedEmergencyBeds - reservedIcuBeds} Stabilized Trauma)`,
    hospitalRoute,
    reason,
  };

  return {
    agentName: 'Medical Coordination Agent',
    agentRole: 'Clinical Triage & Bed Allocation',
    status: 'completed',
    startTime,
    endTime: new Date().toISOString(),
    durationMs: endMs - startMs,
    decision,
    toolsCalled,
    summary: `Selected ${primary.name}. Reserved ${reservedEmergencyBeds} ER & ${reservedIcuBeds} ICU beds. Transport ETA: ${hospitalRoute.estimatedTimeMinutes} min.`,
    result: output,
  };
}

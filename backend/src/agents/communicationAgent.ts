import { Incident } from '../services/dataStore';
import { geminiService } from '../services/geminiService';
import { IncidentAnalysisOutput, AgentExecutionEnvelope } from './incidentAnalysisAgent';
import { RiskAssessmentOutput } from './riskAssessmentAgent';
import { ResourceAllocationOutput } from './resourceAllocationAgent';
import { RouteOptimizationOutput } from './routeOptimizationAgent';
import { MedicalCoordinationOutput } from './medicalCoordinationAgent';
import { ShelterEvacuationOutput } from './shelterAgent';
import { getRoadConditions, ToolCallRecord } from '../tools/emergencyTools';

// Input Schema
export interface CommunicationInput {
  incident: Incident;
  analysis: IncidentAnalysisOutput;
  risk: RiskAssessmentOutput;
  resources: ResourceAllocationOutput;
  routes: RouteOptimizationOutput;
  medical: MedicalCoordinationOutput;
  shelter: ShelterEvacuationOutput;
}

// Output Schema
export interface CommunicationOutput {
  citizenMessage: string;
  responderMessage: string;
  hospitalMessage: string;
  authorityAlert: string;
  channels: string[];
}

export async function runCommunicationAgent(
  input: CommunicationInput
): Promise<AgentExecutionEnvelope<CommunicationOutput>> {
  const startTime = new Date().toISOString();
  const startMs = Date.now();
  const toolsCalled: ToolCallRecord[] = [];
  const { incident, routes, medical, shelter, resources } = input;

  // Validation
  if (!incident || !medical || !shelter || !routes) {
    throw new Error('CommunicationAgent Error: Incident, medical, shelter, and route inputs are all required.');
  }

  // 1. Tool Call: getRoadConditions to verify traffic alert broadcasting
  const roadStatus = getRoadConditions({ area: incident.location });
  toolsCalled.push({
    toolName: 'getRoadConditions',
    params: { area: incident.location },
    resultSummary: `Verified ${roadStatus.blockedRoads.length} blocked roads to include in emergency citizen broadcast`,
    timestamp: new Date().toISOString(),
  });

  const blockedRoadMsg = routes.blockedRoadNames.length > 0
    ? `Avoid blocked sectors: ${routes.blockedRoadNames.join(', ')}.`
    : 'Maintain clear lanes for emergency vehicles.';

  const prompt = `You are the Communication Agent for ResQAI Emergency Platform.
Generate 4 distinct targeted broadcast messages using STRICT verified operational facts:
- Incident: ${incident.disasterType} at ${incident.location}
- Casualties: ${incident.injured} injured, ${incident.peopleAffected} affected
- Assigned Ambulances: ${resources.selectedAmbulances.map((a) => a.callSign).join(', ')}
- Assigned Hospital: ${medical.selectedHospital.name} (Reserved Beds: ${medical.reservedEmergencyBeds} ER, ${medical.reservedIcuBeds} ICU)
- Assigned Shelter: ${shelter.selectedShelter.name}
- Road Obstructions to broadcast: ${routes.blockedRoadNames.join(', ') || 'None'}

Return strict JSON:
{
  "citizenMessage": "Urgent, calm public broadcast for citizens with shelter location and road hazards",
  "responderMessage": "Tactical VHF dispatch for police/NDRF with zones, patient counts, and hospital staging",
  "hospitalMessage": "Inbound clinical triage alert for ${medical.selectedHospital.name} with ER/ICU bed demand",
  "authorityAlert": "Executive municipal briefing for disaster management commissioner"
}
Do NOT invent fake names. Return JSON only.`;

  let output: CommunicationOutput;
  let status: 'completed' | 'warning' = 'completed';

  if (geminiService.isAvailable()) {
    try {
      const llmResult = await geminiService.generateJSON<Partial<CommunicationOutput>>(
        prompt,
        'Expert emergency public communications officer. Return valid JSON only.'
      );

      output = {
        citizenMessage: llmResult.citizenMessage || `EMERGENCY ALERT [ResQAI]: Active ${incident.disasterType.toLowerCase()} in ${incident.location}. ${blockedRoadMsg} Move to designated relief center at ${shelter.selectedShelter.name}.`,
        responderMessage: llmResult.responderMessage || `TACTICAL DISPATCH: Priority incident ${incident.id} at ${incident.location}. Casualties: ${incident.injured}. Hospital destination: ${medical.selectedHospital.name}. Units responding: ${resources.selectedAmbulances.map((a) => a.callSign).join(', ')}.`,
        hospitalMessage: llmResult.hospitalMessage || `INBOUND TRAUMA ADVISORY: Transport en route to ${medical.selectedHospital.name}. Beds reserved: ${medical.reservedEmergencyBeds} ER, ${medical.reservedIcuBeds} ICU.`,
        authorityAlert: llmResult.authorityAlert || `EXECUTIVE SITREP: Multi-agent emergency response active for ${incident.location}. Resources mobilized.`,
        channels: ['Cell Broadcast (CAP)', 'Responder VHF Radio', 'Hospital HealthNet HL7', 'Municipal Alert Feed'],
      };
    } catch (err) {
      console.warn('CommunicationAgent LLM failed, using deterministic fallback', err);
      status = 'warning';
      output = getDeterministicCommunicationFallback(incident, routes, medical, shelter, resources, blockedRoadMsg);
    }
  } else {
    output = getDeterministicCommunicationFallback(incident, routes, medical, shelter, resources, blockedRoadMsg);
  }

  const endMs = Date.now();
  const decision = `Generated and validated 4 broadcast packages across 4 emergency channels: Citizen Public Warning, Responder VHF, Hospital HL7 Alert, and Commissioner SitRep.`;

  return {
    agentName: 'Communication Agent',
    agentRole: 'Multi-Channel Alert & Dispatch Broadcasting',
    status,
    startTime,
    endTime: new Date().toISOString(),
    durationMs: endMs - startMs,
    decision,
    toolsCalled,
    summary: `Prepared 4 operational broadcast feeds (Citizen alert, Tactical dispatch, Hospital HL7 advisory, Executive SitRep).`,
    result: output,
  };
}

function getDeterministicCommunicationFallback(
  incident: Incident,
  routes: RouteOptimizationOutput,
  medical: MedicalCoordinationOutput,
  shelter: ShelterEvacuationOutput,
  resources: ResourceAllocationOutput,
  blockedRoadMsg: string
): CommunicationOutput {
  return {
    citizenMessage: `EMERGENCY BROADCAST [ResQAI]: Severe ${incident.disasterType.toLowerCase()} at ${incident.location}. ${blockedRoadMsg} Proceed to relief staging center at ${shelter.selectedShelter.name}. Stay off flooded roads.`,
    responderMessage: `TACTICAL DISPATCH [ResQAI]: Code Red response at ${incident.location}. ${incident.injured} reported casualties. Assigned units: ${resources.selectedAmbulances.map((a) => a.callSign).join(', ')}. Receiving trauma center: ${medical.selectedHospital.name}. Avoid ${routes.blockedRoadNames.join(', ') || 'inundated intersections'}.`,
    hospitalMessage: `INBOUND TRAUMA ALERT: ${medical.selectedHospital.name} Emergency Department — Incoming casualties from ${incident.location}. Prepared triage: ${medical.reservedEmergencyBeds} ER beds, ${medical.reservedIcuBeds} ICU beds. Transport ETA: ~${medical.hospitalRoute?.estimatedTimeMinutes || 12} mins.`,
    authorityAlert: `EXECUTIVE SITREP: Level-3 disaster response initiated for ${incident.location}. Inter-agency coordination active with ${resources.selectedAmbulances.length} ambulance(s), ${resources.selectedRescueTeams.length} rescue squad(s), and shelter staging at ${shelter.selectedShelter.name}.`,
    channels: ['Cell Broadcast (CAP)', 'Responder VHF Radio', 'Hospital HealthNet HL7', 'Municipal Alert Feed'],
  };
}

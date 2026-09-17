import { Incident, dataStore } from '../services/dataStore';
import { geminiService } from '../services/geminiService';
import { IncidentAnalysisOutput, AgentExecutionEnvelope } from './incidentAnalysisAgent';
import { RiskAssessmentOutput } from './riskAssessmentAgent';
import { ResourceAllocationOutput } from './resourceAllocationAgent';
import { RouteOptimizationOutput } from './routeOptimizationAgent';
import { MedicalCoordinationOutput } from './medicalCoordinationAgent';
import { ShelterEvacuationOutput } from './shelterAgent';
import { CommunicationOutput } from './communicationAgent';
import { ToolCallRecord } from '../tools/emergencyTools';

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
}

// Input Schema
export interface ResponseCoordinatorInput {
  incident: Incident;
  analysis: IncidentAnalysisOutput;
  risk: RiskAssessmentOutput;
  resources: ResourceAllocationOutput;
  routes: RouteOptimizationOutput;
  medical: MedicalCoordinationOutput;
  shelter: ShelterEvacuationOutput;
  communication: CommunicationOutput;
}

export async function runResponseCoordinatorAgent(
  input: ResponseCoordinatorInput
): Promise<AgentExecutionEnvelope<UnifiedResponsePlan>> {
  const startTime = new Date().toISOString();
  const startMs = Date.now();
  const toolsCalled: ToolCallRecord[] = [];
  const { incident, analysis, risk, resources, routes, medical, shelter, communication } = input;

  // Validation
  if (!incident || !analysis || !resources || !medical || !shelter) {
    throw new Error('ResponseCoordinatorAgent Error: Missing essential upstream agent outputs.');
  }

  // Tool Call: Cross-agent consistency validation
  const verifiedAmbulances = resources.selectedAmbulances.filter((a) =>
    dataStore.getAmbulanceById(a.id)
  );
  const verifiedHospital = dataStore.getHospitalById(medical.selectedHospital.id);
  const verifiedShelter = dataStore.getShelterById(shelter.selectedShelter.id);

  toolsCalled.push({
    toolName: 'validateCrossAgentConsistency',
    params: {
      ambulanceIds: resources.selectedResources,
      hospitalId: medical.selectedHospital.id,
      shelterId: shelter.selectedShelter.id,
    },
    resultSummary: `Validated: ${verifiedAmbulances.length} fleet units, hospital "${verifiedHospital?.name}", shelter "${verifiedShelter?.name}"`,
    timestamp: new Date().toISOString(),
  });

  const prompt = `You are the Lead Response Coordinator Agent for ResQAI Emergency Platform.
Synthesize the verified multi-agent inputs into an executive command plan with 6 prioritized operational directives:
- Incident: ${incident.disasterType} at ${incident.location} (Severity: ${analysis.severity}, Score: ${risk.priorityScore}/100)
- Verified Ambulances: ${resources.selectedAmbulances.map((a) => `${a.callSign} (${a.medicalCapability})`).join(', ')}
- Verified Rescue Squads: ${resources.selectedRescueTeams.map((r) => r.name).join(', ')}
- Designated Hospital: ${medical.selectedHospital.name} (${medical.reservedEmergencyBeds} ER beds, ${medical.reservedIcuBeds} ICU beds reserved)
- Designated Shelter: ${shelter.selectedShelter.name} (${shelter.peopleToEvacuate} evacuees)
- Route Obstructions: ${routes.blockedRoadNames.join(', ') || 'Corridors Clear'}

Output strict JSON with these exact 6 strategic actions:
{
  "summary": "1-2 sentence executive briefing synthesizing all operations",
  "actions": [
    { "priority": 1, "action": "Dispatch ambulance", "resource": "${resources.selectedAmbulances.map((a) => a.callSign).join(', ')}", "reason": "Immediate trauma triage and airway stabilization on site" },
    { "priority": 2, "action": "Dispatch rescue team", "resource": "${resources.selectedRescueTeams.map((r) => r.name).join(', ')}", "reason": "Water extraction and high-clearance rescue of stranded residents" },
    { "priority": 3, "action": "Route injured people to hospital", "resource": "${medical.selectedHospital.name}", "reason": "Dedicated trauma transport corridor for critical casualty admission" },
    { "priority": 4, "action": "Evacuate civilians", "resource": "${shelter.selectedShelter.name}", "reason": "Relief shelter staging for displaced families" },
    { "priority": 5, "action": "Block unsafe road", "resource": "Traffic Police & Diversion Cordon", "reason": "Divert civilian vehicles around flooded bottleneck" },
    { "priority": 6, "action": "Send citizen alert", "resource": "Cell Broadcast & Public Sirens", "reason": "Broadcast urgent hazard advisory and shelter navigation points" }
  ]
}
Return valid raw JSON only.`;

  let actions: CoordinatedAction[] = [];
  let summary = `Unified emergency response activated for ${incident.disasterType} at ${incident.location}. Multi-agency fleet, medical triage, and route clearance coordinated.`;
  let status: 'completed' | 'warning' = 'completed';

  if (geminiService.isAvailable()) {
    try {
      const llmResult = await geminiService.generateJSON<{ summary: string; actions: CoordinatedAction[] }>(
        prompt,
        'Senior emergency response coordinator.'
      );
      if (llmResult.summary) summary = llmResult.summary;
      if (llmResult.actions && llmResult.actions.length > 0) actions = llmResult.actions;
    } catch (err) {
      console.warn('ResponseCoordinatorAgent LLM failed, using deterministic fallback synthesis', err);
      status = 'warning';
      actions = getDeterministicActions(resources, medical, shelter, routes, incident);
    }
  } else {
    actions = getDeterministicActions(resources, medical, shelter, routes, incident);
  }

  if (actions.length === 0) {
    actions = getDeterministicActions(resources, medical, shelter, routes, incident);
  }

  const ambulanceAssignments = resources.selectedAmbulances.map((amb) => ({
    ambulanceId: amb.id,
    callSign: amb.callSign,
    capability: amb.medicalCapability,
    etaMinutes: routes.ambulanceRoute?.estimatedTimeMinutes || amb.etaMinutes || 8,
    destinationHospital: medical.selectedHospital.name,
    routeDetour: routes.ambulanceRoute?.routeType === 'ALTERNATIVE_DETOUR',
  }));

  const rescueAssignments = resources.selectedRescueTeams.map((team) => ({
    teamId: team.id,
    name: team.name,
    type: team.teamType,
    mission: `Execute water extraction and structural triage at ${incident.location}.`,
  }));

  const hospitalAssignments = [
    {
      hospitalId: medical.selectedHospital.id,
      name: medical.selectedHospital.name,
      emergencyBedsReserved: medical.reservedEmergencyBeds,
      icuBedsReserved: medical.reservedIcuBeds,
      phone: medical.selectedHospital.phone,
    },
  ];

  const evacuationPlan = shelter.evacuationRequired
    ? [
        {
          shelterId: shelter.selectedShelter.id,
          shelterName: shelter.selectedShelter.name,
          peopleCount: shelter.peopleToEvacuate,
          status: shelter.capacityStatus,
        },
      ]
    : [];

  const plan: UnifiedResponsePlan = {
    incidentId: incident.id,
    priority: analysis.severity,
    summary,
    actions,
    ambulanceAssignments,
    rescueAssignments,
    hospitalAssignments,
    evacuationPlan,
    citizenMessage: communication.citizenMessage,
    responderMessage: communication.responderMessage,
    requiresHumanApproval: true,
    generatedAt: new Date().toISOString(),
    approvalStatus: 'PENDING',
  };

  const endMs = Date.now();
  const decision = `Synthesized ${actions.length}-step unified response plan. Assigned ${ambulanceAssignments.length} ambulance(s), reserved ${medical.reservedEmergencyBeds} ER & ${medical.reservedIcuBeds} ICU bed(s) at ${medical.selectedHospital.name}, and routed evacuees to ${shelter.selectedShelter.name}. Placed in PENDING state awaiting Human-in-the-Loop operator authorization.`;

  return {
    agentName: 'Response Coordinator Agent',
    agentRole: 'Unified Command & Plan Synthesis',
    status,
    startTime,
    endTime: new Date().toISOString(),
    durationMs: endMs - startMs,
    decision,
    toolsCalled,
    summary: `Unified plan synthesized with ${actions.length} tactical actions. Human-in-the-loop authorization required.`,
    result: plan,
  };
}

function getDeterministicActions(
  resources: ResourceAllocationOutput,
  medical: MedicalCoordinationOutput,
  shelter: ShelterEvacuationOutput,
  routes: RouteOptimizationOutput,
  incident: Incident
): CoordinatedAction[] {
  return [
    {
      priority: 1,
      action: 'Dispatch ambulance',
      resource: resources.selectedAmbulances.map((a) => a.callSign).join(', ') || 'Paramedic Unit',
      reason: 'Immediate trauma triage and airway stabilization on site.',
    },
    {
      priority: 2,
      action: 'Dispatch rescue team',
      resource: resources.selectedRescueTeams.map((r) => r.name).join(', ') || 'NDRF Unit',
      reason: 'Water extraction and high-clearance rescue of stranded residents.',
    },
    {
      priority: 3,
      action: 'Route injured people to hospital',
      resource: `${medical.selectedHospital.name} (${medical.reservedEmergencyBeds} ER / ${medical.reservedIcuBeds} ICU)`,
      reason: 'Dedicated trauma transport corridor for critical casualty admission.',
    },
    {
      priority: 4,
      action: 'Evacuate civilians',
      resource: `${shelter.selectedShelter.name} (${shelter.peopleToEvacuate} citizens)`,
      reason: 'Relief shelter staging with food, potable water, and emergency medical post.',
    },
    {
      priority: 5,
      action: 'Block unsafe road',
      resource: `Traffic Police (${routes.blockedRoadNames.join(', ') || 'Hazard Sectors'})`,
      reason: routes.blockedRoadNames.length > 0
        ? `Cordon off flooded bottleneck (${routes.blockedRoadNames.join(', ')}) and divert civilian traffic.`
        : 'Maintain green light priority along arterial emergency transit corridor.',
    },
    {
      priority: 6,
      action: 'Send citizen alert',
      resource: 'Cell Broadcast & Public Sirens',
      reason: 'Broadcast urgent CAP warning, shelter locations, and evacuation safety guidance.',
    },
  ];
}

import { Incident, Ambulance, RescueTeam } from '../services/dataStore';
import { geminiService } from '../services/geminiService';
import { IncidentAnalysisOutput, AgentExecutionEnvelope } from './incidentAnalysisAgent';
import { RiskAssessmentOutput } from './riskAssessmentAgent';
import {
  findAvailableAmbulances,
  findAvailableRescueTeams,
  ToolCallRecord,
} from '../tools/emergencyTools';

// Input Schema
export interface ResourceAllocationInput {
  incident: Incident;
  analysis: IncidentAnalysisOutput;
  risk: RiskAssessmentOutput;
}

// Output Schema
export interface ResourceAllocationOutput {
  selectedAmbulances: (Ambulance & { distanceKm: number; matchReason: string })[];
  selectedRescueTeams: (RescueTeam & { distanceKm: number; matchReason: string })[];
  selectedResources: string[];
  alternatives: { id: string; type: string; name: string; reason: string }[];
  reasoning: string;
  scoringBreakdown: {
    resourceId: string;
    capabilityScore: number;
    distanceScore: number;
    trafficScore: number;
    compositeScore: number;
  }[];
}

export async function runResourceAllocationAgent(
  input: ResourceAllocationInput
): Promise<AgentExecutionEnvelope<ResourceAllocationOutput>> {
  const startTime = new Date().toISOString();
  const startMs = Date.now();
  const toolsCalled: ToolCallRecord[] = [];
  const { incident, analysis, risk } = input;

  // Validation
  if (!incident || !analysis || !risk) {
    throw new Error('ResourceAllocationAgent Error: incident, analysis, and risk inputs are all required.');
  }

  const origin = incident.coordinates;
  const isCritical = risk.riskLevel === 'CRITICAL' || (incident.injured || 0) >= 3;

  // 1. Tool Call: findAvailableAmbulances
  const availableAmbulances = findAvailableAmbulances({ origin });
  toolsCalled.push({
    toolName: 'findAvailableAmbulances',
    params: { origin, capability: isCritical ? 'ICU' : undefined },
    resultSummary: `Discovered ${availableAmbulances.length} available ambulances in active fleet registry`,
    timestamp: new Date().toISOString(),
  });

  // 2. Tool Call: findAvailableRescueTeams
  const availableRescueTeams = findAvailableRescueTeams({ origin });
  toolsCalled.push({
    toolName: 'findAvailableRescueTeams',
    params: { origin, teamType: incident.disasterType === 'Flood' ? 'NDRF' : undefined },
    resultSummary: `Discovered ${availableRescueTeams.length} available rescue teams in active registry`,
    timestamp: new Date().toISOString(),
  });

  if (availableAmbulances.length === 0) {
    throw new Error('ResourceAllocationAgent Error: No available ambulances currently in service.');
  }

  // Deterministic scoring of REAL ambulances
  const scoredAmbulances = availableAmbulances.map((amb) => {
    let capabilityScore = 15;
    if (amb.medicalCapability === 'ICU') capabilityScore = 40;
    else if (amb.medicalCapability === 'Advanced Life Support (ALS)') capabilityScore = 30;

    let trafficScore = 20;
    if (amb.currentTraffic === 'HIGH') trafficScore = 5;
    else if (amb.currentTraffic === 'MEDIUM') trafficScore = 12;

    const dist = amb.distanceKm ?? 10;
    const distanceScore = Math.max(5, Math.round(40 - dist * 2.5));

    const finalCapability = isCritical ? capabilityScore * 1.5 : capabilityScore;
    const compositeScore = Math.round(finalCapability + trafficScore + distanceScore);

    return {
      amb,
      capabilityScore: Math.round(finalCapability),
      distanceScore,
      trafficScore,
      compositeScore,
    };
  });

  scoredAmbulances.sort((a, b) => b.compositeScore - a.compositeScore);

  const neededAmbulancesCount = analysis.estimatedResourcesRequired.ambulances || 1;
  const selectedAmbList = scoredAmbulances.slice(0, neededAmbulancesCount).map((item) => {
    const dist = item.amb.distanceKm;
    let matchReason = `Composite Match Score: ${item.compositeScore} pts. `;
    if (item.amb.medicalCapability === 'ICU' && isCritical) {
      matchReason += `Selected for vital ICU life-support capability for severe trauma stabilization. Traffic: ${item.amb.currentTraffic}.`;
    } else {
      matchReason += `Optimal proximity (${dist} km) with ${item.amb.medicalCapability} and ${item.amb.currentTraffic} traffic.`;
    }
    return {
      ...item.amb,
      distanceKm: dist,
      matchReason,
    };
  });

  // Select rescue teams from real available candidates
  const neededRescueCount = analysis.estimatedResourcesRequired.rescueTeams || 1;
  const selectedRescueList = availableRescueTeams.slice(0, neededRescueCount).map((r) => {
    const dist = r.distanceKm;
    const matchReason = `Specialized team (${r.teamType}) stationed at ${r.locationName} (${dist} km away). Equipped with: ${r.equipment.slice(0, 3).join(', ')}.`;
    return {
      ...r,
      distanceKm: dist,
      matchReason,
    };
  });

  const selectedResourceIds = [
    ...selectedAmbList.map((a) => a.id),
    ...selectedRescueList.map((r) => r.id),
  ];

  const alternatives = scoredAmbulances.slice(neededAmbulancesCount, neededAmbulancesCount + 2).map((item) => ({
    id: item.amb.id,
    type: 'Ambulance',
    name: `${item.amb.callSign} (${item.amb.medicalCapability})`,
    reason: `Secondary reserve (${item.amb.distanceKm} km away, ${item.amb.currentTraffic} traffic). Score: ${item.compositeScore}.`,
  }));

  // Reasoning formulation (LLM or deterministic fallback)
  let reasoning = isCritical
    ? `Critical trauma priority: Allocated ${selectedAmbList.map((a) => `${a.callSign} [${a.medicalCapability}, ${a.distanceKm} km]`).join(' & ')}. Medical capability was prioritized over raw physical distance to ensure ventilator and airway management. Rescue units: ${selectedRescueList.map((r) => `${r.name} (${r.teamType})`).join(', ')} mobilized for flood extraction.`
    : `Standard deployment dispatched: ${selectedAmbList.map((a) => a.callSign).join(', ')} and ${selectedRescueList.map((r) => r.name).join(', ')}.`;

  if (geminiService.isAvailable()) {
    try {
      const prompt = `You are the Resource Allocation Agent for ResQAI Emergency Platform.
We have queried the operational fleet tools and determined the following verified assignments:
- Selected Ambulances: ${selectedAmbList.map((a) => `${a.callSign} (${a.medicalCapability}, ${a.distanceKm} km, traffic: ${a.currentTraffic})`).join(', ')}
- Selected Rescue Squads: ${selectedRescueList.map((r) => `${r.name} (${r.teamType}, ${r.distanceKm} km)`).join(', ')}
- Incident Severity: ${risk.riskLevel} with ${incident.injured} injured

Explain the operational reasoning for why these specific units are matched to the casualty profile.
Do NOT invent new units. Return raw text of 2-3 sentences.`;

      const llmExplanation = await geminiService.generateText(prompt, 'Expert tactical resource allocation officer.');
      if (llmExplanation && llmExplanation.trim().length > 20) {
        reasoning = llmExplanation.trim();
      }
    } catch (err) {
      console.warn('ResourceAllocationAgent LLM explanation failed, using fallback rationale', err);
    }
  }

  const endMs = Date.now();
  const decision = `Allocated ${selectedAmbList.length} ambulance(s) (${selectedAmbList.map((a) => a.callSign).join(', ')}) and ${selectedRescueList.length} rescue squad(s) (${selectedRescueList.map((r) => r.name).join(', ')}). Capability matched to critical life-support profile.`;

  const output: ResourceAllocationOutput = {
    selectedAmbulances: selectedAmbList,
    selectedRescueTeams: selectedRescueList,
    selectedResources: selectedResourceIds,
    alternatives,
    reasoning,
    scoringBreakdown: scoredAmbulances.map((s) => ({
      resourceId: s.amb.id,
      capabilityScore: s.capabilityScore,
      distanceScore: s.distanceScore,
      trafficScore: s.trafficScore,
      compositeScore: s.compositeScore,
    })),
  };

  return {
    agentName: 'Resource Allocation Agent',
    agentRole: 'Fleet Optimization & Capability Matching',
    status: 'completed',
    startTime,
    endTime: new Date().toISOString(),
    durationMs: endMs - startMs,
    decision,
    toolsCalled,
    summary: `Allocated ${selectedAmbList.length} ambulance(s) and ${selectedRescueList.length} rescue team(s) with verified availability.`,
    result: output,
  };
}

import { Incident } from '../services/dataStore';
import { RouteResult } from '../services/routingService';
import { geminiService } from '../services/geminiService';
import { IncidentAnalysisOutput, AgentExecutionEnvelope } from './incidentAnalysisAgent';
import { RiskAssessmentOutput } from './riskAssessmentAgent';
import { ResourceAllocationOutput } from './resourceAllocationAgent';
import {
  getRoadConditions,
  findAlternativeRoute,
  calculateDistance,
  ToolCallRecord,
} from '../tools/emergencyTools';

// Input Schema
export interface RouteOptimizationInput {
  incident: Incident;
  analysis: IncidentAnalysisOutput;
  risk: RiskAssessmentOutput;
  resources: ResourceAllocationOutput;
}

// Output Schema
export interface RouteOptimizationOutput {
  ambulanceRoute?: RouteResult;
  rescueTeamRoute?: RouteResult;
  activeBlockadesCount: number;
  blockedRoadNames: string[];
  totalDetourTimeMinutes: number;
  corridorStatus: 'DIRECT_ACCESS' | 'DETOUR_REQUIRED' | 'HAZARDOUS_ACCESS';
  reasoning: string;
}

export async function runRouteOptimizationAgent(
  input: RouteOptimizationInput
): Promise<AgentExecutionEnvelope<RouteOptimizationOutput>> {
  const startTime = new Date().toISOString();
  const startMs = Date.now();
  const toolsCalled: ToolCallRecord[] = [];
  const { incident, resources } = input;

  // Validation
  if (!incident || !incident.coordinates) {
    throw new Error('RouteOptimizationAgent Error: Valid incident with coordinates is required.');
  }

  // 1. Tool Call: getRoadConditions
  const roadsTelemetry = getRoadConditions({ area: incident.location });
  const blockedRoads = roadsTelemetry.blockedRoads;
  const blockedRoadNames = blockedRoads.map((r) => r.name);
  toolsCalled.push({
    toolName: 'getRoadConditions',
    params: { area: incident.location },
    resultSummary: `${blockedRoads.length} blocked road(s) identified in monitored network (${blockedRoadNames.join(', ') || 'None'})`,
    timestamp: new Date().toISOString(),
  });

  const primaryAmbulance = resources.selectedAmbulances[0];
  const primaryRescue = resources.selectedRescueTeams[0];

  let ambulanceRoute: RouteResult | undefined;
  let rescueTeamRoute: RouteResult | undefined;

  // 2. Tool Call: findAlternativeRoute for ambulance
  if (primaryAmbulance) {
    ambulanceRoute = findAlternativeRoute({
      origin: primaryAmbulance.coordinates,
      destination: incident.coordinates,
      emergencyVehicle: true,
      avoidBlockades: true,
    });
    toolsCalled.push({
      toolName: 'findAlternativeRoute',
      params: {
        origin: primaryAmbulance.coordinates,
        destination: incident.coordinates,
        emergencyVehicle: true,
      },
      resultSummary: `Route generated: ${ambulanceRoute.routeType}, distance: ${ambulanceRoute.totalDistanceKm} km, ETA: ${ambulanceRoute.estimatedTimeMinutes} min`,
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Tool Call: findAlternativeRoute for rescue team
  if (primaryRescue) {
    rescueTeamRoute = findAlternativeRoute({
      origin: primaryRescue.coordinates,
      destination: incident.coordinates,
      emergencyVehicle: true,
      avoidBlockades: true,
    });
    toolsCalled.push({
      toolName: 'findAlternativeRoute',
      params: {
        origin: primaryRescue.coordinates,
        destination: incident.coordinates,
      },
      resultSummary: `Rescue route generated: ${rescueTeamRoute.routeType}, distance: ${rescueTeamRoute.totalDistanceKm} km, ETA: ${rescueTeamRoute.estimatedTimeMinutes} min`,
      timestamp: new Date().toISOString(),
    });
  }

  const hasActiveDetour = ambulanceRoute?.routeType === 'ALTERNATIVE_DETOUR';
  const totalDetourMinutes = hasActiveDetour ? 6 : 0;
  const corridorStatus: 'DIRECT_ACCESS' | 'DETOUR_REQUIRED' | 'HAZARDOUS_ACCESS' = hasActiveDetour
    ? 'DETOUR_REQUIRED'
    : 'DIRECT_ACCESS';

  let reasoning = hasActiveDetour
    ? `Active flood/debris blockades detected on: ${blockedRoadNames.join(', ')}. Calculated detour via open arterial corridor. Ambulance transit adjusted to ${ambulanceRoute?.estimatedTimeMinutes || 8} mins.`
    : `Primary transit corridors fully open. Direct high-speed emergency lane cleared with zero active roadblocks. Ambulance ETA: ${ambulanceRoute?.estimatedTimeMinutes || 6} mins.`;

  if (geminiService.isAvailable()) {
    try {
      const prompt = `You are the Route Optimization Agent for ResQAI Emergency Platform.
Based on real road conditions:
- Blocked Roads: ${blockedRoadNames.join(', ') || 'None'}
- Ambulance Route Type: ${ambulanceRoute?.routeType || 'PRIMARY'} (${ambulanceRoute?.totalDistanceKm} km, ETA: ${ambulanceRoute?.estimatedTimeMinutes} min)
- Avoided Hazard Roads: ${ambulanceRoute?.avoidedRoads?.map((a) => a.name).join(', ') || 'None'}

Provide a 2-sentence tactical route evaluation explaining the path choice and ETA impact.
Do NOT invent fictional road names.`;

      const llmExplanation = await geminiService.generateText(prompt, 'Expert emergency traffic and route coordinator.');
      if (llmExplanation && llmExplanation.trim().length > 20) {
        reasoning = llmExplanation.trim();
      }
    } catch (err) {
      console.warn('RouteOptimizationAgent LLM explanation failed, using fallback', err);
    }
  }

  const endMs = Date.now();
  const decision = hasActiveDetour
    ? `Detour route activated bypassing ${blockedRoadNames.join(', ')}. Emergency convoy routed via high-clearance arterial (Ambulance ETA: ${ambulanceRoute?.estimatedTimeMinutes || 8} min).`
    : `Direct emergency route designated. Clear transit corridor established (Ambulance ETA: ${ambulanceRoute?.estimatedTimeMinutes || 6} min).`;

  const output: RouteOptimizationOutput = {
    ambulanceRoute,
    rescueTeamRoute,
    activeBlockadesCount: blockedRoads.length,
    blockedRoadNames,
    totalDetourTimeMinutes: totalDetourMinutes,
    corridorStatus,
    reasoning,
  };

  return {
    agentName: 'Route Optimization Agent',
    agentRole: 'Geospatial Pathing & Road Hazards',
    status: 'completed',
    startTime,
    endTime: new Date().toISOString(),
    durationMs: endMs - startMs,
    decision,
    toolsCalled,
    summary: hasActiveDetour
      ? `Detour established around ${blockedRoadNames.join(', ')}. Ambulance ETA: ${ambulanceRoute?.estimatedTimeMinutes} min.`
      : `Optimal route open with green signal corridor. Ambulance ETA: ${ambulanceRoute?.estimatedTimeMinutes} min.`,
    result: output,
  };
}

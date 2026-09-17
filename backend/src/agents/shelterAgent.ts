import { Incident, Shelter } from '../services/dataStore';
import { RouteResult } from '../services/routingService';
import { geminiService } from '../services/geminiService';
import { IncidentAnalysisOutput, AgentExecutionEnvelope } from './incidentAnalysisAgent';
import { RiskAssessmentOutput } from './riskAssessmentAgent';
import { RouteOptimizationOutput } from './routeOptimizationAgent';
import {
  getShelterCapacity,
  findAlternativeRoute,
  ToolCallRecord,
} from '../tools/emergencyTools';

// Input Schema
export interface ShelterEvacuationInput {
  incident: Incident;
  analysis: IncidentAnalysisOutput;
  risk: RiskAssessmentOutput;
  routes: RouteOptimizationOutput;
}

// Output Schema
export interface ShelterEvacuationOutput {
  evacuationRequired: boolean;
  peopleToEvacuate: number;
  selectedShelter: Shelter & { distanceKm: number };
  backupShelter: Shelter & { distanceKm: number };
  capacityStatus: 'SUFFICIENT CAPACITY' | 'LIMITED CAPACITY' | 'REDIRECTED_OVERFLOW';
  remainingAfterEvac: number;
  evacuationRoute?: RouteResult;
  evacuationPlanSummary: string;
  facilitiesAvailable: string[];
}

export async function runShelterAgent(
  input: ShelterEvacuationInput
): Promise<AgentExecutionEnvelope<ShelterEvacuationOutput>> {
  const startTime = new Date().toISOString();
  const startMs = Date.now();
  const toolsCalled: ToolCallRecord[] = [];
  const { incident, analysis } = input;

  // Validation
  if (!incident || !incident.coordinates) {
    throw new Error('ShelterAgent Error: Valid incident with coordinates is required.');
  }

  const origin = incident.coordinates;
  const isFloodOrCollapse =
    incident.disasterType === 'Flood' ||
    incident.disasterType === 'Building Collapse' ||
    incident.disasterType === 'Cyclone' ||
    analysis.severity === 'CRITICAL';

  const evacuationRequired = isFloodOrCollapse && (incident.peopleAffected || 0) > 10;
  const peopleToEvacuate = evacuationRequired
    ? Math.min(incident.peopleAffected, 150)
    : 0;

  // 1. Tool Call: getShelterCapacity
  const candidateShelters = getShelterCapacity({
    origin,
    requiredCapacity: peopleToEvacuate,
  });

  toolsCalled.push({
    toolName: 'getShelterCapacity',
    params: { origin, requiredCapacity: peopleToEvacuate },
    resultSummary: `Discovered ${candidateShelters.length} operational shelters with verified remaining capacity`,
    timestamp: new Date().toISOString(),
  });

  if (candidateShelters.length === 0) {
    throw new Error('ShelterAgent Error: No municipal shelters with open capacity.');
  }

  const primary = candidateShelters[0];
  const backup = candidateShelters[1] || primary;

  // Real capacity calculation
  const remainingAfterEvac = Math.max(0, primary.remainingCapacity - peopleToEvacuate);
  const capacityStatus: 'SUFFICIENT CAPACITY' | 'LIMITED CAPACITY' | 'REDIRECTED_OVERFLOW' =
    primary.remainingCapacity >= peopleToEvacuate
      ? 'SUFFICIENT CAPACITY'
      : 'LIMITED CAPACITY';

  // 2. Tool Call: findAlternativeRoute for civilian evacuation corridor
  let evacuationRoute: RouteResult | undefined;
  if (evacuationRequired) {
    evacuationRoute = findAlternativeRoute({
      origin: incident.coordinates,
      destination: primary.coordinates,
      emergencyVehicle: false,
      avoidBlockades: true,
    });

    toolsCalled.push({
      toolName: 'findAlternativeRoute',
      params: {
        origin: incident.coordinates,
        destination: primary.coordinates,
        emergencyVehicle: false,
      },
      resultSummary: `Civic evacuation route: ${evacuationRoute.totalDistanceKm} km, ETA: ${evacuationRoute.estimatedTimeMinutes} min (${evacuationRoute.routeType})`,
      timestamp: new Date().toISOString(),
    });
  }

  let evacuationPlanSummary = evacuationRequired
    ? `Civic evacuation mobilized for ${peopleToEvacuate} citizens at risk in ${incident.location}. Routing to ${primary.name} (${primary.distanceKm} km away) with verified open capacity (${remainingAfterEvac} beds remaining after staging). Backup shelter designated at ${backup.name}.`
    : 'No mass civilian evacuation required at this stage; on-site perimeter containment sufficient.';

  if (geminiService.isAvailable() && evacuationRequired) {
    try {
      const prompt = `You are the Shelter & Evacuation Agent for ResQAI Emergency Platform.
Verified shelter data from tools:
- Designated Shelter: ${primary.name} (${primary.distanceKm} km away)
- Evacuees to House: ${peopleToEvacuate} people
- Current Capacity: ${primary.totalCapacity}, Occupied: ${primary.occupied}, Remaining Available: ${primary.remainingCapacity}
- Remaining After Evacuation: ${remainingAfterEvac}
- Available Facilities: ${primary.facilities.join(', ')}
- Transit Route: ${evacuationRoute?.routeType || 'PRIMARY'} (${evacuationRoute?.estimatedTimeMinutes} mins)

Write a 2-sentence tactical evacuation directive for civil relief volunteers and transport buses.
Do NOT change numbers or shelter names.`;

      const llmText = await geminiService.generateText(prompt, 'Civic disaster evacuation coordinator.');
      if (llmText && llmText.trim().length > 20) {
        evacuationPlanSummary = llmText.trim();
      }
    } catch (err) {
      console.warn('ShelterAgent LLM failed, using fallback summary', err);
    }
  }

  const endMs = Date.now();
  const decision = evacuationRequired
    ? `Evacuation authorized for ${peopleToEvacuate} residents. Designated ${primary.name} (${capacityStatus}, ${remainingAfterEvac} beds left). Backup: ${backup.name}.`
    : 'Civic evacuation withheld; on-site containment and shelter-in-place protocol sufficient.';

  const output: ShelterEvacuationOutput = {
    evacuationRequired,
    peopleToEvacuate,
    selectedShelter: primary,
    backupShelter: backup,
    capacityStatus,
    remainingAfterEvac,
    evacuationRoute,
    evacuationPlanSummary,
    facilitiesAvailable: primary.facilities,
  };

  return {
    agentName: 'Shelter/Evacuation Agent',
    agentRole: 'Civic Capacity & Relief Coordination',
    status: 'completed',
    startTime,
    endTime: new Date().toISOString(),
    durationMs: endMs - startMs,
    decision,
    toolsCalled,
    summary: evacuationRequired
      ? `Evacuation mobilized for ${peopleToEvacuate} residents to ${primary.name}. ${remainingAfterEvac} capacity remaining.`
      : 'On-site containment sufficient; public evacuation not activated.',
    result: output,
  };
}

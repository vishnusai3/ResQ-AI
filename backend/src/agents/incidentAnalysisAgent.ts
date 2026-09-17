import { Incident } from '../services/dataStore';
import { geminiService } from '../services/geminiService';
import { getRoadConditions, ToolCallRecord } from '../tools/emergencyTools';

// Input Schema
export interface IncidentAnalysisInput {
  incident: Incident;
  environmentalContext?: { weather?: string; rainMmPerHour?: number };
}

// Output Schema
export interface IncidentAnalysisOutput {
  incidentId: string;
  incidentSummary: string;
  disasterType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  peopleAtRisk: number;
  estimatedResourcesRequired: {
    ambulances: number;
    rescueTeams: number;
    fireUnits: number;
  };
  immediateActions: string[];
  confidenceScore: number;
  hazardObservations: string[];
  provider: 'GEMINI_LLM' | 'FALLBACK_HEURISTIC';
}

export interface AgentExecutionEnvelope<T> {
  agentName: string;
  agentRole: string;
  status: 'completed' | 'warning' | 'failed';
  startTime: string;
  endTime: string;
  durationMs: number;
  decision: string;
  toolsCalled: ToolCallRecord[];
  summary: string;
  result: T;
}

export async function runIncidentAnalysisAgent(
  input: IncidentAnalysisInput
): Promise<AgentExecutionEnvelope<IncidentAnalysisOutput>> {
  const startTime = new Date().toISOString();
  const startMs = Date.now();
  const toolsCalled: ToolCallRecord[] = [];
  const { incident, environmentalContext } = input;

  // Validation
  if (!incident || !incident.id) {
    throw new Error('IncidentAnalysisAgent Error: Valid incident with an ID is required.');
  }
  if (!incident.coordinates || typeof incident.coordinates.lat !== 'number' || typeof incident.coordinates.lng !== 'number') {
    throw new Error(`IncidentAnalysisAgent Error: Incident ${incident.id} missing valid geographic coordinates.`);
  }

  // Tool Call: getRoadConditions
  const roadConditions = getRoadConditions({ area: incident.location });
  toolsCalled.push({
    toolName: 'getRoadConditions',
    params: { area: incident.location },
    resultSummary: `${roadConditions.blockedRoads.length} blocked roads, ${roadConditions.openRoads.length} open corridors detected`,
    timestamp: new Date().toISOString(),
  });

  const env = environmentalContext || { weather: 'Monsoon Rain Storm', rainMmPerHour: 55 };

  let output: IncidentAnalysisOutput;
  let status: 'completed' | 'warning' = 'completed';

  const prompt = `You are the Incident Analysis Agent for ResQAI Emergency Platform.
Analyze this verified incident using strictly verified operational numbers (do not invent casualties):
- Incident ID: ${incident.id}
- Disaster Type: ${incident.disasterType}
- Location: ${incident.location} (lat: ${incident.coordinates.lat}, lng: ${incident.coordinates.lng})
- Reported People Affected: ${incident.peopleAffected}
- Reported Injured: ${incident.injured}
- Reported Missing: ${incident.missing}
- Environmental Weather: ${JSON.stringify(env)}
- Road Network Status: ${roadConditions.summary}

Your task: Provide situational analysis, hazard factors, and immediate response requirements.
Do NOT invent operational data or fake vehicle names.
Return strict JSON:
{
  "incidentSummary": "1-2 sentence tactical summary",
  "disasterType": "${incident.disasterType}",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "riskFactors": ["factor 1", "factor 2"],
  "peopleAtRisk": number,
  "estimatedResourcesRequired": {
    "ambulances": number,
    "rescueTeams": number,
    "fireUnits": number
  },
  "immediateActions": ["action 1", "action 2"],
  "hazardObservations": ["obs 1", "obs 2"]
}`;

  if (geminiService.isAvailable()) {
    try {
      const llmResult = await geminiService.generateJSON<Partial<IncidentAnalysisOutput>>(
        prompt,
        'Expert incident triage agent. Return valid JSON only.'
      );

      output = {
        incidentId: incident.id,
        incidentSummary: llmResult.incidentSummary || `Verified ${incident.disasterType} at ${incident.location} requiring multi-tier emergency staging.`,
        disasterType: incident.disasterType,
        severity: llmResult.severity || (incident.injured >= 5 ? 'CRITICAL' : 'HIGH'),
        riskFactors: llmResult.riskFactors || ['Rapid water ingress', 'Low-elevation vulnerability'],
        peopleAtRisk: incident.peopleAffected,
        estimatedResourcesRequired: {
          ambulances: Math.max(1, Math.ceil(incident.injured / 2)),
          rescueTeams: incident.disasterType === 'Flood' || incident.disasterType === 'Building Collapse' ? 2 : 1,
          fireUnits: incident.disasterType === 'Fire' ? 2 : 0,
        },
        immediateActions: llmResult.immediateActions || ['Establish incident command perimeter', 'Deploy water extraction teams'],
        confidenceScore: 0.95,
        hazardObservations: llmResult.hazardObservations || [roadConditions.summary],
        provider: 'GEMINI_LLM',
      };
    } catch (err) {
      console.warn('IncidentAnalysisAgent LLM failed, using deterministic fallback logic', err);
      status = 'warning';
      output = getDeterministicAnalysisFallback(incident, roadConditions.summary);
    }
  } else {
    output = getDeterministicAnalysisFallback(incident, roadConditions.summary);
  }

  const endMs = Date.now();
  const decision = `Classified as ${output.severity} severity ${output.disasterType} incident affecting ${output.peopleAtRisk} individuals. Initial requirement: ${output.estimatedResourcesRequired.ambulances} ambulance(s) and ${output.estimatedResourcesRequired.rescueTeams} rescue squad(s).`;

  return {
    agentName: 'Incident Analysis Agent',
    agentRole: 'Data Ingestion & Hazard Verification',
    status,
    startTime,
    endTime: new Date().toISOString(),
    durationMs: endMs - startMs,
    decision,
    toolsCalled,
    summary: `Verified ${incident.title} (${incident.location}). Severity assessed at ${output.severity} with ${output.peopleAtRisk} at risk.`,
    result: output,
  };
}

function getDeterministicAnalysisFallback(incident: Incident, roadSummary: string): IncidentAnalysisOutput {
  let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
  if (incident.injured >= 4 || incident.missing > 0 || incident.peopleAffected > 50 || incident.disasterType === 'Flood') {
    severity = 'CRITICAL';
  } else if (incident.injured > 0 || incident.peopleAffected > 15) {
    severity = 'HIGH';
  }

  const ambulances = Math.max(1, Math.ceil(incident.injured / 2));
  const rescueTeams = incident.disasterType === 'Flood' || incident.disasterType === 'Building Collapse' ? 2 : 1;
  const fireUnits = incident.disasterType === 'Fire' ? 2 : 0;

  return {
    incidentId: incident.id,
    incidentSummary: `Verified ${incident.disasterType} emergency at ${incident.location}. ${incident.injured} casualties reported with ${incident.peopleAffected} persons exposed to hazard.`,
    disasterType: incident.disasterType,
    severity,
    riskFactors: [
      'Rapidly rising water table inundating residential ground levels',
      'Structural electrical hazard from submerged utility transformers',
      'Arterial road access constraints delaying conventional transit',
    ],
    peopleAtRisk: incident.peopleAffected,
    estimatedResourcesRequired: {
      ambulances,
      rescueTeams,
      fireUnits,
    },
    immediateActions: [
      'Isolate electric substation feeder lines in flood zone',
      'Deploy motorized inflatable boats and high-water rescue equipment',
      'Alert regional trauma facilities for inbound mass casualty intake',
    ],
    confidenceScore: 0.92,
    hazardObservations: [roadSummary, 'Submerged grade level with active rainfall runoff'],
    provider: 'FALLBACK_HEURISTIC',
  };
}

import { Incident } from '../services/dataStore';
import { geminiService } from '../services/geminiService';
import { IncidentAnalysisOutput, AgentExecutionEnvelope } from './incidentAnalysisAgent';
import { getRoadConditions, ToolCallRecord } from '../tools/emergencyTools';

// Input Schema
export interface RiskAssessmentInput {
  incident: Incident;
  analysis: IncidentAnalysisOutput;
}

// Output Schema
export interface RiskAssessmentOutput {
  incidentId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priorityScore: number; // 0 to 100
  riskFactors: string[];
  criticalZones: string[];
  recommendedResponseTime: string;
  reasoning: string;
  deterministicFormula: string;
  provider: 'GEMINI_LLM' | 'FALLBACK_HEURISTIC';
}

export function computeDeterministicPriorityScore(incident: Incident, severity: string): number {
  let baseScore = 30;
  if (severity === 'CRITICAL') baseScore = 65;
  else if (severity === 'HIGH') baseScore = 50;
  else if (severity === 'MEDIUM') baseScore = 35;

  const injuredImpact = Math.min(20, (incident.injured || 0) * 4);
  const missingImpact = Math.min(15, (incident.missing || 0) * 5);
  const affectedImpact = Math.min(10, Math.floor((incident.peopleAffected || 0) / 10));

  return Math.min(100, Math.max(10, baseScore + injuredImpact + missingImpact + affectedImpact));
}

export async function runRiskAssessmentAgent(
  input: RiskAssessmentInput
): Promise<AgentExecutionEnvelope<RiskAssessmentOutput>> {
  const startTime = new Date().toISOString();
  const startMs = Date.now();
  const toolsCalled: ToolCallRecord[] = [];
  const { incident, analysis } = input;

  // Validation
  if (!incident || !analysis) {
    throw new Error('RiskAssessmentAgent Error: Incident and Analysis results are required inputs.');
  }

  // Tool Call: getRoadConditions
  const roads = getRoadConditions({ area: incident.location });
  toolsCalled.push({
    toolName: 'getRoadConditions',
    params: { area: incident.location },
    resultSummary: `${roads.blockedRoads.length} active blockade(s) evaluated for risk escalation`,
    timestamp: new Date().toISOString(),
  });

  const deterministicScore = computeDeterministicPriorityScore(incident, analysis.severity);
  const deterministicFormula = `Base(${analysis.severity}) + Injured(${incident.injured || 0}*4) + Missing(${incident.missing || 0}*5) + Affected(${incident.peopleAffected || 0}/10) = ${deterministicScore}/100`;

  const recommendedResponseTime =
    deterministicScore >= 80
      ? '< 8 minutes (IMMEDIATE CODE RED)'
      : deterministicScore >= 60
      ? '< 15 minutes (URGENT CODE AMBER)'
      : '< 30 minutes (STANDARD)';

  let output: RiskAssessmentOutput;
  let status: 'completed' | 'warning' = 'completed';

  const prompt = `You are the Risk Assessment Agent for ResQAI Emergency Platform.
Evaluate threat escalation using verified incident inputs:
- Location: ${incident.location}
- Disaster Type: ${incident.disasterType}
- Severity from Analysis Agent: ${analysis.severity}
- Injured: ${incident.injured}, Missing: ${incident.missing}, Affected: ${incident.peopleAffected}
- Deterministic Priority Score: ${deterministicScore}/100
- Road Hazards Detected: ${roads.blockedRoads.map((r) => r.name).join(', ') || 'No complete blockades'}

Provide operational risk evaluation without inventing casualty numbers.
Return strict JSON:
{
  "riskFactors": ["factor 1", "factor 2", "factor 3"],
  "criticalZones": ["zone 1", "zone 2"],
  "reasoning": "Clinical and hazard justification for the assigned response time"
}`;

  if (geminiService.isAvailable()) {
    try {
      const llmResult = await geminiService.generateJSON<Partial<RiskAssessmentOutput>>(
        prompt,
        'Expert emergency risk evaluator. Return valid JSON only.'
      );

      output = {
        incidentId: incident.id,
        riskLevel: analysis.severity,
        priorityScore: deterministicScore,
        riskFactors: llmResult.riskFactors || [
          `Active casualty volume (${incident.injured} injured, ${incident.missing} missing)`,
          'Rapid floodwater surge threatening secondary residential sectors',
        ],
        criticalZones: llmResult.criticalZones || [
          `${incident.location} Ground Floor Residential Sectors`,
          'Adjacent Low-Lying Stormwater Drainage Catchment',
        ],
        recommendedResponseTime,
        reasoning: llmResult.reasoning || `Calculated deterministic priority score ${deterministicScore}/100 based on verified casualty volume. Immediate multi-unit dispatch required within ${recommendedResponseTime}.`,
        deterministicFormula,
        provider: 'GEMINI_LLM',
      };
    } catch (err) {
      console.warn('RiskAssessmentAgent LLM failed, using deterministic fallback logic', err);
      status = 'warning';
      output = getDeterministicRiskFallback(incident, analysis, deterministicScore, deterministicFormula, recommendedResponseTime);
    }
  } else {
    output = getDeterministicRiskFallback(incident, analysis, deterministicScore, deterministicFormula, recommendedResponseTime);
  }

  const endMs = Date.now();
  const decision = `Priority Score ${deterministicScore}/100 assigned (${output.riskLevel}). Mandatory response window: ${recommendedResponseTime}. Critical zones isolated.`;

  return {
    agentName: 'Risk Assessment Agent',
    agentRole: 'Threat Modeling & Escalation Scoring',
    status,
    startTime,
    endTime: new Date().toISOString(),
    durationMs: endMs - startMs,
    decision,
    toolsCalled,
    summary: `Risk evaluated at priority score ${deterministicScore}/100 (${output.riskLevel}). Response window designated at ${recommendedResponseTime}.`,
    result: output,
  };
}

function getDeterministicRiskFallback(
  incident: Incident,
  analysis: IncidentAnalysisOutput,
  deterministicScore: number,
  deterministicFormula: string,
  recommendedResponseTime: string
): RiskAssessmentOutput {
  return {
    incidentId: incident.id,
    riskLevel: analysis.severity,
    priorityScore: deterministicScore,
    riskFactors: [
      `High casualty escalation potential (${incident.injured} confirmed injured, ${incident.missing} missing)`,
      'Low-lying urban storm drainage bottleneck near primary access route',
      'Structural stability degradation from continuous flood inundation',
    ],
    criticalZones: [
      `${incident.location} Ground Floor Residential Blocks`,
      'Perimeter Stormwater Outfall Channel',
      'Access Road Intersection & Stalled Vehicle Cluster',
    ],
    recommendedResponseTime,
    reasoning: `Deterministic risk score calculated at ${deterministicScore}/100 utilizing formula ${deterministicFormula}. Immediate mobilization necessary before environmental conditions degrade.`,
    deterministicFormula,
    provider: 'FALLBACK_HEURISTIC',
  };
}

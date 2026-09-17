import React, { useState } from 'react';
import {
  Bot,
  Brain,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  Terminal,
} from 'lucide-react';

const AGENT_SPECIFICATIONS = [
  {
    id: 1,
    name: 'Incident Analysis Agent',
    role: 'Hazard & Ingestion Specialist',
    model: 'Gemini 3.8 Flash / Vision',
    inputSchema: 'Raw emergency alerts, citizen reports, hazard metrics, drone/phone imagery',
    outputSchema: 'Structured incident schema: disaster type, confirmed severity, casualty estimates, resource requirements',
    decisionLogic: 'Parses situational metrics and multimodal visual cues into verified disaster taxonomy.',
  },
  {
    id: 2,
    name: 'Risk Assessment Agent',
    role: 'Threat & Priority Modeler',
    model: 'Gemini 3.8 Flash + Deterministic Heuristics',
    inputSchema: 'Disaster severity, casualties, affected population, road blockades, nearby structural risks',
    outputSchema: 'Deterministic priority score (0-100), risk factors, critical perimeter zones, recommended response window',
    decisionLogic: 'Calculates non-hallucinatory score: Base(severity) + Injured*4 + Missing*5 + Population/10.',
  },
  {
    id: 3,
    name: 'Resource Allocation Agent',
    role: 'Fleet & Tactical Squad Matcher',
    model: 'Constraint Matching Engine',
    inputSchema: 'Available ambulances, medical tiers (ICU/ALS/BLS), rescue squads, equipment, real-time traffic',
    outputSchema: 'Selected resources, viability rankings, alternative units, composite match scoring breakdown',
    decisionLogic: 'Prioritizes medical capability over raw distance for critical trauma patients, factoring traffic penalties.',
  },
  {
    id: 4,
    name: 'Medical Coordination Agent',
    role: 'Clinical Triage & Bed Allocator',
    model: 'Hospital Capacity Engine',
    inputSchema: 'Injured casualty counts, trauma severity, hospital emergency/ICU bed vacancies, surgical specialties',
    outputSchema: 'Primary receiving hospital, reserved emergency/ICU bed count, designated backup facility, clinical rationale',
    decisionLogic: 'Matches patient severity to certified trauma center capability and reserves requisite life-support beds.',
  },
  {
    id: 5,
    name: 'Route Optimization Agent',
    role: 'Geospatial Navigator & Hazard Bypass',
    model: 'Dynamic Detour Pathfinding',
    inputSchema: 'Scene coordinates, vehicle locations, hospital/shelter destinations, active road blockages & flood levels',
    outputSchema: 'Green-light emergency routes, detour coordinates, estimated transit minutes, road clearance notes',
    decisionLogic: 'Detects submerged road segments and directs emergency responders via high-clearance bypass corridors.',
  },
  {
    id: 6,
    name: 'Shelter / Evacuation Agent',
    role: 'Civic Relief & Staging Coordinator',
    model: 'Capacity Constraint Engine',
    inputSchema: 'Population at risk, municipal shelter list, live occupancy, remaining vacancies, essential facilities',
    outputSchema: 'Evacuation necessity verdict, evacuee staging numbers, primary shelter, remaining safe capacity',
    decisionLogic: 'Guarantees civilian evacuation orders never exceed verified remaining physical capacity.',
  },
  {
    id: 7,
    name: 'Communication Agent',
    role: 'Multi-Channel Alert Dispatcher',
    model: 'Gemini 3.8 Flash',
    inputSchema: 'Coordinated incident state, hazard directions, designated shelter, destination hospital, routes',
    outputSchema: 'Citizen cell broadcast, Responder VHF tactical briefing, Hospital HL7 advisory, Executive SitRep',
    decisionLogic: 'Generates targeted broadcasts calibrated for tone, brevity, and operational urgency across 4 channels.',
  },
  {
    id: 8,
    name: 'Response Coordinator Agent',
    role: 'Unified Strategic Orchestrator (Lead Agent)',
    model: 'Gemini 3.8 Flash (Synthesis Engine)',
    inputSchema: 'Aggregated outputs from Agents 1 through 7',
    outputSchema: 'Unified Tactical Response Plan with sequenced action items, resource assignments, and Human-in-the-Loop flag',
    decisionLogic: 'Synthesizes all multi-agent outputs into an actionable tactical briefing requiring operator authorization.',
  },
];

export const AIAgentsPage: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState(AGENT_SPECIFICATIONS[0]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
          <Bot className="w-5 h-5 text-rose-500" />
          Autonomous Multi-Agent Coordination Architecture
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          8 specialized autonomous agents orchestrated sequentially with deterministic guardrails
        </p>
      </div>

      {/* Sequential Pipeline Flow Diagram */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
        <div className="text-xs font-mono font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-rose-400" />
          <span>Execution Pipeline Topology</span>
        </div>

        <div className="flex items-center gap-2 min-w-[900px]">
          {AGENT_SPECIFICATIONS.map((agent, i) => {
            const isSelected = selectedAgent.id === agent.id;
            return (
              <React.Fragment key={agent.id}>
                <button
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-2.5 rounded-lg border text-left transition-all shrink-0 w-36 ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/60'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span>STEP 0{agent.id}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate">{agent.name.replace(' Agent', '')}</div>
                  <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5">{agent.role.split(' ')[0]}</div>
                </button>

                {i < AGENT_SPECIFICATIONS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Agent Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Agent Deep Dive */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-mono font-bold">
                {selectedAgent.id}
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-mono">{selectedAgent.name}</h2>
                <p className="text-xs text-slate-400 font-mono">{selectedAgent.role}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-400" />
              {selectedAgent.model}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-mono font-bold text-rose-400 block mb-1">
                INPUT DATA CONTRACT:
              </span>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                {selectedAgent.inputSchema}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-mono font-bold text-emerald-400 block mb-1">
                OUTPUT REASONING SCHEMA:
              </span>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                {selectedAgent.outputSchema}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-mono font-bold text-sky-400 block mb-1">
                OPERATIONAL DECISION LOGIC:
              </span>
              <p className="text-slate-300 leading-relaxed">
                {selectedAgent.decisionLogic}
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Safety & Guardrails */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200 uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ResQAI Safety Guardrails</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="font-semibold text-emerald-300 block mb-0.5">Non-Hallucinatory Scoring</span>
              <p className="text-[11px] text-slate-400">Risk priority scores are strictly bounded by deterministic casualty and hazard coefficients.</p>
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="font-semibold text-emerald-300 block mb-0.5">Capacity Enforcement</span>
              <p className="text-[11px] text-slate-400">Evacuation agents cannot allocate more citizens than remaining shelter vacancy numbers.</p>
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="font-semibold text-emerald-300 block mb-0.5">Human-in-the-Loop Gate</span>
              <p className="text-[11px] text-slate-400">Real-world dispatches require human commander approval before status updates take effect.</p>
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="font-semibold text-emerald-300 block mb-0.5">Graceful Fallback</span>
              <p className="text-[11px] text-slate-400">If external LLM APIs face connectivity issues, heuristic algorithms ensure continuous dispatch execution.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

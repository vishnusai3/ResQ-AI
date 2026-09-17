import React from 'react';
import {
  Incident,
  UnifiedResponsePlan,
  AgentActivityStep,
} from '../types';
import {
  Sliders,
  Play,
  Zap,
  RotateCcw,
  Waves,
  Flame,
  Building,
  Truck,
  Wind,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Bot,
  Users,
} from 'lucide-react';

interface SimulationPageProps {
  currentIncident?: Incident | null;
  activePlan?: UnifiedResponsePlan | null;
  timeline?: AgentActivityStep[];
  onStartScenario: (scenario: string) => Promise<void>;
  onTriggerWorse: () => Promise<void>;
  onResetSimulation: () => Promise<void>;
  isProcessing?: boolean;
}

export const SimulationPage: React.FC<SimulationPageProps> = ({
  currentIncident,
  activePlan,
  timeline = [],
  onStartScenario,
  onTriggerWorse,
  onResetSimulation,
  isProcessing = false,
}) => {
  const scenarios = [
    {
      id: 'flood',
      title: 'MAJOR FLOOD',
      icon: Waves,
      description: '115mm flash cloudburst in Kukatpally cutting off NH-65 arterial corridor and low-lying residential sectors.',
      expectedPopulation: '100 people',
      severity: 'CRITICAL',
    },
    {
      id: 'fire',
      title: 'BUILDING FIRE',
      icon: Flame,
      description: 'Multi-story commercial office blaze in Begumpet with trapped personnel and toxic smoke plumes.',
      expectedPopulation: '65 people',
      severity: 'CRITICAL',
    },
    {
      id: 'earthquake',
      title: 'EARTHQUAKE',
      icon: Building,
      description: 'Structural masonry facade collapse near transit interchange resulting in multiple trapped casualties.',
      expectedPopulation: '150 people',
      severity: 'CRITICAL',
    },
    {
      id: 'accident',
      title: 'MULTI-VEHICLE ACCIDENT',
      icon: Truck,
      description: 'Expressway bus & fuel tanker collision during heavy squall requiring immediate extraction and hazardous containment.',
      expectedPopulation: '40 people',
      severity: 'HIGH',
    },
    {
      id: 'cyclone',
      title: 'CYCLONE',
      icon: Wind,
      description: 'Gale force coastal surge bringing down electrical infrastructure and causing flash inundations.',
      expectedPopulation: '220 people',
      severity: 'CRITICAL',
    },
  ];

  const completedAgentsCount = timeline.filter((t) => t.status === 'completed').length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1680px] mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-lg font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-500" />
            DISASTER SIMULATION
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Execute pre-configured disaster drills and inject live cascade failures
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetSimulation}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET SIMULATION</span>
          </button>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          return (
            <div
              key={sc.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      sc.severity === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {sc.severity}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white font-mono tracking-wide">
                  {sc.title}
                </h3>

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed mt-1.5">
                  {sc.description}
                </p>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Expected:</span>
                  <span className="text-slate-200 font-bold">{sc.expectedPopulation}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStartScenario(sc.id)}
                disabled={isProcessing}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm shadow-rose-950 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RUN SIMULATION</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* LIVE SIMULATION STATE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              LIVE SIMULATION STATE
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {isProcessing ? 'Processing Active Simulation...' : 'Ready for Escalation Injection'}
          </span>
        </div>

        {/* 4 Telemetry Blocks: Current Incident | Agent Status | Resource Changes | Route Changes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Current Incident */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
              Current Incident
            </span>
            {currentIncident ? (
              <div>
                <p className="font-bold text-white font-mono">{currentIncident.id}: {currentIncident.disasterType}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentIncident.locationName || currentIncident.location}</p>
                <span className="text-[10px] font-mono text-rose-400 mt-1 inline-block">
                  Severity: {currentIncident.severity}
                </span>
              </div>
            ) : (
              <p className="text-slate-500 font-mono text-[11px]">No active scenario running</p>
            )}
          </div>

          {/* 2. Agent Status */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
              Agent Status
            </span>
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300">Pipeline Execution:</span>
                <span className="text-emerald-400 font-bold">{completedAgentsCount} / 8 Completed</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {timeline.length > 0 ? 'All 8 specialized autonomous agents orchestrated.' : 'Standby'}
              </p>
            </div>
          </div>

          {/* 3. Resource Changes */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
              Resource Changes
            </span>
            {activePlan?.ambulanceAssignments && activePlan.ambulanceAssignments.length > 0 ? (
              <div className="space-y-0.5 text-[11px] text-slate-300 font-mono">
                <div className="text-emerald-400">
                  {activePlan.ambulanceAssignments.length} Ambulance(s) Dispatched
                </div>
                <div className="text-slate-400">
                  Dest: {activePlan.ambulanceAssignments[0].destinationHospital}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 font-mono text-[11px]">No resource reallocation</p>
            )}
          </div>

          {/* 4. Route Changes */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
              Route Changes
            </span>
            {activePlan?.ambulanceAssignments?.some((a) => a.routeDetour) ? (
              <div className="text-[11px] font-mono text-amber-400 space-y-0.5">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  DETOUR ACTIVE
                </div>
                <div className="text-slate-400">Rerouting past blocked NH-65 corridor</div>
              </div>
            ) : (
              <p className="text-slate-400 font-mono text-[11px]">Primary direct corridors open</p>
            )}
          </div>
        </div>

        {/* PROMINENT ACTION BUTTONS */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            id="btn-reset-sim"
            onClick={onResetSimulation}
            disabled={isProcessing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>↻ RESET SIMULATION</span>
          </button>

          <button
            type="button"
            id="btn-trigger-worse-sim"
            onClick={onTriggerWorse}
            disabled={isProcessing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-lg shadow-amber-950 transition-colors cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>⚠ MAKE SITUATION WORSE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

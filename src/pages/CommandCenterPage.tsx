import React from 'react';
import {
  Incident,
  Ambulance,
  Hospital,
  RescueTeam,
  Shelter,
  Road,
  AgentActivityStep,
  UnifiedResponsePlan,
  Coordinates,
} from '../types';
import { LiveMap } from '../components/LiveMap';
import { AIAgentActivityPanel } from '../components/AIAgentActivityPanel';
import { ResponsePlanCard } from '../components/ResponsePlanCard';
import { LiveDemoController } from '../components/LiveDemoController';
import {
  AlertTriangle,
  Flame,
  Waves,
  Building,
  Truck,
  Wind,
  PlusCircle,
  MapPin,
  Users,
  Activity,
  HelpCircle,
  Clock,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

interface CommandCenterPageProps {
  incidents: Incident[];
  ambulances: Ambulance[];
  hospitals: Hospital[];
  rescueTeams: RescueTeam[];
  shelters: Shelter[];
  roads: Road[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  timeline: AgentActivityStep[];
  activePlan: UnifiedResponsePlan | null;
  onApprovePlan: (incidentId: string, comments?: string) => Promise<void>;
  onModifyPlan: (incidentId: string) => void;
  onRejectPlan: (incidentId: string, reason?: string) => Promise<void>;
  onSelectCoordinates: (coords: Coordinates) => void;
  onTriggerIncidentWorkflow: (incidentId: string) => void;
  onOpenCreateIncident?: () => void;
  isExecutingWorkflow?: boolean;
  providerNote?: string;
  isLiveDemoOpen?: boolean;
  demoStep?: number;
  onSetDemoStep?: (step: number) => void;
  isReplanning?: boolean;
  worseDisruptionOccurred?: boolean;
  replannedPlan?: UnifiedResponsePlan | null;
  onLiveDemoApprove?: () => Promise<void>;
  onLiveDemoMakeWorse?: () => Promise<void>;
  onLiveDemoReset?: () => Promise<void>;
  onCloseLiveDemo?: () => void;
}

export const CommandCenterPage: React.FC<CommandCenterPageProps> = ({
  incidents,
  ambulances,
  hospitals,
  rescueTeams,
  shelters,
  roads,
  selectedIncident,
  onSelectIncident,
  timeline,
  activePlan,
  onApprovePlan,
  onModifyPlan,
  onRejectPlan,
  onSelectCoordinates,
  onTriggerIncidentWorkflow,
  onOpenCreateIncident,
  isExecutingWorkflow,
  providerNote,
  isLiveDemoOpen = false,
  demoStep = 1,
  onSetDemoStep = () => {},
  isReplanning = false,
  worseDisruptionOccurred = false,
  replannedPlan = null,
  onLiveDemoApprove = async () => {},
  onLiveDemoMakeWorse = async () => {},
  onLiveDemoReset = async () => {},
  onCloseLiveDemo = () => {},
}) => {
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const availableAmbulances = ambulances.filter((a) => a.status === 'AVAILABLE');

  const highlightedAmbulanceId =
    isLiveDemoOpen && (demoStep === 4 || demoStep === 8 || demoStep === 11)
      ? activePlan?.ambulanceAssignments?.[0]?.ambulanceId
      : undefined;

  const highlightedHospitalId =
    isLiveDemoOpen && (demoStep === 6 || demoStep === 8 || demoStep === 11)
      ? activePlan?.hospitalAssignments?.[0]?.hospitalId
      : undefined;

  const highlightedShelterId =
    isLiveDemoOpen && (demoStep === 7 || demoStep === 8 || demoStep === 11)
      ? activePlan?.evacuationPlan?.[0]?.shelterId
      : undefined;

  const getDisasterIcon = (type: string) => {
    switch (type) {
      case 'FLOOD':
        return <Waves className="w-4 h-4 text-sky-400" />;
      case 'FIRE':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'EARTHQUAKE':
        return <Building className="w-4 h-4 text-orange-400" />;
      case 'ACCIDENT':
        return <Truck className="w-4 h-4 text-purple-400" />;
      case 'CYCLONE':
        return <Wind className="w-4 h-4 text-teal-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-950 text-yellow-400 border border-yellow-800">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1680px] mx-auto">
      {/* 3-Minute Live Demo Controller Bar (when active) */}
      {isLiveDemoOpen && (
        <LiveDemoController
          currentStep={demoStep}
          onSetStep={onSetDemoStep}
          incident={selectedIncident}
          plan={activePlan}
          timeline={timeline}
          ambulances={ambulances}
          hospitals={hospitals}
          rescueTeams={rescueTeams}
          shelters={shelters}
          roads={roads}
          isReplanning={isReplanning}
          isApproved={activePlan?.approvalStatus === 'APPROVED'}
          onApprove={onLiveDemoApprove}
          onMakeWorse={onLiveDemoMakeWorse}
          onReset={onLiveDemoReset}
          onClose={onCloseLiveDemo}
          replannedPlan={replannedPlan}
          worseDisruptionOccurred={worseDisruptionOccurred}
        />
      )}

      {/* Top of the Command Center: Compact Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-white text-base tracking-wider">
              RESQ<span className="text-rose-500">AI</span>
            </span>
            <span className="text-slate-500 font-mono text-xs">|</span>
            <span className="text-xs text-slate-300 font-mono font-medium">COMMAND CENTER</span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>SYSTEM STATUS: OPERATIONAL</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-400">Active Incidents:</span>
            <span className="font-bold text-rose-400">{activeIncidents.length}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-400">Available Ambulances:</span>
            <span className="font-bold text-emerald-400">{availableAmbulances.length}</span>
          </div>
        </div>
      </div>

      {/* THREE MAIN COLUMNS: Left (Active Incident) | Center (Live Map) | Right (AI Response) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT PANEL: ACTIVE INCIDENT (3 cols) */}
        <div className="lg:col-span-3 flex flex-col space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                  ACTIVE INCIDENT
                </h3>
                {selectedIncident && getSeverityBadge(selectedIncident.severity)}
              </div>

              {/* Active Incident Selector / Dropdown if multiple exist */}
              {incidents.length > 1 && (
                <div className="mt-3">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    Switch Incident
                  </label>
                  <div className="relative">
                    <select
                      value={selectedIncident?.id || ''}
                      onChange={(e) => {
                        const target = incidents.find((i) => i.id === e.target.value);
                        if (target) onSelectIncident(target);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 appearance-none pr-8 cursor-pointer"
                    >
                      {incidents.map((inc) => (
                        <option key={inc.id} value={inc.id}>
                          {inc.id}: {inc.locationName || inc.location} ({inc.disasterType})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Incident Details Card */}
              {selectedIncident ? (
                <div className="mt-3.5 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                      {getDisasterIcon(selectedIncident.disasterType)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white font-mono">
                          {selectedIncident.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {selectedIncident.disasterType}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                        {selectedIncident.locationName || selectedIncident.location}
                      </p>
                    </div>
                  </div>

                  {/* Incident Description */}
                  {selectedIncident.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800/80">
                      {selectedIncident.description}
                    </p>
                  )}

                  {/* Metrics: People Affected, Injured, Missing */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">
                        Affected
                      </span>
                      <span className="text-sm font-bold font-mono text-white">
                        {selectedIncident.peopleAffected ?? 0}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">
                        Injured
                      </span>
                      <span className="text-sm font-bold font-mono text-rose-400">
                        {selectedIncident.injured ?? 0}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">
                        Missing
                      </span>
                      <span className="text-sm font-bold font-mono text-amber-400">
                        {selectedIncident.missing ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Status & Time */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Status:</span>
                    <span
                      className={`font-bold ${
                        selectedIncident.status === 'ACTIVE'
                          ? 'text-rose-400'
                          : selectedIncident.status === 'RESPONDING'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {selectedIncident.status}
                    </span>
                  </div>

                  {selectedIncident.createdAt && (
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Reported:</span>
                      <span>{new Date(selectedIncident.createdAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="my-6 text-center text-slate-400 text-xs space-y-1">
                  <p className="font-semibold text-slate-300">No Incident Selected</p>
                  <p className="text-[11px] text-slate-500">
                    Select an incident or create a new emergency.
                  </p>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <div className="mt-5 pt-3 border-t border-slate-800">
              <button
                type="button"
                id="btn-create-emergency-left"
                onClick={onOpenCreateIncident}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-md shadow-rose-950 border border-rose-500/60 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>CREATE EMERGENCY</span>
              </button>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: LIVE MAP (6 cols - largest portion) */}
        <div className="lg:col-span-6 flex flex-col space-y-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl relative">
            <LiveMap
              incidents={incidents}
              ambulances={ambulances}
              hospitals={hospitals}
              rescueTeams={rescueTeams}
              shelters={shelters}
              roads={roads}
              selectedIncident={selectedIncident}
              onSelectIncident={onSelectIncident}
              onSelectCoordinates={onSelectCoordinates}
              enablePickLocation={true}
              highlightedAmbulanceId={highlightedAmbulanceId}
              highlightedHospitalId={highlightedHospitalId}
              highlightedShelterId={highlightedShelterId}
              heightClass="h-[480px] lg:h-[530px]"
            />

            {/* Small Map Legend in bottom corner */}
            <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-300 flex items-center gap-3 z-[1000] shadow-md pointer-events-none">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Incident
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> Ambulance
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Rescue
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span> Hospital
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span> Shelter
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AI RESPONSE (3 cols) */}
        <div className="lg:col-span-3 flex flex-col space-y-3">
          <div className="h-[480px] lg:h-[530px]">
            <AIAgentActivityPanel
              timeline={timeline}
              isExecuting={isExecutingWorkflow}
              providerNote={providerNote}
              onReplayWorkflow={
                selectedIncident
                  ? () => onTriggerIncidentWorkflow(selectedIncident.id)
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      {/* BELOW THE THREE COLUMNS: ONE RESPONSE-PLAN PANEL */}
      <div>
        <ResponsePlanCard
          plan={activePlan}
          onApprove={onApprovePlan}
          onModify={onModifyPlan}
          onReject={onRejectPlan}
          isProcessing={isExecutingWorkflow}
        />
      </div>
    </div>
  );
};

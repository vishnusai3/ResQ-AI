import React, { useState, useEffect, useRef } from 'react';
import {
  Incident,
  UnifiedResponsePlan,
  AgentActivityStep,
  Ambulance,
  Hospital,
  RescueTeam,
  Shelter,
  Road,
} from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Bot,
  Ambulance as AmbulanceIcon,
  Flame,
  Building2,
  Home,
  MapPin,
  Route,
  Zap,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  UserCheck,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';

export interface LiveDemoControllerProps {
  currentStep: number;
  onSetStep: (step: number) => void;
  incident: Incident | null;
  plan: UnifiedResponsePlan | null;
  timeline: AgentActivityStep[];
  ambulances: Ambulance[];
  hospitals: Hospital[];
  rescueTeams: RescueTeam[];
  shelters: Shelter[];
  roads: Road[];
  isReplanning: boolean;
  isApproved: boolean;
  onApprove: () => Promise<void>;
  onMakeWorse: () => Promise<void>;
  onReset: () => Promise<void>;
  onClose: () => void;
  replannedPlan: UnifiedResponsePlan | null;
  worseDisruptionOccurred: boolean;
}

const STEP_LABELS = [
  '1. Disaster Detected',
  '2. 8 Agents Activated',
  '3. Severity Critical',
  '4. Resource Allocation',
  '5. Rescue Team',
  '6. Hospital Selection',
  '7. Evacuation Shelter',
  '8. Tactical Routes',
  '9. AI Response Plan',
  '10. Human Approval',
  '11. Plan Activated',
  '12. Dynamic Replanning',
];

export const LiveDemoController: React.FC<LiveDemoControllerProps> = ({
  currentStep,
  onSetStep,
  incident,
  plan,
  timeline,
  ambulances,
  hospitals,
  rescueTeams,
  shelters,
  roads,
  isReplanning,
  isApproved,
  onApprove,
  onMakeWorse,
  onReset,
  onClose,
  replannedPlan,
  worseDisruptionOccurred,
}) => {
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(4);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop autoplay if at human approval (step 10) or wait at step 12
  useEffect(() => {
    if (currentStep === 10 || currentStep === 12) {
      setIsAutoPlaying(false);
    }
  }, [currentStep]);

  // Autoplay progression timer
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    setSecondsRemaining(4);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Advance step
          if (currentStep < 10) {
            onSetStep(currentStep + 1);
          } else if (currentStep === 11) {
            onSetStep(12);
          } else {
            setIsAutoPlaying(false);
          }
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    autoPlayTimerRef.current = interval;
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentStep, onSetStep]);

  // Extract relevant live data
  const selectedAmbulance =
    ambulances.find((a) => a.id === plan?.ambulanceAssignments?.[0]?.ambulanceId) ||
    ambulances.find((a) => a.callSign.includes('Alpha')) ||
    ambulances[0];

  const selectedRescue =
    rescueTeams.find((r) => r.id === plan?.rescueAssignments?.[0]?.teamId) ||
    rescueTeams.find((r) => r.name.includes('NDRF')) ||
    rescueTeams[0];

  const selectedHospital =
    hospitals.find((h) => h.id === plan?.hospitalAssignments?.[0]?.hospitalId) ||
    hospitals.find((h) => h.name.includes('Continental')) ||
    hospitals[0];

  const selectedShelter =
    shelters.find((s) => s.id === plan?.evacuationPlan?.[0]?.shelterId) ||
    shelters.find((s) => s.name.includes('Kukatpally')) ||
    shelters[0];

  return (
    <div
      id="live-demo-banner"
      className="bg-slate-900 border-2 border-rose-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-md"
    >
      {/* Top Header Bar: Title, Step Counter, Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-600/30 border border-rose-500 text-rose-300 font-mono font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>LIVE DEMO MODE</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Step <b className="text-white font-bold">{currentStep}</b> of 12:
            <span className="text-rose-400 ml-1 font-semibold">{STEP_LABELS[currentStep - 1]}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Play / Pause Autopilot */}
          <button
            id="btn-demo-autoplay"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
              isAutoPlaying
                ? 'bg-amber-950/70 border border-amber-500/50 text-amber-300'
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isAutoPlaying ? 'Pause guided walkthrough' : 'Resume auto-progression'}
          >
            {isAutoPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Auto ({secondsRemaining}s)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Auto Play</span>
              </>
            )}
          </button>

          {/* Prev / Next Step Buttons */}
          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5">
            <button
              onClick={() => onSetStep(Math.max(1, currentStep - 1))}
              disabled={currentStep <= 1}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSetStep(Math.min(12, currentStep + 1))}
              disabled={currentStep >= 12}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              title="Next Step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Demo Button */}
          <button
            id="btn-demo-reset"
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title="Reset entire demonstration to baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Close Demo */}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="Exit Live Demo Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step Progress Dots / Indicators */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 my-3">
        {STEP_LABELS.map((label, index) => {
          const stepNum = index + 1;
          const isActive = currentStep === stepNum;
          const isPassed = currentStep > stepNum;

          return (
            <button
              key={index}
              onClick={() => onSetStep(stepNum)}
              className={`h-2 rounded-full transition-all duration-300 relative group ${
                isActive
                  ? 'bg-rose-500 ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900'
                  : isPassed
                  ? 'bg-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
              title={label}
            />
          );
        })}
      </div>

      {/* DYNAMIC CONTENT FOR EACH STEP */}
      <div className="mt-2">
        {/* STEP 1: DISASTER DETECTED */}
        {currentStep === 1 && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/60 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-rose-400 font-mono font-black text-sm tracking-wider">
                  <span className="text-xl">🚨</span>
                  <span>DISASTER DETECTED</span>
                </div>
                <div className="mt-2 text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                  <span>Flood</span>
                  <span className="text-slate-400 font-normal text-sm">at</span>
                  <span className="text-rose-300 underline decoration-rose-500 underline-offset-4">
                    Kukatpally Y-Junction
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-mono">
                  <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    👥 <b className="text-white">100</b> people affected
                  </div>
                  <div className="px-2.5 py-1 rounded bg-rose-900/60 border border-rose-700 text-rose-200">
                    🩹 <b className="text-rose-300">5</b> injured
                  </div>
                  <div className="px-2.5 py-1 rounded bg-amber-900/60 border border-amber-700 text-amber-200">
                    ❓ <b className="text-amber-300">3</b> missing
                  </div>
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-right font-mono text-xs">
                <span className="text-slate-400 block text-[10px] uppercase">Incident Location Pin</span>
                <span className="text-emerald-400 font-bold">17.4947° N, 78.3996° E</span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Incident appearing on live map below ↓
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ACTIVATE 8 INDEPENDENT AGENTS */}
        {currentStep === 2 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sky-400 font-mono font-bold text-xs uppercase tracking-wider">
                <Bot className="w-4 h-4 text-sky-400" />
                <span>STEP 2: Activating 8 Specialized Autonomous Agents</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 animate-pulse">
                Parallel Execution & Live Tool Calling...
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Incident Analysis Agent', color: 'border-rose-500/40 text-rose-300' },
                { name: 'Risk Assessment Agent', color: 'border-amber-500/40 text-amber-300' },
                { name: 'Resource Allocation Agent', color: 'border-emerald-500/40 text-emerald-300' },
                { name: 'Medical Coordination Agent', color: 'border-sky-500/40 text-sky-300' },
                { name: 'Route Optimization Agent', color: 'border-teal-500/40 text-teal-300' },
                { name: 'Shelter Agent', color: 'border-purple-500/40 text-purple-300' },
                { name: 'Communication Agent', color: 'border-indigo-500/40 text-indigo-300' },
                { name: 'Response Coordinator', color: 'border-rose-400 text-rose-200 bg-rose-950/40' },
              ].map((agent, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg bg-slate-900 border text-xs font-mono font-semibold flex items-center gap-2 ${agent.color}`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="truncate">{agent.name}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-2 text-center">
              Agent execution and tool invocations animated in the Agent Activity panel.
            </p>
          </div>
        )}

        {/* STEP 3: SEVERITY CRITICAL */}
        {currentStep === 3 && (
          <div className="p-4 rounded-xl bg-rose-950/60 border-2 border-rose-500 animate-fadeIn flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-mono font-black text-xl shadow-lg shadow-rose-950">
                !
              </div>
              <div>
                <span className="text-[10px] font-mono text-rose-300 uppercase tracking-widest block font-bold">
                  TRIAGE ASSESSMENT
                </span>
                <div className="text-2xl font-black font-mono text-white flex items-center gap-3">
                  <span>Severity:</span>
                  <span className="px-3 py-0.5 rounded-lg bg-rose-600 text-white shadow-md animate-pulse">
                    CRITICAL
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
              <div className="p-2 rounded bg-slate-950 border border-rose-900">
                <span className="text-slate-400 block text-[10px]">Priority Score</span>
                <b className="text-rose-400 text-base">96 / 100</b>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-rose-900">
                <span className="text-slate-400 block text-[10px]">Water Level</span>
                <b className="text-rose-300 text-base">4.8 ft</b>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-rose-900">
                <span className="text-slate-400 block text-[10px]">Action SLA</span>
                <b className="text-white text-base">&lt; 5 mins</b>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: RESOURCE ALLOCATION (AMBULANCE) */}
        {currentStep === 4 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/60 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase tracking-wider">
                <AmbulanceIcon className="w-4 h-4" />
                <span>STEP 4: Resource Allocation — Available Ambulance Selected</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Verified via findAvailableAmbulances() tool
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Selected Unit</span>
                <b className="text-white text-sm">{selectedAmbulance.callSign}</b>
                <span className="text-[10px] text-slate-400 block font-normal">ID: {selectedAmbulance.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Distance & ETA</span>
                <b className="text-emerald-400">2.3 km</b>
                <span className="text-[10px] text-slate-400 block">ETA ~4 mins</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Capability & Traffic</span>
                <b className="text-sky-300">{selectedAmbulance.medicalCapability}</b>
                <span className="text-[10px] text-amber-400 block">Traffic: MEDIUM</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Reason for Selection</span>
                <span className="text-slate-300 text-[11px] leading-snug block">
                  Vital ICU/ALS capability for airway and critical shock stabilization at disaster point.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SELECT RESCUE TEAM */}
        {currentStep === 5 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/60 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs uppercase tracking-wider">
                <Flame className="w-4 h-4" />
                <span>STEP 5: Tactical Rescue Team Selected</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Verified via findAvailableRescueTeams() tool
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Squad</span>
                <b className="text-white text-sm">{selectedRescue.name}</b>
                <span className="text-[10px] text-slate-400 block font-normal">{selectedRescue.capability}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Distance</span>
                <b className="text-amber-400">3.1 km</b>
                <span className="text-[10px] text-slate-400 block">From Balanagar Base</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Equipment</span>
                <b className="text-slate-200">Motorized Boats & Pumps</b>
                <span className="text-[10px] text-emerald-400 block">{selectedRescue.personnelCount} Tactical Personnel</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Reason for Selection</span>
                <span className="text-slate-300 text-[11px] leading-snug block">
                  High-clearance flood extraction squad positioned for immediate water entry and civilian dewatering.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SELECT HOSPITAL */}
        {currentStep === 6 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/60 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sky-400 font-mono font-bold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                <span>STEP 6: Receiving Hospital Selected</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                Verified via findSuitableHospitals() tool
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Designated Facility</span>
                <b className="text-white text-sm">{selectedHospital.name}</b>
                <span className="text-[10px] text-slate-400 block">{selectedHospital.location}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Patient Needs</span>
                <b className="text-rose-400">5 Injured (Trauma & Respiratory)</b>
                <span className="text-[10px] text-slate-400 block">Requires ICU + ER Bays</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">ICU & ER Capacity</span>
                <b className="text-sky-300">{selectedHospital.icuBedsAvailable} ICU Beds Available</b>
                <span className="text-[10px] text-emerald-400 block">
                  {selectedHospital.emergencyBedsAvailable} Emergency Trauma Bays
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Distance & Route</span>
                <b className="text-white">10.2 km</b>
                <span className="text-[10px] text-emerald-400 block">High-speed corridor</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: SELECT EVACUATION SHELTER */}
        {currentStep === 7 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/60 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-xs uppercase tracking-wider">
                <Home className="w-4 h-4" />
                <span>STEP 7: Evacuation Shelter Selected</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                Verified via findAvailableShelters() tool
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Designated Shelter</span>
                <b className="text-white text-sm">{selectedShelter.name}</b>
                <span className="text-[10px] text-slate-400 block">{selectedShelter.location}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Capacity</span>
                <b className="text-purple-300">{selectedShelter.totalCapacity} Total Capacity</b>
                <span className="text-[10px] text-slate-400 block">Staging 100 displaced citizens</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Distance</span>
                <b className="text-emerald-400">1.09 km</b>
                <span className="text-[10px] text-slate-400 block">Nearest safe municipal elevation</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Availability</span>
                <b className="text-emerald-300">{selectedShelter.remainingCapacity} Beds Available</b>
                <span className="text-[10px] text-slate-400 block">Status: OPEN & Ready</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: DISPLAY ROUTES ON THE MAP */}
        {currentStep === 8 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-teal-500/60 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-teal-400 font-mono font-bold text-xs uppercase tracking-wider">
                <Route className="w-4 h-4" />
                <span>STEP 8: Tactical Routing Generated & Displayed on Map</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                Verified via checkRoadStatuses() tool
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-2.5 rounded bg-slate-900 border border-emerald-800/50">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Ambulance Route (Green)</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Bypass route around submerged KPHB corridor directly to disaster point.
                </p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-rose-800/50">
                <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Casualty Transport (Red)</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Priority green-wave corridor from Kukatpally to Continental Hospitals.
                </p>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-purple-800/50">
                <div className="flex items-center gap-2 text-purple-400 font-bold mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>Evacuation Corridor (Purple)</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Safe pedestrian and transit channel to Kukatpally Indoor Sports Complex.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 9: SHOW AI RESPONSE PLAN */}
        {currentStep === 9 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/60 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>STEP 9: AI Response Plan Generated</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Synthesized by Response Coordinator Agent
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 font-mono text-xs">
              {[
                { num: 1, title: 'Dispatch ambulance', desc: selectedAmbulance.callSign + ' (ICU Life Support)' },
                { num: 2, title: 'Dispatch rescue team', desc: selectedRescue.name + ' (Flood Extraction)' },
                { num: 3, title: 'Route injured people to hospital', desc: selectedHospital.name + ' (ER & ICU bays reserved)' },
                { num: 4, title: 'Evacuate civilians', desc: selectedShelter.name + ' (100 evacuees staged)' },
                { num: 5, title: 'Block unsafe road', desc: 'KPHB Main Road cordoned due to flash flood' },
                { num: 6, title: 'Send citizen alert', desc: 'CAP cell broadcast & radio advisory dispatched' },
              ].map((item) => (
                <div key={item.num} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded bg-rose-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    {item.num}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-xs">{item.title}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 10: HUMAN APPROVAL REQUIRED */}
        {currentStep === 10 && (
          <div className="p-5 rounded-xl bg-amber-950/40 border-2 border-amber-500/80 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-amber-300 font-mono uppercase tracking-wider">
                    STEP 10: Human approval required
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    ResQAI enforces strict Human-in-the-Loop oversight. Command operator authorization is required before unit dispatch.
                  </p>
                </div>
              </div>

              <button
                id="btn-live-approve"
                onClick={async () => {
                  await onApprove();
                  onSetStep(11);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-mono font-bold text-sm tracking-wide shadow-xl shadow-emerald-950 border border-emerald-400 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>APPROVE RESPONSE</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 11: RESPONSE PLAN ACTIVATED */}
        {currentStep === 11 && (
          <div className="p-5 rounded-xl bg-emerald-950/50 border-2 border-emerald-500 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-black text-base sm:text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>✓ RESPONSE PLAN ACTIVATED</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-emerald-800 text-slate-300">
                    <span className="text-[10px] text-slate-500 block">Resource Status</span>
                    <b className="text-emerald-400">AMB & NDRF DISPATCHED</b>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-emerald-800 text-slate-300">
                    <span className="text-[10px] text-slate-500 block">Map Updated</span>
                    <b className="text-white">Active Convoys Live</b>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-emerald-800 text-slate-300">
                    <span className="text-[10px] text-slate-500 block">Hospital Capacity</span>
                    <b className="text-sky-300">Beds Reserved</b>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-emerald-800 text-slate-300">
                    <span className="text-[10px] text-slate-500 block">Shelter Occupancy</span>
                    <b className="text-purple-300">+100 Displaced Staged</b>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-emerald-800 text-slate-300">
                    <span className="text-[10px] text-slate-500 block">Incident Status</span>
                    <b className="text-emerald-300">RESOURCES DISPATCHED</b>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSetStep(12)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <span>Proceed to Failure Injection</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 12: DYNAMIC REPLANNING (MAKE SITUATION WORSE) */}
        {currentStep === 12 && (
          <div className="p-5 rounded-xl bg-slate-950 border-2 border-amber-500/80 animate-fadeIn space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
                  STEP 12: DYNAMIC MULTI-AGENT COORDINATION UNDER SYSTEM FAILURE
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
                  Simulate Real-Time Disaster Deterioration & AI Replanning
                </h4>
              </div>

              {!worseDisruptionOccurred && !isReplanning && (
                <button
                  id="btn-live-make-worse"
                  onClick={async () => {
                    await onMakeWorse();
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-mono font-bold text-sm tracking-wide shadow-xl shadow-rose-950 border border-rose-400 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-300" />
                  <span>⚠ MAKE SITUATION WORSE</span>
                </button>
              )}
            </div>

            {/* Failure Invalidation Notice */}
            {worseDisruptionOccurred && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 font-mono font-bold text-sm">
                    <AlertOctagon className="w-5 h-5 text-rose-400 animate-pulse" />
                    <span>⚠ RESPONSE PLAN INVALIDATED</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    Ambulance failed • Road blocked • Hospital lost ICU capacity
                  </div>
                </div>

                {isReplanning ? (
                  <div className="p-4 rounded-lg bg-slate-900 border border-amber-500/60 flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-mono font-bold text-amber-300">
                      🧠 AI REPLANNING... Agents executing again...
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-500 animate-fadeIn space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>✓ NEW RESPONSE PLAN GENERATED</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Multi-Agent Coordination Succeeded
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs pt-1">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">New Ambulance</span>
                        <b className="text-emerald-400">AMB-110 / Reserve ALS</b>
                        <span className="text-[10px] text-slate-400 block">Replaced disabled unit</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Alternate Hospital</span>
                        <b className="text-sky-300">Yashoda Hospitals</b>
                        <span className="text-[10px] text-slate-400 block">Open ICU bays verified</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Detour Route</span>
                        <b className="text-amber-400">Bypassed Flooded Road</b>
                        <span className="text-[10px] text-slate-400 block">Green corridor restored</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-emerald-900/60 text-xs font-mono">
                      <span className="text-slate-300">
                        🎉 Demonstration complete! Dynamic resilience verified across all 8 agents.
                      </span>
                      <button
                        onClick={onReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                        <span>RESET FOR NEXT DEMO</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Ambulance,
  Flame,
  Bell,
  Play,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  PlusCircle,
} from 'lucide-react';
import { Alert } from '../types';

interface TopNavProps {
  activeIncidentsCount: number;
  availableAmbulancesCount: number;
  availableRescueTeamsCount: number;
  availableIcuBedsCount: number;
  alerts: Alert[];
  onOpenCreateIncident: () => void;
  onRunDemo: () => void;
  onMakeSituationWorse: () => void;
  onResetSimulation: () => void;
  isDemoRunning?: boolean;
  aiProviderName?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeIncidentsCount,
  availableAmbulancesCount,
  availableRescueTeamsCount,
  availableIcuBedsCount,
  alerts,
  onOpenCreateIncident,
  onRunDemo,
  onMakeSituationWorse,
  onResetSimulation,
  isDemoRunning = false,
  aiProviderName = 'Gemini 3.8 Flash (Active)',
}) => {
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const criticalCount = alerts.filter((a) => a.type === 'CRITICAL').length;

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & System Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-900/40 text-white font-black text-lg tracking-wider">
            RQ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base lg:text-lg text-white font-mono">
                RESQ<span className="text-rose-500">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AI-Powered Disaster Response Coordination
            </p>
          </div>
        </div>

        {/* Operational Status Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>SYSTEM OPERATIONAL</span>
          <span className="text-[10px] text-slate-400 border-l border-emerald-500/30 pl-2">
            {aiProviderName}
          </span>
        </div>
      </div>

      {/* Live Operational Metric Pills */}
      <div className="hidden md:flex items-center gap-2 lg:gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-xs">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-slate-400">Incidents:</span>
          <span className="font-mono font-bold text-rose-400">{activeIncidentsCount}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-xs">
          <Ambulance className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-slate-400">Ambulances:</span>
          <span className="font-mono font-bold text-emerald-400">{availableAmbulancesCount}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-xs">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-slate-400">Rescue Teams:</span>
          <span className="font-mono font-bold text-amber-400">{availableRescueTeamsCount}</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-xs">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">ICU Beds:</span>
          <span className="font-mono font-bold text-sky-400">{availableIcuBedsCount}</span>
        </div>
      </div>

      {/* Command Actions: Live Demo, Worse Scenario, New Incident, Alerts */}
      <div className="flex items-center gap-2">
        {/* Run Demo Button */}
        <button
          id="btn-run-demo"
          onClick={onRunDemo}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all shadow-lg ${
            isDemoRunning
              ? 'bg-rose-600 text-white border border-rose-400 ring-2 ring-rose-500/50 shadow-rose-950'
              : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950 border border-rose-400/80 hover:scale-105'
          }`}
          title="Start 3-Minute Hackathon Live Demonstration"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>LIVE DEMO</span>
          <span className="text-[9px] font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded text-white">
            3-MIN
          </span>
        </button>

        {/* Deteriorate / Worse Button */}
        <button
          id="btn-make-worse"
          onClick={onMakeSituationWorse}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-amber-950/70 hover:bg-amber-900/80 border border-amber-600/40 text-amber-300 transition-colors"
          title="Simulate road blockade, ambulance breakdown, and emergency replanning"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>SIMULATE FAILURE</span>
        </button>

        {/* Create Incident Button */}
        <button
          id="btn-create-incident"
          onClick={onOpenCreateIncident}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">CREATE EMERGENCY</span>
          <span className="sm:hidden">NEW</span>
        </button>

        {/* Reset */}
        <button
          onClick={onResetSimulation}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          title="Reset Simulation & Data to Baseline"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            id="btn-alerts-toggle"
            onClick={() => setShowAlertsDrawer(!showAlertsDrawer)}
            className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors relative"
            title="Recent Alerts"
          >
            <Bell className="w-4 h-4" />
            {criticalCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
            {criticalCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {/* Alerts Dropdown Drawer */}
          {showAlertsDrawer && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Emergency Alert Feed ({alerts.length})
                  </span>
                </div>
                <button
                  onClick={() => setShowAlertsDrawer(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1">
                {alerts.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center">No active alerts recorded</p>
                ) : (
                  alerts.slice(0, 10).map((alert) => (
                    <div key={alert.id} className="p-2.5 hover:bg-slate-800/40 transition-colors rounded">
                      <div className="flex items-start gap-2">
                        {alert.type === 'CRITICAL' && (
                          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        {alert.type === 'WARNING' && (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        {alert.type === 'INFO' && (
                          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        )}
                        {alert.type === 'RESOLVED' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{alert.title}</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{alert.message}</p>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

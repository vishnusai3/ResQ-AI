import React, { useState } from 'react';
import { Incident } from '../types';
import {
  Flame,
  Search,
  Filter,
  MapPin,
  X,
  Bot,
  Truck,
  CheckCircle2,
  Clock,
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  ShieldCheck,
  Plus,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

interface IncidentsPageProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onRunWorkflow: (incidentId: string) => void;
  onOpenCreate: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  incidents,
  onSelectIncident,
  onRunWorkflow,
  onOpenCreate,
  onNavigateToTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDrawerIncident, setSelectedDrawerIncident] = useState<Incident | null>(null);
  const [showAnalyticsSection, setShowAnalyticsSection] = useState<boolean>(false);

  const searchLower = (searchTerm || '').trim().toLowerCase();

  const filteredIncidents = (incidents || []).filter((inc) => {
    const loc = (inc.location || (inc as any).locationName || '');
    const title = (inc.title || '');
    const id = (inc.id || '');

    const matchesSearch =
      !searchLower ||
      title.toLowerCase().includes(searchLower) ||
      loc.toLowerCase().includes(searchLower) ||
      id.toLowerCase().includes(searchLower);

    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    const matchesType = typeFilter === 'ALL' || inc.disasterType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesType && matchesStatus;
  });

  // 4 Core Analytics Metrics
  const avgResponseTime = '3.8 mins';
  const incidentsResolved = incidents.filter((i) => i.status === 'RESOLVED').length;
  const totalEvacuated = incidents.reduce((sum, i) => sum + (i.peopleAffected || 0), 0);
  const ambulanceUtilization = '76%';

  // 2 Charts
  const typeCounts: Record<string, number> = {};
  incidents.forEach((i) => {
    typeCounts[i.disasterType] = (typeCounts[i.disasterType] || 0) + 1;
  });
  const incidentsByTypeData = Object.keys(typeCounts).map((key) => ({
    name: key,
    count: typeCounts[key],
  }));

  const responseTrendData = [
    { time: '08:00', minutes: 7.2 },
    { time: '09:00', minutes: 5.4 },
    { time: '10:00', minutes: 4.8 },
    { time: '11:00', minutes: 4.1 },
    { time: '12:00', minutes: 3.8 },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1680px] mx-auto relative">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            INCIDENTS
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Active situational queue, casualty tallies, and multi-agent dispatch states
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAnalyticsSection(!showAnalyticsSection)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
              showAnalyticsSection
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{showAnalyticsSection ? 'Hide Analytics' : 'View Analytics'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>DECLARE EMERGENCY</span>
          </button>
        </div>
      </div>

      {/* COMPACT ANALYTICS SECTION (Revealed on toggle) */}
      {showAnalyticsSection && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              <h2 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                COMPACT OPERATIONAL ANALYTICS
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Live Telemetry</span>
          </div>

          {/* 4 Useful Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                Avg Response Time
              </span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {avgResponseTime}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                Incidents Resolved
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {incidentsResolved}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                People Evacuated
              </span>
              <span className="text-xl font-bold font-mono text-sky-400 mt-1 block">
                {totalEvacuated}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                Ambulance Utilization
              </span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                {ambulanceUtilization}
              </span>
            </div>
          </div>

          {/* 2 Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase mb-2">
                Incidents by Disaster Type
              </h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incidentsByTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }} />
                    <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase mb-2">
                Response Time Trend (mins)
              </h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={responseTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="minutes" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-2.5">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search incident ID, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400" />

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">Severity: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="ACTIVE">Active</option>
            <option value="RESPONDING">Responding</option>
            <option value="RESOURCES_DISPATCHED">Dispatched</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Disaster type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">Type: All</option>
            <option value="FLOOD">Flood</option>
            <option value="FIRE">Fire</option>
            <option value="EARTHQUAKE">Earthquake</option>
            <option value="ACCIDENT">Accident</option>
            <option value="CYCLONE">Cyclone</option>
          </select>
        </div>
      </div>

      {/* Clean Table: ID | Type | Location | Severity | Affected | Status | Time */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Affected</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 font-mono">
                    No incidents matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedDrawerIncident(inc)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">
                      {inc.id}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {inc.disasterType}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{inc.locationName || inc.location}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : inc.severity === 'HIGH'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      <span>{inc.peopleAffected ?? 0}</span>
                      {inc.injured ? (
                        <span className="text-rose-400 text-[11px] ml-1.5">
                          ({inc.injured} inj)
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          inc.status === 'ACTIVE'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : inc.status === 'RESPONDING' || inc.status === 'RESOURCES_DISPATCHED'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(inc.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL SIDE DRAWER (Opens when an incident is clicked) */}
      {selectedDrawerIncident && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-rose-400">
                    {selectedDrawerIncident.id}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    {selectedDrawerIncident.severity}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">
                  {selectedDrawerIncident.locationName || selectedDrawerIncident.location}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDrawerIncident(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Incident Information */}
              <div>
                <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Incident Information
                </h4>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Disaster Type:</span>
                    <span className="font-bold">{selectedDrawerIncident.disasterType}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Status:</span>
                    <span>{selectedDrawerIncident.status}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">People Affected:</span>
                    <span>{selectedDrawerIncident.peopleAffected}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Injured:</span>
                    <span className="text-rose-400 font-bold">{selectedDrawerIncident.injured}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Missing:</span>
                    <span className="text-amber-400 font-bold">{selectedDrawerIncident.missing}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedDrawerIncident.description && (
                <div>
                  <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Description & Ground Report
                  </h4>
                  <p className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 font-sans leading-relaxed">
                    {selectedDrawerIncident.description}
                  </p>
                </div>
              )}

              {/* AI Analysis / Response Plan Summary */}
              {selectedDrawerIncident.responsePlan ? (
                <div>
                  <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-rose-400" />
                    AI Response Plan
                  </h4>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
                    <p className="text-slate-300 leading-relaxed font-sans">
                      {selectedDrawerIncident.responsePlan.summary}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      {selectedDrawerIncident.responsePlan.actions.map((act, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
                          <span>{act.action}</span>
                          <span className="font-mono text-emerald-400">{act.resource}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Assigned Resources */}
              {selectedDrawerIncident.assignedResources && selectedDrawerIncident.assignedResources.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Assigned Tactical Fleets
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDrawerIncident.assignedResources.map((res, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded bg-slate-950 text-emerald-400 font-mono text-[11px] border border-slate-800"
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Action */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onSelectIncident(selectedDrawerIncident);
                  onNavigateToTab('command-center');
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold font-mono bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>OPEN IN COMMAND CENTER</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

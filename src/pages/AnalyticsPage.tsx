import React from 'react';
import { Incident, Hospital, Ambulance } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, ShieldCheck, Activity } from 'lucide-react';

interface AnalyticsPageProps {
  incidents: Incident[];
  hospitals: Hospital[];
  ambulances: Ambulance[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  incidents,
  hospitals,
  ambulances,
}) => {
  // Chart 1: Incidents by Disaster Type
  const typeCounts: Record<string, number> = {};
  incidents.forEach((i) => {
    typeCounts[i.disasterType] = (typeCounts[i.disasterType] || 0) + 1;
  });
  const typeData = Object.keys(typeCounts).map((key) => ({
    name: key,
    count: typeCounts[key],
  }));

  // Chart 2: Severity Breakdown
  const severityCounts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  incidents.forEach((i) => {
    if (severityCounts[i.severity] !== undefined) {
      severityCounts[i.severity]++;
    }
  });
  const severityData = [
    { name: 'Critical', value: severityCounts.CRITICAL || 1, color: '#ef4444' },
    { name: 'High', value: severityCounts.HIGH || 1, color: '#f97316' },
    { name: 'Medium', value: severityCounts.MEDIUM || 1, color: '#eab308' },
    { name: 'Low', value: severityCounts.LOW || 1, color: '#10b981' },
  ];

  // Chart 3: Hospital ICU & Emergency Beds
  const hospitalBedData = hospitals.map((h) => ({
    name: h.name.split(' ')[0],
    availableER: h.emergencyBedsAvailable,
    availableICU: h.icuBedsAvailable,
    occupancy: h.currentOccupancy,
  }));

  // Chart 4: Hourly Response Simulation Data
  const hourlyData = [
    { time: '08:00', incidents: 1, dispatched: 2, avgEtaMins: 7.2 },
    { time: '09:00', incidents: 2, dispatched: 4, avgEtaMins: 8.5 },
    { time: '10:00', incidents: 3, dispatched: 6, avgEtaMins: 9.1 },
    { time: '11:00', incidents: 5, dispatched: 9, avgEtaMins: 6.8 },
    { time: '12:00', incidents: 4, dispatched: 8, avgEtaMins: 7.4 },
    { time: '13:00', incidents: 6, dispatched: 11, avgEtaMins: 6.2 },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-rose-500" />
          Emergency Operational Analytics & Performance
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Multi-agency dispatch telemetry, hospital load balancing, and response time metrics
        </p>
      </div>

      {/* Grid of Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Incidents by Disaster Type */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <h3 className="text-xs font-bold font-mono text-slate-300 uppercase mb-4">
            Incidents by Disaster Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Donut */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <h3 className="text-xs font-bold font-mono text-slate-300 uppercase mb-4">
            Incident Severity Classification
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hospital Capacity Load */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <h3 className="text-xs font-bold font-mono text-slate-300 uppercase mb-4">
            Available Emergency & ICU Beds by Facility
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hospitalBedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend
                  verticalAlign="top"
                  formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
                />
                <Bar dataKey="availableER" name="Available ER Beds" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="availableICU" name="Available ICU Beds" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dispatch Volume & ETA Trend */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <h3 className="text-xs font-bold font-mono text-slate-300 uppercase mb-4">
            Dispatch Velocity & Average Transit ETA
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend
                  verticalAlign="top"
                  formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
                />
                <Area type="monotone" dataKey="dispatched" name="Units Dispatched" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Area type="monotone" dataKey="avgEtaMins" name="Avg ETA (Minutes)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

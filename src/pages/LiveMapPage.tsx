import React from 'react';
import {
  Incident,
  Ambulance,
  Hospital,
  RescueTeam,
  Shelter,
  Road,
  Coordinates,
} from '../types';
import { LiveMap } from '../components/LiveMap';
import { MapPin, Navigation, Info, AlertTriangle } from 'lucide-react';

interface LiveMapPageProps {
  incidents: Incident[];
  ambulances: Ambulance[];
  hospitals: Hospital[];
  rescueTeams: RescueTeam[];
  shelters: Shelter[];
  roads: Road[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onSelectCoordinates: (coords: Coordinates) => void;
}

export const LiveMapPage: React.FC<LiveMapPageProps> = ({
  incidents,
  ambulances,
  hospitals,
  rescueTeams,
  shelters,
  roads,
  selectedIncident,
  onSelectIncident,
  onSelectCoordinates,
}) => {
  const blockedRoads = roads.filter((r) => r.status === 'blocked');

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-500" />
            Tactical Geospatial Operations Map
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Interactive GIS Layering • Real-Time Route Optimization • Blockade Corridors
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded border border-rose-800/40">
            {blockedRoads.length} Active Road Blockades
          </span>
          <span className="text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/40">
            {ambulances.filter((a) => a.status === 'AVAILABLE').length} Available Ambulances
          </span>
        </div>
      </div>

      {/* Expanded Map */}
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
        heightClass="h-[680px]"
      />

      {/* Geospatial Hazard and Route Legend Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <h3 className="text-xs font-bold font-mono text-slate-300 uppercase mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Active Road Blockades & Flooded Intersections
          </h3>
          <div className="space-y-1.5 text-xs">
            {blockedRoads.map((road) => (
              <div key={road.id} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800/80">
                <span className="font-semibold text-slate-200">{road.name}</span>
                <span className="text-[10px] font-mono text-rose-400">{road.hazard}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <h3 className="text-xs font-bold font-mono text-slate-300 uppercase mb-2 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-emerald-400" />
            Route Line Legend
          </h3>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 bg-emerald-400 rounded"></span>
              <span>Green Dashed: Ambulance Dispatch to Scene</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 bg-rose-500 rounded"></span>
              <span>Red Solid: Trauma Casualty Transit to Hospital</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 bg-purple-500 rounded"></span>
              <span>Purple Dashed: Civilian Evacuation Route to Shelter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 bg-red-600 border border-red-400 rounded"></span>
              <span>Red Hazard Line: Submerged / Blocked Arterial</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <h3 className="text-xs font-bold font-mono text-slate-300 uppercase mb-2 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-sky-400" />
            Dispatch Routing Agent Guidance
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedIncident
              ? `Currently targeting ${selectedIncident.id} (${selectedIncident.location}). Routing Agent dynamically navigates around waterlogged corridors and congested bridges.`
              : 'Select any active emergency from the queue to plot dynamic dispatch corridors and evacuation waypoints.'}
          </p>
        </div>
      </div>
    </div>
  );
};

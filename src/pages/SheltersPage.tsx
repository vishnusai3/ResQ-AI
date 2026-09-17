import React from 'react';
import { Shelter } from '../types';
import { Home, Users, CheckCircle2, AlertCircle, Phone } from 'lucide-react';

interface SheltersPageProps {
  shelters: Shelter[];
}

export const SheltersPage: React.FC<SheltersPageProps> = ({ shelters }) => {
  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
          <Home className="w-5 h-5 text-purple-400" />
          Civilian Evacuation & Relief Shelters
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Municipal shelter capacities, relief amenities, and emergency staging logistics
        </p>
      </div>

      {/* Grid of Shelters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shelters.map((shelter) => {
          const occupancyRate = Math.round((shelter.occupied / shelter.totalCapacity) * 100);
          const isNearFull = occupancyRate >= 80;

          return (
            <div
              key={shelter.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5 shadow-lg hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">{shelter.name}</h3>
                  <p className="text-xs text-slate-400">{shelter.location}</p>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    shelter.status === 'OPEN'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                  }`}
                >
                  {shelter.status}
                </span>
              </div>

              {/* Capacity Meter */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Current Occupancy:</span>
                  <span className={`font-bold ${isNearFull ? 'text-amber-400' : 'text-slate-200'}`}>
                    {shelter.occupied} / {shelter.totalCapacity} ({occupancyRate}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isNearFull ? 'bg-amber-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>

              {/* Remaining Capacity Highlight */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Remaining Safe Capacity:</span>
                <span className="text-sm font-bold text-emerald-400">
                  {shelter.remainingCapacity} Citizens
                </span>
              </div>

              {/* Facilities / Amenities */}
              <div>
                <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">
                  Available Onsite Amenities:
                </span>
                <div className="flex flex-wrap gap-1">
                  {shelter.facilities.map((fac, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-300 font-mono"
                    >
                      {fac}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Lead */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Coordinator: {shelter.contactPerson}</span>
                <span className="text-purple-400 text-[10px]">GHMC RELIEF SECTOR</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

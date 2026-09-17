import React from 'react';
import { Hospital } from '../types';
import { Building2, Activity, Phone, Bed, AlertCircle, ShieldCheck } from 'lucide-react';

interface HospitalsPageProps {
  hospitals: Hospital[];
}

export const HospitalsPage: React.FC<HospitalsPageProps> = ({ hospitals }) => {
  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-5 h-5 text-sky-400" />
          Regional Trauma Centers & Hospital Capacity
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Real-time bed availability, ICU surge reserves, and specialized trauma capabilities
        </p>
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hospitals.map((hosp) => {
          const isHighLoad = hosp.currentOccupancy >= 85;
          return (
            <div
              key={hosp.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5 shadow-lg hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">{hosp.name}</h3>
                  <p className="text-xs text-slate-400">{hosp.location}</p>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    hosp.status === 'OPERATIONAL'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                  }`}
                >
                  {hosp.status}
                </span>
              </div>

              {/* Occupancy Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Total Ward Occupancy:</span>
                  <span className={`font-bold ${isHighLoad ? 'text-rose-400' : 'text-slate-200'}`}>
                    {hosp.currentOccupancy}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHighLoad ? 'bg-rose-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${hosp.currentOccupancy}%` }}
                  />
                </div>
              </div>

              {/* Bed Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Emergency Beds</span>
                  <span className="text-sm font-bold text-white">
                    {hosp.emergencyBedsAvailable}
                  </span>
                  <span className="text-[10px] text-slate-500"> / {hosp.emergencyBeds} open</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Critical ICU Beds</span>
                  <span className="text-sm font-bold text-sky-400">
                    {hosp.icuBedsAvailable}
                  </span>
                  <span className="text-[10px] text-slate-500"> / {hosp.icuBeds} open</span>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">
                  Trauma & Clinical Specialties:
                </span>
                <div className="flex flex-wrap gap-1">
                  {hosp.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-300 font-mono"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{hosp.phone}</span>
                </div>
                <span className="text-emerald-400 text-[10px]">DIRECT TRIAGE LINE</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

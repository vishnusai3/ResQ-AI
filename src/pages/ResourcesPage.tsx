import React, { useState } from 'react';
import {
  Ambulance,
  RescueTeam,
  Hospital,
  Shelter,
  ResourceStatus,
} from '../types';
import {
  Truck,
  Ambulance as AmbulanceIcon,
  Flame,
  Building2,
  Home,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  Search,
  X,
  MapPin,
  Phone,
  Activity,
} from 'lucide-react';

interface ResourcesPageProps {
  ambulances: Ambulance[];
  rescueTeams: RescueTeam[];
  hospitals: Hospital[];
  shelters: Shelter[];
  onUpdateAmbulanceStatus: (id: string, status: ResourceStatus) => Promise<void>;
  onUpdateRescueTeamStatus: (id: string, status: ResourceStatus) => Promise<void>;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({
  ambulances,
  rescueTeams,
  hospitals,
  shelters,
  onUpdateAmbulanceStatus,
  onUpdateRescueTeamStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'ambulances' | 'rescue' | 'hospitals' | 'shelters'>('ambulances');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<{
    type: 'ambulance' | 'rescue' | 'hospital' | 'shelter';
    data: any;
  } | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
      case 'OPERATIONAL':
      case 'OPEN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
            {status}
          </span>
        );
      case 'EN_ROUTE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800/60">
            EN ROUTE
          </span>
        );
      case 'BUSY':
      case 'FULL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800/60">
            {status}
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
            MAINTENANCE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const searchLower = (searchTerm || '').trim().toLowerCase();

  const filteredAmbulances = (ambulances || []).filter(
    (a) =>
      !searchLower ||
      (a.callSign && a.callSign.toLowerCase().includes(searchLower)) ||
      (a.locationName && a.locationName.toLowerCase().includes(searchLower)) ||
      (a.id && a.id.toLowerCase().includes(searchLower))
  );

  const filteredRescueTeams = (rescueTeams || []).filter(
    (r) =>
      !searchLower ||
      ((r.name || (r as any).teamName || '').toLowerCase().includes(searchLower)) ||
      ((r.teamType || '').toLowerCase().includes(searchLower)) ||
      ((r.locationName || '').toLowerCase().includes(searchLower)) ||
      (r.id && r.id.toLowerCase().includes(searchLower))
  );

  const filteredHospitals = (hospitals || []).filter(
    (h) =>
      !searchLower ||
      ((h.name || '').toLowerCase().includes(searchLower)) ||
      ((h.location || '').toLowerCase().includes(searchLower))
  );

  const filteredShelters = (shelters || []).filter(
    (s) =>
      !searchLower ||
      ((s.name || '').toLowerCase().includes(searchLower)) ||
      ((s.location || '').toLowerCase().includes(searchLower))
  );

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1680px] mx-auto relative">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            RESOURCES
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Emergency operational fleets, regional medical facilities, and civilian evacuation shelters
          </p>
        </div>

        {/* Tab Switcher: AMBULANCES | RESCUE TEAMS | HOSPITALS | SHELTERS */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg flex-wrap">
          <button
            type="button"
            onClick={() => { setActiveTab('ambulances'); setSelectedItem(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'ambulances'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AmbulanceIcon className="w-3.5 h-3.5" />
            <span>AMBULANCES ({ambulances.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('rescue'); setSelectedItem(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'rescue'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>RESCUE TEAMS ({rescueTeams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('hospitals'); setSelectedItem(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'hospitals'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>HOSPITALS ({hospitals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('shelters'); setSelectedItem(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'shelters'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>SHELTERS ({shelters.length})</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="max-w-md relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search in ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* TAB 1: AMBULANCES TABLE */}
      {activeTab === 'ambulances' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Capability</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredAmbulances.map((amb) => (
                  <tr
                    key={amb.id}
                    onClick={() => setSelectedItem({ type: 'ambulance', data: amb })}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {amb.callSign} <span className="text-[11px] text-slate-500 font-normal">({amb.id})</span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(amb.status)}</td>
                    <td className="py-3 px-4 text-emerald-300 font-mono font-semibold">
                      {amb.medicalCapability}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{amb.locationName}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {amb.assignedIncidentId ? (
                        <span className="text-rose-400 font-bold">Assigned: {amb.assignedIncidentId}</span>
                      ) : (
                        <span className="text-slate-500">Unassigned (Standby)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RESCUE TEAMS TABLE */}
      {activeTab === 'rescue' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Capability</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredRescueTeams.map((team) => (
                  <tr
                    key={team.id}
                    onClick={() => setSelectedItem({ type: 'rescue', data: team })}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {team.name || (team as any).teamName || team.id} <span className="text-[11px] text-slate-500 font-normal">({team.id})</span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(team.status)}</td>
                    <td className="py-3 px-4 text-amber-300 font-mono font-semibold">
                      {team.teamType || (team as any).specialization || 'Rescue Squad'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{team.locationName}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {team.personnelCount} responders
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HOSPITALS TABLE */}
      {activeTab === 'hospitals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4">Hospital</th>
                  <th className="py-3 px-4">ICU Available</th>
                  <th className="py-3 px-4">Emergency Available</th>
                  <th className="py-3 px-4">Occupancy</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredHospitals.map((hosp) => (
                  <tr
                    key={hosp.id}
                    onClick={() => setSelectedItem({ type: 'hospital', data: hosp })}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-white">
                      {hosp.name}
                      <span className="block text-[11px] text-slate-400 font-normal">{hosp.location}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">
                      {hosp.icuBedsAvailable}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {hosp.emergencyBedsAvailable}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              hosp.currentOccupancy >= 85 ? 'bg-rose-500' : 'bg-sky-500'
                            }`}
                            style={{ width: `${hosp.currentOccupancy}%` }}
                          />
                        </div>
                        <span className="text-[11px]">{hosp.currentOccupancy}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(hosp.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SHELTERS TABLE */}
      {activeTab === 'shelters' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4">Shelter</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Occupied</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredShelters.map((sh) => {
                  const availableBeds = Math.max(0, sh.totalCapacity - sh.occupied);
                  return (
                    <tr
                      key={sh.id}
                      onClick={() => setSelectedItem({ type: 'shelter', data: sh })}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-white">
                        {sh.name}
                        <span className="block text-[11px] text-slate-400 font-normal">{sh.location}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{sh.totalCapacity}</td>
                      <td className="py-3 px-4 font-mono text-amber-400">{sh.occupied}</td>
                      <td className="py-3 px-4 font-mono font-bold text-purple-400">{availableBeds}</td>
                      <td className="py-3 px-4">{getStatusBadge(sh.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER / MODAL FOR SELECTED ROW */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl p-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-white uppercase">
                {selectedItem.type.toUpperCase()} DETAILS
              </h3>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs font-mono">
              {/* Ambulance Specific Details */}
              {selectedItem.type === 'ambulance' && (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between"><span className="text-slate-500">Callsign:</span><span className="text-white font-bold">{selectedItem.data.callSign}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Vehicle:</span><span className="text-slate-300">{selectedItem.data.vehicleNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Capability:</span><span className="text-emerald-400">{selectedItem.data.medicalCapability}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Location:</span><span className="text-slate-300">{selectedItem.data.locationName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Status:</span><span>{getStatusBadge(selectedItem.data.status)}</span></div>
                  </div>

                  {/* Status override */}
                  <div className="pt-2 border-t border-slate-800">
                    <label className="text-[10px] uppercase text-slate-400 block mb-2">Override Status:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['AVAILABLE', 'EN_ROUTE', 'BUSY', 'MAINTENANCE'] as ResourceStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={async () => {
                            await onUpdateAmbulanceStatus(selectedItem.data.id, st);
                            setSelectedItem(null);
                          }}
                          className={`p-2 rounded text-center border font-bold text-[10px] transition-colors ${
                            selectedItem.data.status === st
                              ? 'bg-rose-600 text-white border-rose-500'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Rescue Team Details */}
              {selectedItem.type === 'rescue' && (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between"><span className="text-slate-500">Squad Name:</span><span className="text-white font-bold">{selectedItem.data.name || selectedItem.data.teamName || selectedItem.data.id}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Specialization:</span><span className="text-amber-400">{selectedItem.data.teamType || selectedItem.data.specialization || 'Tactical Rescue'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Personnel:</span><span className="text-slate-300">{selectedItem.data.personnelCount} operators</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Station:</span><span className="text-slate-300">{selectedItem.data.locationName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Status:</span><span>{getStatusBadge(selectedItem.data.status)}</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <label className="text-[10px] uppercase text-slate-400 block mb-2">Override Status:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['AVAILABLE', 'EN_ROUTE', 'BUSY', 'MAINTENANCE'] as ResourceStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={async () => {
                            await onUpdateRescueTeamStatus(selectedItem.data.id, st);
                            setSelectedItem(null);
                          }}
                          className={`p-2 rounded text-center border font-bold text-[10px] transition-colors ${
                            selectedItem.data.status === st
                              ? 'bg-rose-600 text-white border-rose-500'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Hospital Details */}
              {selectedItem.type === 'hospital' && (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between"><span className="text-slate-500">Hospital:</span><span className="text-white font-bold">{selectedItem.data.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Address:</span><span className="text-slate-300">{selectedItem.data.location}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">ICU Beds:</span><span className="text-sky-400">{selectedItem.data.icuBedsAvailable} available</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Emergency Beds:</span><span className="text-emerald-400">{selectedItem.data.emergencyBedsAvailable} available</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Occupancy:</span><span className="text-slate-200">{selectedItem.data.currentOccupancy}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Direct Line:</span><span className="text-slate-300">{selectedItem.data.phone}</span></div>
                  </div>
                </div>
              )}

              {/* Shelter Details */}
              {selectedItem.type === 'shelter' && (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between"><span className="text-slate-500">Facility:</span><span className="text-white font-bold">{selectedItem.data.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Sector:</span><span className="text-slate-300">{selectedItem.data.location}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Total Capacity:</span><span className="text-white">{selectedItem.data.totalCapacity}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Occupied:</span><span className="text-amber-400">{selectedItem.data.occupied}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Open Available:</span><span className="text-purple-400 font-bold">{Math.max(0, selectedItem.data.totalCapacity - selectedItem.data.occupied)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Helpline:</span><span className="text-slate-300">{selectedItem.data.contact}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

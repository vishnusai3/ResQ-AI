import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Incident,
  Ambulance,
  Hospital,
  RescueTeam,
  Shelter,
  Road,
  Coordinates,
} from '../types';
import {
  Layers,
  Eye,
  EyeOff,
  Navigation,
  AlertTriangle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Crosshair,
  Move,
} from 'lucide-react';

interface LiveMapProps {
  incidents: Incident[];
  ambulances: Ambulance[];
  hospitals: Hospital[];
  rescueTeams: RescueTeam[];
  shelters: Shelter[];
  roads: Road[];
  selectedIncident?: Incident | null;
  onSelectIncident?: (incident: Incident) => void;
  onSelectCoordinates?: (coords: Coordinates) => void;
  enablePickLocation?: boolean;
  highlightedAmbulanceId?: string;
  highlightedHospitalId?: string;
  highlightedShelterId?: string;
  heightClass?: string;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  incidents,
  ambulances,
  hospitals,
  rescueTeams,
  shelters,
  roads,
  selectedIncident,
  onSelectIncident,
  onSelectCoordinates,
  enablePickLocation = false,
  highlightedAmbulanceId,
  highlightedHospitalId,
  highlightedShelterId,
  heightClass = 'h-[540px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const lastCenteredIncidentIdRef = useRef<string | null>(null);
  const lastHighlightKeyRef = useRef<string | null>(null);

  // Layer filter state
  const [layers, setLayers] = useState({
    incidents: true,
    ambulances: true,
    rescue: true,
    hospitals: true,
    shelters: true,
    roads: true,
  });

  const [clickedCoord, setClickedCoord] = useState<Coordinates | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Hyderabad coordinates
    const map = L.map(mapContainerRef.current, {
      center: [17.445, 78.435],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      keyboardPanDelta: 200,
    });

    // Dark sleek tactical tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const mainLayer = L.layerGroup().addTo(map);
    const routesLayer = L.layerGroup().addTo(map);

    layerGroupRef.current = mainLayer;
    routesLayerRef.current = routesLayer;
    mapInstanceRef.current = map;

    // Map click for coordinate picking
    map.on('click', (e: L.LeafletMouseEvent) => {
      const coords = { lat: Number(e.latlng.lat.toFixed(4)), lng: Number(e.latlng.lng.toFixed(4)) };
      setClickedCoord(coords);
      if (onSelectCoordinates) {
        onSelectCoordinates(coords);
      }
    });

    // Watch for container resizes to maintain proper pan & drag coordinates
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Overlays
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !routesLayerRef.current) return;

    const layerGroup = layerGroupRef.current;
    const routesLayer = routesLayerRef.current;
    layerGroup.clearLayers();
    routesLayer.clearLayers();

    // 1. Render Blocked Roads & Corridors
    if (layers.roads) {
      roads.forEach((road) => {
        const isBlocked = road.status === 'blocked';
        const polyline = L.polyline(road.points, {
          color: isBlocked ? '#ef4444' : '#10b981',
          weight: isBlocked ? 4 : 2,
          dashArray: isBlocked ? '6, 8' : undefined,
          opacity: isBlocked ? 0.85 : 0.4,
        });

        polyline.bindPopup(`
          <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
            <div style="font-weight: bold; font-size: 13px; color: ${isBlocked ? '#dc2626' : '#059669'};">
              ${isBlocked ? '⛔ ROAD BLOCKED' : '🟢 OPEN CORRIDOR'}: ${road.name}
            </div>
            <div style="font-size: 11px; margin-top: 4px; color: #475569;">
              Traffic: <b>${road.traffic}</b> | Area: <b>${road.area}</b>
            </div>
            <div style="font-size: 11px; margin-top: 2px; color: #dc2626;">
              ${road.hazard}
            </div>
          </div>
        `);

        layerGroup.addLayer(polyline);
      });
    }

    // 2. Render Shelters 🏠
    if (layers.shelters) {
      shelters.forEach((shelter) => {
        const isHighlighted = shelter.id === highlightedShelterId || shelter.id === selectedIncident?.selectedShelterId;
        const iconHtml = `
          <div style="
            width: ${isHighlighted ? '36px' : '28px'};
            height: ${isHighlighted ? '36px' : '28px'};
            background: #8b5cf6;
            border: 2px solid ${isHighlighted ? '#ffffff' : '#c4b5fd'};
            border-radius: 8px;
            box-shadow: 0 0 ${isHighlighted ? '15px #8b5cf6' : '6px rgba(0,0,0,0.6)'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: white;
            transition: all 0.3s ease;
          ">
            🏠
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: 'custom-map-icon', iconSize: [30, 30], iconAnchor: [15, 15] });

        const marker = L.marker([shelter.coordinates.lat, shelter.coordinates.lng], { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; color: #0f172a; min-width: 200px;">
            <div style="font-weight: 800; font-size: 13px; color: #6d28d9;">🏠 ${shelter.name}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">${shelter.location}</div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 6px 0;" />
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
              <div>Total Capacity: <b>${shelter.totalCapacity}</b></div>
              <div>Occupied: <b>${shelter.occupied}</b></div>
              <div>Remaining: <b style="color: #059669;">${shelter.remainingCapacity}</b></div>
              <div>Status: <b>${shelter.status}</b></div>
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 6px;">
              Contact: ${shelter.contactPerson}
            </div>
          </div>
        `);
        layerGroup.addLayer(marker);
      });
    }

    // 3. Render Hospitals 🏥
    if (layers.hospitals) {
      hospitals.forEach((hospital) => {
        const isHighlighted = hospital.id === highlightedHospitalId || hospital.id === selectedIncident?.selectedHospitalId;
        const iconHtml = `
          <div style="
            width: ${isHighlighted ? '38px' : '30px'};
            height: ${isHighlighted ? '38px' : '30px'};
            background: #0284c7;
            border: 2px solid ${isHighlighted ? '#38bdf8' : '#e0f2fe'};
            border-radius: 50%;
            box-shadow: 0 0 ${isHighlighted ? '18px #0284c7' : '6px rgba(0,0,0,0.5)'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: white;
            font-weight: bold;
          ">
            🏥
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: 'custom-map-icon', iconSize: [32, 32], iconAnchor: [16, 16] });

        const marker = L.marker([hospital.coordinates.lat, hospital.coordinates.lng], { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; color: #0f172a; min-width: 220px;">
            <div style="font-weight: 800; font-size: 13px; color: #0369a1;">🏥 ${hospital.name}</div>
            <div style="font-size: 11px; color: #475569;">${hospital.location}</div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 6px 0;" />
            <div style="font-size: 11px; line-height: 1.5;">
              <div>Status: <b style="color: ${hospital.status === 'OPERATIONAL' ? '#059669' : '#dc2626'}">${hospital.status}</b></div>
              <div>Available ER Beds: <b>${hospital.emergencyBedsAvailable}</b> / ${hospital.emergencyBeds}</div>
              <div>Available ICU Beds: <b style="color: #0284c7;">${hospital.icuBedsAvailable}</b> / ${hospital.icuBeds}</div>
              <div>Current Occupancy: <b>${hospital.currentOccupancy}%</b></div>
              <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Specialties: ${hospital.specialties.join(', ')}</div>
            </div>
          </div>
        `);
        layerGroup.addLayer(marker);
      });
    }

    // 4. Render Rescue Teams 🚒
    if (layers.rescue) {
      rescueTeams.forEach((team) => {
        const isAssigned = !!team.assignedIncidentId;
        const iconHtml = `
          <div style="
            width: 30px;
            height: 30px;
            background: #d97706;
            border: 2px solid ${isAssigned ? '#fde68a' : '#ffffff'};
            border-radius: 6px;
            box-shadow: 0 0 8px rgba(217, 119, 6, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
          ">
            🚒
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: 'custom-map-icon', iconSize: [30, 30], iconAnchor: [15, 15] });

        const marker = L.marker([team.coordinates.lat, team.coordinates.lng], { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; color: #0f172a; min-width: 200px;">
            <div style="font-weight: 800; font-size: 13px; color: #b45309;">🚒 ${team.name}</div>
            <div style="font-size: 11px; color: #64748b;">ID: ${team.id} | Location: ${team.locationName}</div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 6px 0;" />
            <div style="font-size: 11px;">
              <div>Type: <b>${team.teamType}</b></div>
              <div>Personnel: <b>${team.personnelCount} members</b></div>
              <div>Status: <b style="color: ${team.status === 'AVAILABLE' ? '#059669' : '#d97706'}">${team.status}</b></div>
              <div>Assigned Incident: <b>${team.assignedIncidentId || 'None (Standby)'}</b></div>
              <div style="font-size: 10px; color: #475569; margin-top: 4px;">Gear: ${team.equipment.slice(0, 2).join(', ')}</div>
            </div>
          </div>
        `);
        layerGroup.addLayer(marker);
      });
    }

    // 5. Render Ambulances 🚑
    if (layers.ambulances) {
      ambulances.forEach((ambulance) => {
        const isAssigned = !!ambulance.assignedIncidentId;
        const isTarget = ambulance.id === highlightedAmbulanceId;
        const statusColor = ambulance.status === 'AVAILABLE' ? '#10b981' : ambulance.status === 'EN_ROUTE' ? '#eab308' : '#ef4444';
        const iconHtml = `
          <div style="
            width: ${isTarget ? '36px' : '28px'};
            height: ${isTarget ? '36px' : '28px'};
            background: ${statusColor};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 ${isTarget ? '16px #10b981' : '6px rgba(0,0,0,0.5)'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            color: white;
            font-weight: bold;
          ">
            🚑
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: 'custom-map-icon', iconSize: [30, 30], iconAnchor: [15, 15] });

        const marker = L.marker([ambulance.coordinates.lat, ambulance.coordinates.lng], { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; color: #0f172a; min-width: 210px;">
            <div style="font-weight: 800; font-size: 13px; color: #047857;">🚑 ${ambulance.callSign} (${ambulance.id})</div>
            <div style="font-size: 11px; color: #64748b;">Plate: ${ambulance.vehicleNumber}</div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 6px 0;" />
            <div style="font-size: 11px; line-height: 1.4;">
              <div>Location: <b>${ambulance.locationName}</b></div>
              <div>Status: <b style="color: ${statusColor};">${ambulance.status}</b></div>
              <div>Capability: <b>${ambulance.medicalCapability}</b></div>
              <div>Capacity: <b>${ambulance.capacity} Patient(s)</b></div>
              <div>Traffic Zone: <b>${ambulance.currentTraffic}</b></div>
              <div>Assigned Incident: <b>${ambulance.assignedIncidentId || 'None'}</b></div>
            </div>
          </div>
        `);
        layerGroup.addLayer(marker);
      });
    }

    // 6. Render Disaster Incidents 🔴
    if (layers.incidents) {
      incidents.forEach((incident) => {
        const isSelected = selectedIncident?.id === incident.id;
        const isCritical = incident.severity === 'CRITICAL';
        const markerColor = isCritical ? '#ef4444' : '#f97316';

        const iconHtml = `
          <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: ${markerColor};
              opacity: 0.35;
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: ${isSelected ? '36px' : '30px'};
              height: ${isSelected ? '36px' : '30px'};
              border-radius: 50%;
              background: ${markerColor};
              border: 3px solid #ffffff;
              box-shadow: 0 0 14px ${markerColor};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 15px;
              cursor: pointer;
              transition: transform 0.2s ease;
            ">
              ${incident.disasterType === 'Flood' ? '🌊' : incident.disasterType === 'Fire' ? '🔥' : incident.disasterType === 'Building Collapse' ? '🏚️' : '🚨'}
            </div>
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: 'custom-incident-icon', iconSize: [42, 42], iconAnchor: [21, 21] });

        const marker = L.marker([incident.coordinates.lat, incident.coordinates.lng], { icon });

        marker.on('click', () => {
          if (onSelectIncident) {
            onSelectIncident(incident);
          }
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; color: #0f172a; min-width: 230px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 800; font-size: 13px; color: #b91c1c;">${incident.id}: ${incident.disasterType}</span>
              <span style="font-size: 10px; font-weight: bold; background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px;">
                ${incident.severity}
              </span>
            </div>
            <div style="font-size: 11px; font-weight: 600; color: #1e293b; margin-top: 3px;">${incident.location}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 3px;">${incident.description}</div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 6px 0;" />
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
              <div>Affected: <b>${incident.peopleAffected}</b></div>
              <div>Injured: <b style="color: #b91c1c;">${incident.injured}</b></div>
              <div>Missing: <b>${incident.missing}</b></div>
              <div>Status: <b>${incident.status}</b></div>
            </div>
            ${incident.assignedResources?.length ? `
              <div style="font-size: 10px; color: #047857; margin-top: 6px; background: #ecfdf5; padding: 4px; border-radius: 4px;">
                Units: ${incident.assignedResources.join(', ')}
              </div>
            ` : ''}
          </div>
        `);

        layerGroup.addLayer(marker);
      });
    }

    // 7. Route Lines for Selected Incident
    if (selectedIncident) {
      // Ambulance -> Incident Route Line (Emerald)
      const assignedAmbId = highlightedAmbulanceId || selectedIncident.assignedResources?.[0];
      const assignedAmb = ambulances.find((a) => a.id === assignedAmbId);
      if (assignedAmb && assignedAmb.coordinates && selectedIncident.coordinates) {
        const ambRouteLine = L.polyline(
          [
            [assignedAmb.coordinates.lat, assignedAmb.coordinates.lng],
            [selectedIncident.coordinates.lat, selectedIncident.coordinates.lng],
          ],
          {
            color: '#10b981',
            weight: 4,
            opacity: 0.9,
            dashArray: '8, 8',
          }
        ).bindTooltip(`🚑 Ambulance Route (${assignedAmb.callSign} → Scene)`, { permanent: false });
        routesLayer.addLayer(ambRouteLine);
      }

      // Incident -> Hospital Route Line (Rose / Amber)
      const targetHospId = highlightedHospitalId || selectedIncident.selectedHospitalId;
      const targetHosp = hospitals.find((h) => h.id === targetHospId);
      if (targetHosp && targetHosp.coordinates && selectedIncident.coordinates) {
        const hospRouteLine = L.polyline(
          [
            [selectedIncident.coordinates.lat, selectedIncident.coordinates.lng],
            [targetHosp.coordinates.lat, targetHosp.coordinates.lng],
          ],
          {
            color: '#f43f5e',
            weight: 4,
            opacity: 0.9,
          }
        ).bindTooltip(`🏥 Casualty Transport (Scene → ${targetHosp.name})`, { permanent: false });
        routesLayer.addLayer(hospRouteLine);
      }

      // Incident -> Shelter Evacuation Route Line (Violet)
      const targetShelterId = highlightedShelterId || selectedIncident.selectedShelterId;
      const targetShelter = shelters.find((s) => s.id === targetShelterId);
      if (targetShelter && targetShelter.coordinates && selectedIncident.coordinates) {
        const shelterRouteLine = L.polyline(
          [
            [selectedIncident.coordinates.lat, selectedIncident.coordinates.lng],
            [targetShelter.coordinates.lat, targetShelter.coordinates.lng],
          ],
          {
            color: '#a855f7',
            weight: 3,
            opacity: 0.85,
            dashArray: '4, 6',
          }
        ).bindTooltip(`🏠 Civilian Evacuation Route (Scene → ${targetShelter.name})`, { permanent: false });
        routesLayer.addLayer(shelterRouteLine);
      }
    }
  }, [
    incidents,
    ambulances,
    hospitals,
    rescueTeams,
    shelters,
    roads,
    selectedIncident,
    layers,
    highlightedAmbulanceId,
    highlightedHospitalId,
    highlightedShelterId,
  ]);

  // Smoothly pan sideways when selected incident changes (no repetitive out-and-in bounce)
  useEffect(() => {
    if (!selectedIncident || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const incidentId = selectedIncident.id;

    if (lastCenteredIncidentIdRef.current !== incidentId) {
      lastCenteredIncidentIdRef.current = incidentId;
      map.panTo([selectedIncident.coordinates.lat, selectedIncident.coordinates.lng], {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedIncident]);

  // Smoothly pan sideways to frame highlighted resources (Ambulance, Hospital, Shelter)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const currentKey = `${highlightedAmbulanceId || ''}_${highlightedHospitalId || ''}_${highlightedShelterId || ''}`;

    if (currentKey === lastHighlightKeyRef.current) return;
    lastHighlightKeyRef.current = currentKey;

    // If ambulance highlighted (Step 4 / 8) -> pan sideways to frame both incident and ambulance
    if (highlightedAmbulanceId && selectedIncident) {
      const amb = ambulances.find((a) => a.id === highlightedAmbulanceId);
      if (amb) {
        const bounds = L.latLngBounds([
          [selectedIncident.coordinates.lat, selectedIncident.coordinates.lng],
          [amb.coordinates.lat, amb.coordinates.lng],
        ]);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
        return;
      }
    }

    // If hospital highlighted (Step 6 / 8) -> pan sideways across Hyderabad to show hospital transit corridor
    if (highlightedHospitalId && selectedIncident) {
      const hosp = hospitals.find((h) => h.id === highlightedHospitalId);
      if (hosp) {
        const bounds = L.latLngBounds([
          [selectedIncident.coordinates.lat, selectedIncident.coordinates.lng],
          [hosp.coordinates.lat, hosp.coordinates.lng],
        ]);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13.5, animate: true });
        return;
      }
    }

    // If shelter highlighted (Step 7 / 8) -> pan sideways to frame incident and evacuation shelter
    if (highlightedShelterId && selectedIncident) {
      const shelter = shelters.find((s) => s.id === highlightedShelterId);
      if (shelter) {
        const bounds = L.latLngBounds([
          [selectedIncident.coordinates.lat, selectedIncident.coordinates.lng],
          [shelter.coordinates.lat, shelter.coordinates.lng],
        ]);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
        return;
      }
    }
  }, [
    highlightedAmbulanceId,
    highlightedHospitalId,
    highlightedShelterId,
    selectedIncident,
    ambulances,
    hospitals,
    shelters,
  ]);

  // Pan helper functions for manual sideways movement
  const handlePan = (dx: number, dy: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panBy([dx, dy], { animate: true, duration: 0.4 });
    }
  };

  const handleCenterIncident = () => {
    if (mapInstanceRef.current && selectedIncident) {
      mapInstanceRef.current.panTo([selectedIncident.coordinates.lat, selectedIncident.coordinates.lng], {
        animate: true,
        duration: 0.6,
      });
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const points: [number, number][] = [];
    incidents.forEach((i) => points.push([i.coordinates.lat, i.coordinates.lng]));
    ambulances.forEach((a) => points.push([a.coordinates.lat, a.coordinates.lng]));
    hospitals.forEach((h) => points.push([h.coordinates.lat, h.coordinates.lng]));
    shelters.forEach((s) => points.push([s.coordinates.lat, s.coordinates.lng]));

    if (points.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(points), { padding: [50, 50], animate: true });
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
      {/* Map Header / Layer Toggles */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 text-xs shadow-lg">
        <div className="flex items-center gap-1.5 px-2 py-1 text-slate-300 font-mono font-bold text-[11px] border-r border-slate-800 mr-1">
          <Layers className="w-3.5 h-3.5 text-rose-500" />
          <span>MAP LAYERS:</span>
        </div>

        <button
          onClick={() => setLayers((prev) => ({ ...prev, incidents: !prev.incidents }))}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
            layers.incidents ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800/60 text-slate-400'
          }`}
        >
          <span>🔴 Incidents ({incidents.length})</span>
        </button>

        <button
          onClick={() => setLayers((prev) => ({ ...prev, ambulances: !prev.ambulances }))}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
            layers.ambulances ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800/60 text-slate-400'
          }`}
        >
          <span>🚑 Ambulances ({ambulances.length})</span>
        </button>

        <button
          onClick={() => setLayers((prev) => ({ ...prev, rescue: !prev.rescue }))}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
            layers.rescue ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800/60 text-slate-400'
          }`}
        >
          <span>🚒 Rescue ({rescueTeams.length})</span>
        </button>

        <button
          onClick={() => setLayers((prev) => ({ ...prev, hospitals: !prev.hospitals }))}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
            layers.hospitals ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-800/60 text-slate-400'
          }`}
        >
          <span>🏥 Hospitals ({hospitals.length})</span>
        </button>

        <button
          onClick={() => setLayers((prev) => ({ ...prev, shelters: !prev.shelters }))}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
            layers.shelters ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800/60 text-slate-400'
          }`}
        >
          <span>🏠 Shelters ({shelters.length})</span>
        </button>

        <button
          onClick={() => setLayers((prev) => ({ ...prev, roads: !prev.roads }))}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
            layers.roads ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-slate-800/60 text-slate-400'
          }`}
        >
          <span>⛔ Blockades ({roads.filter((r) => r.status === 'blocked').length})</span>
        </button>
      </div>

      {/* Selected Incident Route Banner */}
      {selectedIncident && (
        <div className="absolute top-14 left-3 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-xl max-w-sm">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-400">
            <span>ACTIVE FOCUS: {selectedIncident.id}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
              {selectedIncident.severity}
            </span>
          </div>
          <p className="text-xs text-slate-200 font-semibold truncate mt-1">
            {selectedIncident.title}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
            <span>Casualties: <b className="text-rose-400">{selectedIncident.injured}</b></span>
            <span>At Risk: <b className="text-amber-400">{selectedIncident.peopleAffected}</b></span>
          </div>

          {/* Route Leg Indicators */}
          <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Ambulance Route (Green Dashed)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Hospital Transit Line (Red Solid)</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>Civic Evacuation Corridor (Purple)</span>
            </div>
          </div>
        </div>
      )}

      {/* Coordinate Pick Feedback */}
      {enablePickLocation && clickedCoord && (
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-lg shadow-lg font-mono">
          📍 Map Pin Selected: lat {clickedCoord.lat}, lng {clickedCoord.lng}
        </div>
      )}

      {/* Floating Tactical Pan & Compass Controls (Move Sides) */}
      <div className="absolute bottom-3 right-3 z-[400] flex items-center gap-2">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 shadow-2xl flex items-center gap-1.5 font-mono text-xs">
          {/* Quick Fit / Center Buttons */}
          <button
            onClick={handleCenterIncident}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 transition-colors"
            title="Pan to Focused Incident"
          >
            <Crosshair className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline text-[11px]">Center Incident</span>
          </button>

          <button
            onClick={handleFitAll}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Fit All Resources in Hyderabad"
          >
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline text-[11px]">Fit Overview</span>
          </button>

          {/* D-Pad Directional Pan Buttons */}
          <div className="flex items-center gap-0.5 border-l border-slate-800 pl-1.5">
            <button
              onClick={() => handlePan(-280, 0)}
              className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
              title="Pan West (Left)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => handlePan(0, -220)}
                className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                title="Pan North (Up)"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handlePan(0, 220)}
                className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                title="Pan South (Down)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => handlePan(280, 0)}
              className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
              title="Pan East (Right)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Leaflet Container */}
      <div
        id="leaflet-map-canvas"
        ref={mapContainerRef}
        className={`w-full ${heightClass} z-0 cursor-grab active:cursor-grabbing`}
      />
    </div>
  );
};

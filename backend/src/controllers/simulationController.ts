import { Request, Response } from 'express';
import { dataStore } from '../services/dataStore';
import { runIncidentWorkflow } from '../orchestrator';

export const startSimulation = async (req: Request, res: Response) => {
  try {
    const { scenario } = req.body; // 'flood' | 'fire' | 'earthquake' | 'accident' | 'cyclone'
    let incidentData;

    switch (scenario) {
      case 'fire':
        incidentData = {
          title: 'Category-4 Commercial Tower Blaze',
          disasterType: 'Fire',
          location: 'Begumpet Airport Enclave, Hyderabad',
          coordinates: { lat: 17.4448, lng: 78.4664 },
          severity: 'CRITICAL' as const,
          peopleAffected: 65,
          injured: 7,
          missing: 2,
          fireIntensity: 'High heat, 4th floor structural breach',
          description: 'Intense fire outbreak trapping occupants in executive suites. Heavy toxic smoke billowing over Prakash Nagar corridor.',
        };
        break;

      case 'earthquake':
        incidentData = {
          title: 'Structural Masonry Collapse post-Tremor',
          disasterType: 'Earthquake',
          location: 'Secunderabad Station Road, Hyderabad',
          coordinates: { lat: 17.4399, lng: 78.4983 },
          severity: 'CRITICAL' as const,
          peopleAffected: 95,
          injured: 12,
          missing: 4,
          damageLevel: 'Severe multi-story facade collapse',
          description: 'Seismic vibration induced structural collapse of 3 commercial storefronts. Multiple pedestrians buried beneath concrete awning.',
        };
        break;

      case 'accident':
        incidentData = {
          title: 'Expressway Multi-Transit Bus Collision',
          disasterType: 'Other',
          location: 'Gachibowli Outer Ring Road Interchange, Hyderabad',
          coordinates: { lat: 17.4401, lng: 78.3489 },
          severity: 'HIGH' as const,
          peopleAffected: 50,
          injured: 14,
          missing: 0,
          description: 'High-speed RTC express bus collision with tanker during sudden squall. Fuel spill spreading across southbound lanes.',
        };
        break;

      case 'cyclone':
        incidentData = {
          title: 'Severe Cyclone Wind Damage & Flash Inundation',
          disasterType: 'Cyclone',
          location: 'Uppal Ring Road & Musi River Basin, Hyderabad',
          coordinates: { lat: 17.4022, lng: 78.5601 },
          severity: 'CRITICAL' as const,
          peopleAffected: 140,
          injured: 9,
          missing: 3,
          waterLevel: '5.2 feet and surging',
          description: 'Gale-force winds downing high-tension wires while flash runoff submerges arterial roads and low-income riverbank settlements.',
        };
        break;

      case 'flood':
      default:
        incidentData = {
          title: 'Major Cloudburst & Inundation at Kukatpally',
          disasterType: 'Flood',
          location: 'Kukatpally Y-Junction & KPHB Colony, Hyderabad',
          coordinates: { lat: 17.4947, lng: 78.3996 },
          severity: 'CRITICAL' as const,
          peopleAffected: 100,
          injured: 5,
          missing: 3,
          waterLevel: '4.8 feet with rapid influx',
          description: 'Severe flash flood caused by 115mm cloudburst in 45 minutes. Water entering residential basements, vehicles floating, access cut off on KPHB Main Road.',
        };
        break;
    }

    const created = dataStore.createIncident(incidentData);
    const workflow = await runIncidentWorkflow(created);

    res.json({
      success: true,
      scenario: scenario || 'flood',
      incident: created,
      workflow,
    });
  } catch (err: any) {
    console.error('Simulation error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Simulation execution error' });
  }
};

export const triggerWorseSituation = async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.body;
    const disruption = dataStore.simulateWorseSituation(incidentId);

    const targetIncident = incidentId ? dataStore.getIncidentById(incidentId) : dataStore.getIncidents()[0];
    let replannedWorkflow = null;

    if (targetIncident) {
      replannedWorkflow = await runIncidentWorkflow(targetIncident);
    }

    res.json({
      success: true,
      disruption,
      incident: targetIncident,
      replannedWorkflow,
      message: 'Situation aggravated: road blocked, ambulance failed, hospital capacity strained. Replanning executed successfully.',
    });
  } catch (err: any) {
    console.error('Aggravation error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to trigger situation deterioration' });
  }
};

export const resetSimulation = (_req: Request, res: Response) => {
  const result = dataStore.resetAll();
  res.json({ success: true, ...result });
};

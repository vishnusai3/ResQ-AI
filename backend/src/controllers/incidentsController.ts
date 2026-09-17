import { Request, Response } from 'express';
import { dataStore } from '../services/dataStore';
import { runIncidentWorkflow } from '../orchestrator';

export const getIncidents = (req: Request, res: Response) => {
  const incidents = dataStore.getIncidents();
  res.json({ success: true, data: incidents });
};

export const getIncidentById = (req: Request, res: Response) => {
  const incident = dataStore.getIncidentById(req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }
  res.json({ success: true, data: incident });
};

export const createIncident = async (req: Request, res: Response) => {
  try {
    const {
      title,
      disasterType,
      location,
      coordinates,
      severity,
      peopleAffected,
      injured,
      missing,
      waterLevel,
      fireIntensity,
      damageLevel,
      description,
      imageUrl,
      imageAnalysis,
      autoTriggerAgents,
    } = req.body;

    if (!disasterType || !location) {
      return res.status(400).json({ success: false, error: 'disasterType and location are required' });
    }

    const newIncident = dataStore.createIncident({
      title: title || `${disasterType} Emergency at ${location}`,
      disasterType,
      location,
      coordinates: coordinates || { lat: 17.4947, lng: 78.3996 },
      severity: severity || 'HIGH',
      status: 'NEW',
      peopleAffected: Number(peopleAffected) || 10,
      injured: Number(injured) || 0,
      missing: Number(missing) || 0,
      waterLevel,
      fireIntensity,
      damageLevel,
      description: description || `Reported ${disasterType} at ${location}`,
      imageUrl,
      imageAnalysis,
    });

    let workflowResult = null;
    if (autoTriggerAgents !== false) {
      workflowResult = await runIncidentWorkflow(newIncident);
    }

    res.status(201).json({
      success: true,
      data: newIncident,
      workflow: workflowResult,
    });
  } catch (err: any) {
    console.error('Failed to create incident:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal error' });
  }
};

export const updateIncident = (req: Request, res: Response) => {
  const updated = dataStore.updateIncident(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }
  res.json({ success: true, data: updated });
};

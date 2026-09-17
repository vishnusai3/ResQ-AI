import { Request, Response } from 'express';
import { dataStore } from '../services/dataStore';

export const getAmbulances = (_req: Request, res: Response) => {
  res.json({ success: true, data: dataStore.getAmbulances() });
};

export const updateAmbulanceStatus = (req: Request, res: Response) => {
  const updated = dataStore.updateAmbulance(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Ambulance not found' });
  res.json({ success: true, data: updated });
};

export const getRescueTeams = (_req: Request, res: Response) => {
  res.json({ success: true, data: dataStore.getRescueTeams() });
};

export const updateRescueTeamStatus = (req: Request, res: Response) => {
  const updated = dataStore.updateRescueTeam(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Rescue team not found' });
  res.json({ success: true, data: updated });
};

export const getHospitals = (_req: Request, res: Response) => {
  res.json({ success: true, data: dataStore.getHospitals() });
};

export const updateHospitalStatus = (req: Request, res: Response) => {
  const updated = dataStore.updateHospital(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Hospital not found' });
  res.json({ success: true, data: updated });
};

export const getShelters = (_req: Request, res: Response) => {
  res.json({ success: true, data: dataStore.getShelters() });
};

export const updateShelterStatus = (req: Request, res: Response) => {
  const updated = dataStore.updateShelter(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Shelter not found' });
  res.json({ success: true, data: updated });
};

export const getRoads = (_req: Request, res: Response) => {
  res.json({ success: true, data: dataStore.getRoads() });
};

export const updateRoadStatus = (req: Request, res: Response) => {
  const updated = dataStore.updateRoad(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Road not found' });
  res.json({ success: true, data: updated });
};

export const getAlerts = (_req: Request, res: Response) => {
  res.json({ success: true, data: dataStore.getAlerts() });
};

export const createAlert = (req: Request, res: Response) => {
  const newAlert = dataStore.addAlert(req.body);
  res.status(201).json({ success: true, data: newAlert });
};

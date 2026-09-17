import { Router } from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
} from '../controllers/incidentsController';
import {
  getAmbulances,
  updateAmbulanceStatus,
  getRescueTeams,
  updateRescueTeamStatus,
  getHospitals,
  updateHospitalStatus,
  getShelters,
  updateShelterStatus,
  getRoads,
  updateRoadStatus,
  getAlerts,
  createAlert,
} from '../controllers/resourcesController';
import {
  runWorkflowForIncident,
  analyzeEmergencyImage,
} from '../controllers/agentsController';
import {
  startSimulation,
  triggerWorseSituation,
  resetSimulation,
} from '../controllers/simulationController';
import {
  approvePlan,
  modifyPlan,
  rejectPlan,
} from '../controllers/responseController';
import { geminiService } from '../services/geminiService';

const router = Router();

// Health and System Status
router.get('/status', (_req, res) => {
  res.json({
    status: 'OPERATIONAL',
    name: 'ResQAI Multi-Agent Coordination Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    aiProvider: geminiService.isAvailable() ? 'Google Gemini 3.8 Flash (Active)' : 'Deterministic Heuristic Fallback (Active)',
  });
});

// Incidents
router.get('/incidents', getIncidents);
router.post('/incidents', createIncident);
router.get('/incidents/:id', getIncidentById);
router.patch('/incidents/:id', updateIncident);

// Resources
router.get('/ambulances', getAmbulances);
router.patch('/ambulances/:id', updateAmbulanceStatus);

router.get('/rescue-teams', getRescueTeams);
router.patch('/rescue-teams/:id', updateRescueTeamStatus);

router.get('/hospitals', getHospitals);
router.patch('/hospitals/:id', updateHospitalStatus);

router.get('/shelters', getShelters);
router.patch('/shelters/:id', updateShelterStatus);

router.get('/roads', getRoads);
router.patch('/roads/:id', updateRoadStatus);

router.get('/alerts', getAlerts);
router.post('/alerts', createAlert);

// Multi-Agent Execution
router.post('/agents/run-workflow', runWorkflowForIncident);
router.post('/agents/analyze-image', analyzeEmergencyImage);

// Simulation & Failure Testing
router.post('/simulation/start', startSimulation);
router.post('/simulation/worse', triggerWorseSituation);
router.post('/simulation/reset', resetSimulation);

// Human-In-The-Loop Approval
router.post('/response/approve', approvePlan);
router.post('/response/modify', modifyPlan);
router.post('/response/reject', rejectPlan);

export default router;

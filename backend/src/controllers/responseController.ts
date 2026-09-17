import { Request, Response } from 'express';
import { dataStore } from '../services/dataStore';

export const approvePlan = (req: Request, res: Response) => {
  const { incidentId, approvedBy = 'Command Operator (ID #402)', comments } = req.body;
  const incident = dataStore.getIncidentById(incidentId);

  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }

  const plan = incident.responsePlan;
  if (!plan) {
    return res.status(400).json({ success: false, error: 'No plan generated for this incident yet' });
  }

  // 1. Update resource statuses to EN_ROUTE / BUSY
  if (plan.ambulanceAssignments) {
    for (const assignment of plan.ambulanceAssignments) {
      dataStore.updateAmbulance(assignment.ambulanceId, {
        status: 'EN_ROUTE',
        assignedIncidentId: incident.id,
      });
    }
  }

  if (plan.rescueAssignments) {
    for (const assignment of plan.rescueAssignments) {
      dataStore.updateRescueTeam(assignment.teamId, {
        status: 'BUSY',
        assignedIncidentId: incident.id,
      });
    }
  }

  // 2. Decrement hospital emergency and ICU beds
  if (plan.hospitalAssignments) {
    for (const hosp of plan.hospitalAssignments) {
      const existing = dataStore.getHospitalById(hosp.hospitalId);
      if (existing) {
        dataStore.updateHospital(hosp.hospitalId, {
          emergencyBedsAvailable: Math.max(0, existing.emergencyBedsAvailable - (hosp.emergencyBedsReserved || 1)),
          icuBedsAvailable: Math.max(0, existing.icuBedsAvailable - (hosp.icuBedsReserved || 0)),
          currentOccupancy: Math.min(100, existing.currentOccupancy + 4),
        });
      }
    }
  }

  // 3. Update shelter occupancy if evacuation plan active
  if (plan.evacuationPlan) {
    for (const evac of plan.evacuationPlan) {
      const existingShelter = dataStore.getShelterById(evac.shelterId);
      if (existingShelter) {
        const newOccupancy = existingShelter.occupied + (evac.peopleCount || 0);
        dataStore.updateShelter(evac.shelterId, {
          occupied: newOccupancy,
          remainingCapacity: Math.max(0, existingShelter.totalCapacity - newOccupancy),
          status: newOccupancy >= existingShelter.totalCapacity * 0.9 ? 'NEAR_CAPACITY' : 'OPEN',
        });
      }
    }
  }

  // 4. Update incident status
  const updatedPlan = {
    ...plan,
    approvalStatus: 'APPROVED',
    approvedBy,
    approvedAt: new Date().toISOString(),
    operatorComments: comments || 'Authorized full operational mobilization.',
  };

  const updatedIncident = dataStore.updateIncident(incident.id, {
    status: 'RESOURCES_DISPATCHED',
    approvalStatus: 'APPROVED',
    responsePlan: updatedPlan,
  });

  // 5. Add alert
  dataStore.addAlert({
    type: 'RESOLVED',
    title: `Response Plan Approved: ${incident.title}`,
    message: `Plan authorized by ${approvedBy}. Dispatched ${plan.ambulanceAssignments?.length || 1} ambulance(s) and tactical rescue units.`,
    incidentId: incident.id,
  });

  res.json({
    success: true,
    data: updatedIncident,
    message: 'Response plan officially approved and broadcast to all field units.',
  });
};

export const modifyPlan = (req: Request, res: Response) => {
  const { incidentId, modifiedActions, modifiedAmbulances, comments } = req.body;
  const incident = dataStore.getIncidentById(incidentId);
  if (!incident) return res.status(404).json({ success: false, error: 'Incident not found' });

  const plan = incident.responsePlan || {};
  const updatedPlan = {
    ...plan,
    actions: modifiedActions || plan.actions,
    ambulanceAssignments: modifiedAmbulances || plan.ambulanceAssignments,
    approvalStatus: 'MODIFIED',
    modifiedAt: new Date().toISOString(),
    operatorComments: comments || 'Adjusted resource count per on-scene commander discretion.',
  };

  const updatedIncident = dataStore.updateIncident(incident.id, {
    approvalStatus: 'MODIFIED',
    responsePlan: updatedPlan,
  });

  res.json({ success: true, data: updatedIncident });
};

export const rejectPlan = (req: Request, res: Response) => {
  const { incidentId, reason = 'Operator rejected proposed allocation' } = req.body;
  const incident = dataStore.getIncidentById(incidentId);
  if (!incident) return res.status(404).json({ success: false, error: 'Incident not found' });

  const updatedPlan = {
    ...(incident.responsePlan || {}),
    approvalStatus: 'REJECTED',
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason,
  };

  const updatedIncident = dataStore.updateIncident(incident.id, {
    approvalStatus: 'REJECTED',
    responsePlan: updatedPlan,
  });

  dataStore.addAlert({
    type: 'WARNING',
    title: `Response Plan Rejected: ${incident.title}`,
    message: `Operator rejected plan: ${reason}. Manual intervention required.`,
    incidentId: incident.id,
  });

  res.json({ success: true, data: updatedIncident });
};

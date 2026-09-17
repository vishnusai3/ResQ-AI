import { Request, Response } from 'express';
import { dataStore } from '../services/dataStore';
import { runIncidentWorkflow } from '../orchestrator';
import { geminiService } from '../services/geminiService';

export const runWorkflowForIncident = async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.body;
    let incident = dataStore.getIncidentById(incidentId);
    if (!incident) {
      if (req.body.incident) {
        incident = dataStore.createIncident(req.body.incident);
      } else {
        return res.status(404).json({ success: false, error: 'Incident not found' });
      }
    }

    const workflow = await runIncidentWorkflow(incident);
    res.json({ success: true, data: workflow });
  } catch (err: any) {
    console.error('Workflow execution error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Workflow execution error' });
  }
};

export const analyzeEmergencyImage = async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'imageBase64 is required' });
    }

    const analysis = await geminiService.analyzeImage(imageBase64, mimeType || 'image/jpeg');
    res.json({ success: true, data: analysis });
  } catch (err: any) {
    console.error('Image analysis error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Image analysis failed' });
  }
};

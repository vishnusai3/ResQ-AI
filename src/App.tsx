import React, { useState, useEffect, useCallback } from 'react';
import {
  Incident,
  Ambulance,
  Hospital,
  RescueTeam,
  Shelter,
  Road,
  Alert,
  AgentActivityStep,
  UnifiedResponsePlan,
  Coordinates,
  ResourceStatus,
} from './types';
import { api } from './services/api';
import { TopNav } from './components/TopNav';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { IncidentCreationModal } from './components/IncidentCreationModal';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { SimulationPage } from './pages/SimulationPage';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('command-center');

  // Core Emergency Data
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Active Focus & AI Orchestration State
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<AgentActivityStep[]>([]);
  const [activePlan, setActivePlan] = useState<UnifiedResponsePlan | null>(null);
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);
  const [aiProviderName, setAiProviderName] = useState('Gemini 3.8 Flash (Active)');

  // Modals & Map Interaction
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pickedCoordinates, setPickedCoordinates] = useState<Coordinates | null>(null);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoBannerMessage, setDemoBannerMessage] = useState<string | null>(null);
  const [isLiveDemoOpen, setIsLiveDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(1);
  const [worseDisruptionOccurred, setWorseDisruptionOccurred] = useState(false);
  const [replannedPlan, setReplannedPlan] = useState<UnifiedResponsePlan | null>(null);
  const [isReplanning, setIsReplanning] = useState(false);

  // Initial Data Fetch
  const loadAllData = useCallback(async () => {
    try {
      const [
        incidentsData,
        ambulancesData,
        hospitalsData,
        rescueData,
        sheltersData,
        roadsData,
        alertsData,
        statusData,
      ] = await Promise.all([
        api.getIncidents(),
        api.getAmbulances(),
        api.getHospitals(),
        api.getRescueTeams(),
        api.getShelters(),
        api.getRoads(),
        api.getAlerts(),
        api.getStatus().catch(() => ({ aiProvider: 'Active Engine' })),
      ]);

      setIncidents(incidentsData);
      setAmbulances(ambulancesData);
      setHospitals(hospitalsData);
      setRescueTeams(rescueData);
      setShelters(sheltersData);
      setRoads(roadsData);
      setAlerts(alertsData);

      if (statusData?.aiProvider) {
        setAiProviderName(statusData.aiProvider);
      }

      // Default focus on first critical or active incident if not set
      if (!selectedIncident && incidentsData.length > 0) {
        const priority = incidentsData.find((i) => i.severity === 'CRITICAL') || incidentsData[0];
        setSelectedIncident(priority);
        if (priority.responsePlan) {
          setActivePlan(priority.responsePlan);
        }
      }
    } catch (err) {
      console.error('Failed to load initial disaster coordination data:', err);
    }
  }, [selectedIncident]);

  useEffect(() => {
    loadAllData();
  }, []);

  // Trigger Multi-Agent Orchestration for an Incident
  const handleTriggerWorkflow = async (incidentId: string) => {
    setIsExecutingWorkflow(true);
    try {
      const result = await api.runWorkflow(incidentId);
      if (result) {
        setTimeline(result.timeline || []);
        setActivePlan(result.plan || null);
        if (result.incident) {
          setSelectedIncident(result.incident);
        }
        await loadAllData();
      }
    } catch (err) {
      console.error('Workflow trigger failed:', err);
    } finally {
      setIsExecutingWorkflow(false);
    }
  };

  // Select incident from queue or map
  const handleSelectIncident = (inc: Incident) => {
    setSelectedIncident(inc);
    if (inc.responsePlan) {
      setActivePlan(inc.responsePlan);
    } else {
      // Auto run workflow if none exists
      handleTriggerWorkflow(inc.id);
    }
  };

  // Map Click coordinate pin
  const handleSelectCoordinates = (coords: Coordinates) => {
    setPickedCoordinates(coords);
  };

  // Human in the loop: Approve Plan
  const handleApprovePlan = async (incidentId: string, comments?: string) => {
    try {
      const updatedIncident = await api.approvePlan(
        incidentId,
        'Command Operator (ID #402)',
        comments
      );
      if (updatedIncident) {
        setSelectedIncident(updatedIncident);
        setActivePlan(updatedIncident.responsePlan || null);
        await loadAllData();
      }
    } catch (err) {
      console.error('Failed to approve plan:', err);
    }
  };

  // Human in the loop: Modify Plan
  const handleModifyPlan = async (incidentId: string) => {
    try {
      const updatedIncident = await api.modifyPlan(
        incidentId,
        undefined,
        'Operator modified resource assignments for additional rescue support.'
      );
      if (updatedIncident) {
        setSelectedIncident(updatedIncident);
        setActivePlan(updatedIncident.responsePlan || null);
        await loadAllData();
      }
    } catch (err) {
      console.error('Failed to modify plan:', err);
    }
  };

  // Human in the loop: Reject Plan
  const handleRejectPlan = async (incidentId: string, reason?: string) => {
    try {
      const updatedIncident = await api.rejectPlan(incidentId, reason);
      if (updatedIncident) {
        setSelectedIncident(updatedIncident);
        setActivePlan(updatedIncident.responsePlan || null);
        await loadAllData();
      }
    } catch (err) {
      console.error('Failed to reject plan:', err);
    }
  };

  // Create Incident Submit Handler
  const handleCreateIncident = async (incidentData: any) => {
    try {
      const res = await api.createIncident(incidentData);
      await loadAllData();
      if (res && res.data) {
        setSelectedIncident(res.data);
        if (res.workflow) {
          setTimeline(res.workflow.timeline || []);
          setActivePlan(res.workflow.plan || null);
        }
      }
      setActiveTab('command-center');
    } catch (err) {
      console.error('Failed to create incident:', err);
    }
  };

  // Update Ambulance Status Override
  const handleUpdateAmbulanceStatus = async (id: string, status: ResourceStatus) => {
    try {
      await api.updateAmbulance(id, { status });
      await loadAllData();
    } catch (err) {
      console.error('Failed to update ambulance:', err);
    }
  };

  // Update Rescue Team Status Override
  const handleUpdateRescueTeamStatus = async (id: string, status: ResourceStatus) => {
    try {
      await api.updateRescueTeam(id, { status });
      await loadAllData();
    } catch (err) {
      console.error('Failed to update rescue team:', err);
    }
  };

  // Trigger Scenario from Simulation
  const handleStartScenario = async (scenario: string) => {
    setIsExecutingWorkflow(true);
    try {
      const res = await api.startSimulation(scenario);
      await loadAllData();
      if (res && res.incident) {
        setSelectedIncident(res.incident);
        if (res.workflow) {
          setTimeline(res.workflow.timeline || []);
          setActivePlan(res.workflow.plan || null);
        }
      }
      setActiveTab('command-center');
    } catch (err) {
      console.error('Failed to start scenario:', err);
    } finally {
      setIsExecutingWorkflow(false);
    }
  };

  // Dynamic Failure Injector: "Make Situation Worse"
  const handleTriggerWorse = async () => {
    setIsExecutingWorkflow(true);
    try {
      const res = await api.triggerWorseSituation(selectedIncident?.id);
      await loadAllData();
      if (res && res.incident) {
        setSelectedIncident(res.incident);
        if (res.replannedWorkflow) {
          setTimeline(res.replannedWorkflow.timeline || []);
          setActivePlan(res.replannedWorkflow.plan || null);
        }
      }
      setDemoBannerMessage(
        '⚡ CASCADE FAILURE INJECTED: Road blocked & primary ambulance disabled. Multi-agents recalculated dynamic detour and alternative medical facility!'
      );
      setTimeout(() => setDemoBannerMessage(null), 8000);
      setActiveTab('command-center');
    } catch (err) {
      console.error('Failed to trigger worse situation:', err);
    } finally {
      setIsExecutingWorkflow(false);
    }
  };

  // Reset Simulation
  const handleResetSimulation = async () => {
    try {
      await api.resetSimulation();
      setSelectedIncident(null);
      setActivePlan(null);
      setTimeline([]);
      await loadAllData();
      setDemoBannerMessage('🔄 All incidents, fleets, and roadblocks reset to baseline simulation state.');
      setTimeout(() => setDemoBannerMessage(null), 4000);
    } catch (err) {
      console.error('Failed to reset simulation:', err);
    }
  };

  // Live Demo Handlers (3-Minute Hackathon Demonstration)
  const handleRunLiveDemo = async () => {
    setActiveTab('command-center');
    setIsLiveDemoOpen(true);
    setDemoStep(1);
    setWorseDisruptionOccurred(false);
    setReplannedPlan(null);
    setIsExecutingWorkflow(true);

    try {
      // Step 1: Start Kukatpally Cloudburst & Inundation
      const res = await api.startSimulation('flood');
      await loadAllData();
      if (res?.incident) {
        setSelectedIncident(res.incident);
        if (res.workflow) {
          setTimeline(res.workflow.timeline || []);
          setActivePlan(res.workflow.plan || null);
        }
      }
    } catch (err) {
      console.error('Demo start error:', err);
    } finally {
      setIsExecutingWorkflow(false);
    }
  };

  const handleLiveDemoApprove = async () => {
    if (!selectedIncident) return;
    try {
      const updatedIncident = await api.approvePlan(
        selectedIncident.id,
        'Command Operator (ID #402)',
        'Approved full tactical dispatch per Step 10.'
      );
      if (updatedIncident) {
        setSelectedIncident(updatedIncident);
        setActivePlan(updatedIncident.responsePlan || null);
      }
      await loadAllData();
      setDemoStep(11);
    } catch (err) {
      console.error('Demo approve error:', err);
    }
  };

  const handleLiveDemoMakeWorse = async () => {
    if (!selectedIncident) return;
    setWorseDisruptionOccurred(true);
    setIsReplanning(true);
    try {
      const res = await api.triggerWorseSituation(selectedIncident.id);
      await loadAllData();
      if (res && res.incident) {
        setSelectedIncident(res.incident);
        if (res.replannedWorkflow) {
          setTimeline(res.replannedWorkflow.timeline || []);
          setActivePlan(res.replannedWorkflow.plan || null);
          setReplannedPlan(res.replannedWorkflow.plan || null);
        }
      }
    } catch (err) {
      console.error('Demo make worse error:', err);
    } finally {
      setIsReplanning(false);
    }
  };

  const handleLiveDemoReset = async () => {
    try {
      await api.resetSimulation();
      setDemoStep(1);
      setWorseDisruptionOccurred(false);
      setReplannedPlan(null);
      setIsReplanning(false);
      const res = await api.startSimulation('flood');
      await loadAllData();
      if (res?.incident) {
        setSelectedIncident(res.incident);
        if (res.workflow) {
          setTimeline(res.workflow.timeline || []);
          setActivePlan(res.workflow.plan || null);
        }
      }
    } catch (err) {
      console.error('Demo reset error:', err);
    }
  };

  // Counts for top navigation
  const activeIncidentsCount = incidents.filter((i) => i.status !== 'RESOLVED').length;
  const availableAmbulancesCount = ambulances.filter((a) => a.status === 'AVAILABLE').length;
  const availableRescueTeamsCount = rescueTeams.filter((r) => r.status === 'AVAILABLE').length;
  const availableIcuBedsCount = hospitals.reduce((acc, h) => acc + (h.icuBedsAvailable || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Navigation */}
      <TopNav
        activeIncidentsCount={activeIncidentsCount}
        availableAmbulancesCount={availableAmbulancesCount}
        availableRescueTeamsCount={availableRescueTeamsCount}
        availableIcuBedsCount={availableIcuBedsCount}
        alerts={alerts}
        onOpenCreateIncident={() => setIsCreateModalOpen(true)}
        onRunDemo={handleRunLiveDemo}
        onMakeSituationWorse={handleTriggerWorse}
        onResetSimulation={handleResetSimulation}
        isDemoRunning={isDemoRunning}
        aiProviderName={aiProviderName}
      />

      {/* Live Demo Banner Announcement */}
      {demoBannerMessage && (
        <div className="bg-gradient-to-r from-rose-900/90 via-amber-900/90 to-rose-900/90 border-b border-rose-500/50 px-4 py-2 text-center text-xs font-mono font-bold text-white shadow-lg animate-pulse flex items-center justify-center gap-2">
          <span>{demoBannerMessage}</span>
        </div>
      )}

      {/* Main Workspace Body: Sidebar + Active Page */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeIncidentsCount={activeIncidentsCount}
        />

        {/* Center Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activeTab === 'command-center' && (
            <CommandCenterPage
              incidents={incidents}
              ambulances={ambulances}
              hospitals={hospitals}
              rescueTeams={rescueTeams}
              shelters={shelters}
              roads={roads}
              selectedIncident={selectedIncident}
              onSelectIncident={handleSelectIncident}
              timeline={timeline}
              activePlan={activePlan}
              onApprovePlan={handleApprovePlan}
              onModifyPlan={handleModifyPlan}
              onRejectPlan={handleRejectPlan}
              onSelectCoordinates={handleSelectCoordinates}
              onTriggerIncidentWorkflow={handleTriggerWorkflow}
              onOpenCreateIncident={() => setIsCreateModalOpen(true)}
              isExecutingWorkflow={isExecutingWorkflow}
              providerNote={aiProviderName}
              isLiveDemoOpen={isLiveDemoOpen}
              demoStep={demoStep}
              onSetDemoStep={setDemoStep}
              isReplanning={isReplanning}
              worseDisruptionOccurred={worseDisruptionOccurred}
              replannedPlan={replannedPlan}
              onLiveDemoApprove={handleLiveDemoApprove}
              onLiveDemoMakeWorse={handleLiveDemoMakeWorse}
              onLiveDemoReset={handleLiveDemoReset}
              onCloseLiveDemo={() => setIsLiveDemoOpen(false)}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentsPage
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onRunWorkflow={handleTriggerWorkflow}
              onOpenCreate={() => setIsCreateModalOpen(true)}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesPage
              ambulances={ambulances}
              rescueTeams={rescueTeams}
              hospitals={hospitals}
              shelters={shelters}
              onUpdateAmbulanceStatus={handleUpdateAmbulanceStatus}
              onUpdateRescueTeamStatus={handleUpdateRescueTeamStatus}
            />
          )}

          {activeTab === 'simulation' && (
            <SimulationPage
              currentIncident={selectedIncident}
              activePlan={activePlan}
              timeline={timeline}
              onStartScenario={handleStartScenario}
              onTriggerWorse={handleTriggerWorse}
              onResetSimulation={handleResetSimulation}
              isProcessing={isExecutingWorkflow || isDemoRunning}
            />
          )}
        </main>
      </div>

      {/* Incident Creation Modal with Multimodal Image Upload */}
      <IncidentCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateIncident}
        pickedCoordinates={pickedCoordinates}
      />
    </div>
  );
}

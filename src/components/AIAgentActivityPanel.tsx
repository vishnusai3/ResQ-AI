import React, { useState } from 'react';
import { AgentActivityStep } from '../types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  RefreshCw,
  Wrench,
  Bot,
} from 'lucide-react';

interface AIAgentActivityPanelProps {
  timeline: AgentActivityStep[];
  isExecuting?: boolean;
  providerNote?: string;
  onReplayWorkflow?: () => void;
}

interface CanonicalAgentConfig {
  key: string;
  name: string;
  matchKeyword: string;
  defaultFallbackResult: string;
}

const CANONICAL_AGENTS: CanonicalAgentConfig[] = [
  { key: 'analysis', name: 'Incident Analysis', matchKeyword: 'Incident', defaultFallbackResult: 'Verified hazard classification & geospatial bounds' },
  { key: 'risk', name: 'Risk Assessment', matchKeyword: 'Risk', defaultFallbackResult: 'CRITICAL — 100 people at risk' },
  { key: 'resource', name: 'Resource Allocation', matchKeyword: 'Resource', defaultFallbackResult: '2 ambulances + 1 rescue team selected' },
  { key: 'medical', name: 'Medical Coordination', matchKeyword: 'Medical', defaultFallbackResult: 'Continental Hospital ER & ICU beds reserved' },
  { key: 'route', name: 'Route Optimization', matchKeyword: 'Route', defaultFallbackResult: 'Active detour via NH-65 / Gachibowli corridor' },
  { key: 'shelter', name: 'Shelter Planning', matchKeyword: 'Shelter', defaultFallbackResult: 'Kukatpally Relief Center designated for evacuees' },
  { key: 'communication', name: 'Communication', matchKeyword: 'Communication', defaultFallbackResult: 'Public emergency SMS & responder radio alerted' },
  { key: 'coordinator', name: 'Response Coordinator', matchKeyword: 'Coordinator', defaultFallbackResult: 'Unified action plan synthesized for operator approval' },
];

export const AIAgentActivityPanel: React.FC<AIAgentActivityPanelProps> = ({
  timeline,
  isExecuting = false,
  providerNote = 'Gemini 3.8 Flash Active',
  onReplayWorkflow,
}) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Match each canonical agent to actual step in timeline if available
  const agentItems = CANONICAL_AGENTS.map((canonical, index) => {
    const matchingStep = (timeline || []).find((s) =>
      s?.agentName && canonical?.matchKeyword
        ? s.agentName.toLowerCase().includes(canonical.matchKeyword.toLowerCase())
        : false
    );

    let status: 'completed' | 'running' | 'idle' | 'warning' | 'failed' = 'idle';
    let resultText = canonical.defaultFallbackResult;
    let stepDetails: AgentActivityStep | undefined = undefined;

    if (matchingStep) {
      status = matchingStep.status;
      stepDetails = matchingStep;
      resultText = matchingStep.decision || matchingStep.summary || canonical.defaultFallbackResult;
      // Strip out overly verbose prefix if any
      if (resultText.length > 80) {
        resultText = resultText.slice(0, 77) + '...';
      }
    } else if (isExecuting) {
      // Find current running index
      const completedCount = timeline.filter((t) => t.status === 'completed').length;
      if (index === completedCount) {
        status = 'running';
        resultText = 'Executing analysis & tool evaluations...';
      } else if (index < completedCount) {
        status = 'completed';
      } else {
        status = 'idle';
        resultText = 'Queued in execution sequence';
      }
    } else if (timeline.length > 0) {
      status = 'completed';
    }

    return {
      ...canonical,
      status,
      resultText,
      stepDetails,
    };
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span>AI RESPONSE STATUS</span>
              {isExecuting && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {providerNote}
          </span>
          {onReplayWorkflow && (
            <button
              onClick={onReplayWorkflow}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Re-run AI workflow"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Compact Vertical Timeline */}
      <div className="p-2 flex-1 overflow-y-auto space-y-1">
        {agentItems.map((agent) => {
          const isExpanded = expandedKey === agent.key;
          const isRunning = agent.status === 'running';
          const isCompleted = agent.status === 'completed';
          const isWarning = agent.status === 'warning';
          const isFailed = agent.status === 'failed';

          return (
            <div
              key={agent.key}
              className={`rounded-lg border transition-all text-xs ${
                isRunning
                  ? 'border-rose-500/50 bg-rose-950/20'
                  : isExpanded
                  ? 'border-slate-700 bg-slate-950/80'
                  : 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-950/70'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedKey(isExpanded ? null : agent.key)}
                className="w-full p-2 text-left flex items-start gap-2 select-none"
              >
                {/* Status Indicator */}
                <div className="mt-0.5 shrink-0">
                  {isCompleted && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {isRunning && (
                    <Clock className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                  )}
                  {isWarning && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  {isFailed && (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  )}
                  {agent.status === 'idle' && (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-600 block" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs font-mono">
                      {agent.name}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans truncate mt-0.5">
                    {agent.resultText}
                  </p>
                </div>
              </button>

              {/* Progressive Disclosure: Expanded Reasoning & Tools */}
              {isExpanded && (
                <div className="px-3 pb-2.5 pt-1 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1.5 bg-slate-950/90 rounded-b-lg">
                  {agent.stepDetails?.summary && (
                    <p className="text-slate-300 font-sans leading-relaxed">
                      {agent.stepDetails.summary}
                    </p>
                  )}

                  {agent.stepDetails?.toolsCalled && agent.stepDetails.toolsCalled.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-slate-500 flex items-center gap-1 text-[10px]">
                        <Wrench className="w-3 h-3 text-cyan-400" /> Tools:
                      </span>
                      {agent.stepDetails.toolsCalled.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40"
                        >
                          {tool.toolName}()
                        </span>
                      ))}
                    </div>
                  )}

                  {agent.stepDetails?.durationMs !== undefined && (
                    <div className="text-[10px] text-slate-500 pt-0.5">
                      Execution latency: {agent.stepDetails.durationMs}ms
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

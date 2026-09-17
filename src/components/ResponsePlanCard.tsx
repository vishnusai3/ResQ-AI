import React, { useState } from 'react';
import { UnifiedResponsePlan } from '../types';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  ShieldCheck,
  Ambulance,
  Building2,
  Home,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Radio,
  Check,
} from 'lucide-react';

interface ResponsePlanCardProps {
  plan: UnifiedResponsePlan | null;
  onApprove: (incidentId: string, comments?: string) => Promise<void>;
  onModify: (incidentId: string) => void;
  onReject: (incidentId: string, reason?: string) => Promise<void>;
  isProcessing?: boolean;
}

export const ResponsePlanCard: React.FC<ResponsePlanCardProps> = ({
  plan,
  onApprove,
  onModify,
  onReject,
  isProcessing = false,
}) => {
  const [showSecondaryDetails, setShowSecondaryDetails] = useState(false);

  if (!plan) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-500 shadow-md">
        <ShieldCheck className="w-7 h-7 mx-auto mb-1.5 text-slate-600" />
        <p className="text-xs font-semibold text-slate-400">No Active Response Plan</p>
        <p className="text-[11px] text-slate-500">
          Select or trigger an emergency above to synthesize an AI response plan.
        </p>
      </div>
    );
  }

  const isApproved = plan.approvalStatus === 'APPROVED';
  const isRejected = plan.approvalStatus === 'REJECTED';
  const isModified = plan.approvalStatus === 'MODIFIED';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center font-mono font-bold text-xs">
            AIR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                AI RECOMMENDED RESPONSE
              </h3>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  plan.priority === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                {plan.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Approval status indicator */}
        <div>
          {isApproved ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> RESPONSE APPROVED & DISPATCHED
            </span>
          ) : isRejected ? (
            <span className="px-2.5 py-1 rounded-full bg-rose-950 border border-rose-500/50 text-rose-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> REJECTED BY OPERATOR
            </span>
          ) : isModified ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-950 border border-amber-500/50 text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> MODIFIED BY OPERATOR
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              AWAITING OPERATOR APPROVAL
            </span>
          )}
        </div>
      </div>

      {/* Primary Key Action List */}
      <div className="p-4 space-y-2">
        {plan.actions.map((act, index) => (
          <div
            key={index}
            className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-100 mr-2">
                  {act.action}
                </span>
                <span className="text-[11px] text-slate-400 block sm:inline">
                  {act.reason}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                {act.resource}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                  isApproved
                    ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-700'
                    : 'text-amber-400 bg-amber-950/60 border border-amber-700'
                }`}
              >
                {isApproved ? 'DISPATCHED' : 'PENDING'}
              </span>
            </div>
          </div>
        ))}

        {/* Progressive Disclosure Toggle for Secondary Details */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowSecondaryDetails(!showSecondaryDetails)}
            className="text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            {showSecondaryDetails ? (
              <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>
              {showSecondaryDetails
                ? 'Hide Secondary Assignments & Radio Broadcasts'
                : 'Reveal Hospital ICU Allocations, Shelter Logistics & Radio Broadcasts'}
            </span>
          </button>
        </div>

        {/* Secondary Details Section (Revealed on demand) */}
        {showSecondaryDetails && (
          <div className="pt-2 space-y-3 border-t border-slate-800/60">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Ambulance Fleet */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-[11px] mb-1.5">
                  <Ambulance className="w-3.5 h-3.5" />
                  <span>Ambulance Assignments</span>
                </div>
                {plan.ambulanceAssignments.map((a, i) => (
                  <div key={i} className="text-slate-300 text-[11px] space-y-0.5">
                    <div className="font-semibold text-white">{a.callSign} ({a.capability})</div>
                    <div className="text-slate-400">ETA: {a.etaMinutes} mins • {a.destinationHospital}</div>
                  </div>
                ))}
              </div>

              {/* Hospital */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-sky-400 font-mono font-bold text-[11px] mb-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Hospital Reservations</span>
                </div>
                {plan.hospitalAssignments.map((h, i) => (
                  <div key={i} className="text-slate-300 text-[11px] space-y-0.5">
                    <div className="font-semibold text-white">{h.name}</div>
                    <div className="text-slate-400">ER Reserved: {h.emergencyBedsReserved} | ICU: {h.icuBedsReserved}</div>
                  </div>
                ))}
              </div>

              {/* Shelter */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-purple-400 font-mono font-bold text-[11px] mb-1.5">
                  <Home className="w-3.5 h-3.5" />
                  <span>Evacuation Shelter</span>
                </div>
                {plan.evacuationPlan.map((s, i) => (
                  <div key={i} className="text-slate-300 text-[11px] space-y-0.5">
                    <div className="font-semibold text-white">{s.shelterName}</div>
                    <div className="text-slate-400">{s.peopleCount} civilians • Status: {s.status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Broadcasts */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-mono text-rose-400 font-bold block mb-0.5">
                  PUBLIC CELL BROADCAST:
                </span>
                <p className="text-slate-300 text-[11px] leading-snug">
                  "{plan.citizenMessage}"
                </p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-0.5">
                  RESPONDER VHF RADIO:
                </span>
                <p className="text-slate-300 text-[11px] leading-snug">
                  "{plan.responderMessage}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prominent Action Bar at Bottom */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Human-in-the-Loop Protocol</span>
        </div>

        {!isApproved ? (
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="btn-reject-plan"
              onClick={() => onReject(plan.incidentId, 'Operator rejected suggested allocation')}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
              REJECT
            </button>

            <button
              id="btn-modify-plan"
              onClick={() => onModify(plan.incidentId)}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
              MODIFY
            </button>

            {/* STANDOUT PRIMARY ACTION */}
            <button
              id="btn-approve-plan"
              onClick={() => onApprove(plan.incidentId)}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-bold font-mono tracking-wider bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 border border-emerald-400/60 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'AUTHORIZING...' : 'APPROVE RESPONSE'}</span>
            </button>
          </div>
        ) : (
          <div className="text-xs font-mono text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tactical units dispatched • Authorized by {plan.approvedBy || 'Command Operator'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

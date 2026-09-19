import React, { useState } from "react";
import { History, ShieldCheck, Search, Filter, Hash, User, Calendar, FileText } from "lucide-react";
import { PhaseVerificationProject, AuditLogEntry } from "../types";

interface AuditTrailViewProps {
  project: PhaseVerificationProject;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ project }) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const logs = project.auditLogs || [];

  const filteredLogs = logs.filter((log) => {
    const matchQuery =
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.phaseName.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || log.type === typeFilter;
    return matchQuery && matchType;
  });

  const getTypeBadge = (type: AuditLogEntry["type"]) => {
    switch (type) {
      case "criteria":
        return { label: "Criteria", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
      case "artifact":
        return { label: "Artifact", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      case "vote":
        return { label: "Committee Vote", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      case "gate_status":
        return { label: "Gate Clearance", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
      case "ai_audit":
        return { label: "AI Audit", bg: "bg-teal-500/10 text-teal-400 border-teal-500/20" };
      default:
        return { label: "System", bg: "bg-slate-800 text-slate-400 border-slate-700" };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Audit & Verification Event Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tamper-evident chronological timeline of all verification activities, criteria approvals, artifact registrations, and committee votes.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search logs by actor, action, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Event Types</option>
              <option value="criteria">Criteria Verification</option>
              <option value="artifact">Artifact Registration</option>
              <option value="vote">Committee Vote</option>
              <option value="gate_status">Gate Transition</option>
              <option value="ai_audit">AI Audits</option>
              <option value="system">System Events</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800">
            <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-semibold">No audit events recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">Actions in the verification matrix and committee votes will log here automatically.</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const badge = getTypeBadge(log.type);
            return (
              <div
                key={log.id || index}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-white">{log.action}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {log.phaseName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{log.details}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <strong className="text-slate-300">{log.actor}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[10px] font-mono text-emerald-500/80 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    SEALED & HASHED
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

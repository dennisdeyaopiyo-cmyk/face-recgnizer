import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  ChevronRight,
  Award,
  Sparkles,
  FileCheck,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { PhaseVerificationProject, ProjectPhase } from "../types";
import { calculatePhaseMetrics } from "../lib/verificationUtils";

interface ProjectOverviewProps {
  project: PhaseVerificationProject;
  activePhaseIndex: number;
  onSelectPhase: (index: number) => void;
  onOpenCertificate: (phase: ProjectPhase) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  activePhaseIndex,
  onSelectPhase,
  onOpenCertificate,
}) => {
  const currentPhase = project.phases[activePhaseIndex] || project.phases[0];
  const metrics = calculatePhaseMetrics(currentPhase);

  // Overall project completion
  const totalGates = project.phases.length;
  const approvedGates = project.phases.filter((p) => p.status === "approved").length;
  const overallPercentage = Math.round((approvedGates / totalGates) * 100);

  const getStatusBadge = (status: ProjectPhase["status"]) => {
    switch (status) {
      case "approved":
        return {
          label: "Approved & Sealed",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case "ready_for_review":
        return {
          label: "Ready for Gate Review",
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          icon: <Award className="w-3.5 h-3.5 animate-pulse" />,
        };
      case "conditional_approval":
        return {
          label: "Conditional Approval",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      case "in_progress":
        return {
          label: "Active Verification",
          bg: "bg-teal-500/10 text-teal-400 border-teal-500/30",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case "rejected":
        return {
          label: "Rework Required",
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      case "locked":
      default:
        return {
          label: "Locked Phase",
          bg: "bg-slate-800 text-slate-400 border-slate-700",
          icon: <Lock className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 pb-6 pt-5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Project Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">{project.title}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {project.code}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                {project.domain}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              {project.description}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
              <span>Standard: <strong className="text-slate-200">{project.standard}</strong></span>
              <span>•</span>
              <span>Lead Verifier: <strong className="text-slate-200">{project.leadEngineer}</strong></span>
              <span>•</span>
              <span>Last Audit: <strong className="text-slate-200">{new Date(project.updatedAt).toLocaleDateString()}</strong></span>
            </div>
          </div>

          {/* Quick Metrics Badge Group */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Lifecycle Pass Rate</div>
                <div className="text-lg font-bold text-white">
                  {approvedGates} / {totalGates} Gates ({overallPercentage}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Phase Stepper Pipeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
            <span>STAGE-GATE VERIFICATION PIPELINE</span>
            <span>Click any gate to inspect verification matrix</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {project.phases.map((phase, idx) => {
              const isActive = idx === activePhaseIndex;
              const statusInfo = getStatusBadge(phase.status);
              const phaseMetric = calculatePhaseMetrics(phase);

              return (
                <div
                  key={phase.id}
                  id={`gate-step-${idx}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectPhase(idx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectPhase(idx);
                    }
                  }}
                  className={`text-left relative p-3.5 rounded-xl border transition-all flex flex-col justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    isActive
                      ? "bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  {/* Active Indicator Top Bar */}
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-t-xl" />
                  )}

                  <div>
                    {/* Gate code and status icon */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-slate-300 group-hover:text-emerald-400 transition-colors">
                        {phase.gateCode}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}
                      >
                        {statusInfo.icon}
                        <span className="hidden xl:inline">{statusInfo.label}</span>
                      </span>
                    </div>

                    {/* Phase Name */}
                    <h3 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-emerald-200">
                      {phase.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {phase.stageName}
                    </p>
                  </div>

                  {/* Progress bar and Certificate Badge */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex-1 mr-2">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{phaseMetric.passed}/{phaseMetric.total} items</span>
                        <span className="font-medium text-slate-300">{phaseMetric.completionRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            phase.status === "approved"
                              ? "bg-emerald-500"
                              : phase.status === "ready_for_review"
                              ? "bg-blue-500"
                              : "bg-teal-500"
                          }`}
                          style={{ width: `${phaseMetric.completionRate}%` }}
                        />
                      </div>
                    </div>

                    {phase.certificate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCertificate(phase);
                        }}
                        title="View Digital Verification Certificate"
                        className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

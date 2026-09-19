import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Printer,
  FileText,
  Layers,
} from "lucide-react";
import { ProjectPhase, AIAuditResult } from "../types";

interface AIAuditModalProps {
  projectTitle: string;
  projectDomain: string;
  phase: ProjectPhase;
  onClose: () => void;
}

export const AIAuditModal: React.FC<AIAuditModalProps> = ({
  projectTitle,
  projectDomain,
  phase,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<AIAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/verify/ai-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseName: phase.name,
          projectType: projectDomain,
          standard: "Stage-Gate Systems Engineering V&V",
          criteria: phase.criteria,
          artifacts: phase.artifacts,
          notes: `Gate Code: ${phase.gateCode}, Status: ${phase.status}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Audit execution failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to contact verification server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, [phase.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportReport = () => {
    if (!result) return;
    const reportText = `# PHASE GATE VERIFICATION AUDIT REPORT
Project: ${projectTitle}
Domain: ${projectDomain}
Phase: ${phase.name} (${phase.gateCode})
Date: ${new Date().toISOString()}

Compliance Readiness Score: ${result.score}/100
Gate Verification Status: ${result.status}

## Executive Summary
${result.auditSummary}

## Readiness Recommendation
${result.readinessStatement}

## Gap Analysis & Missing Evidence
${result.gapAnalysis}

## Findings & Severity
${result.findings?.map((f) => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`).join("\n")}

## Recommended Actions
${result.recommendations?.map((r, i) => `${i + 1}. ${r}`).join("\n")}
`;

    const blob = new Blob([reportText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AI_Audit_Report_${phase.gateCode}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">AI Phase Gate Verification Audit</h3>
              <p className="text-xs text-slate-400">
                {projectTitle} • {phase.name} ({phase.gateCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-teal-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">Synthesizing Phase Verification Evidence...</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Analyzing criteria checklist, evidence artifacts, test logs, and compliance standards via Gemini.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
              <p className="font-semibold">Audit Error</p>
              <p>{error}</p>
            </div>
          ) : result ? (
            <>
              {/* Scorecard & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xl">
                    {result.score}%
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Compliance Readiness</div>
                    <div className="text-xs font-semibold text-white">
                      {result.score >= 85 ? "Gate Ready" : "Remediation Needed"}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 col-span-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Audit Verdict</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      {result.status.replace("_", " ")}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      result.status === "APPROVED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : result.status === "CONDITIONAL_APPROVAL"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Executive Summary</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{result.auditSummary}</p>
              </div>

              {/* Readiness Statement */}
              <div className="bg-teal-950/30 p-4 rounded-xl border border-teal-500/30 space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Gate Review Readiness Statement
                </h4>
                <p className="text-xs text-teal-200/90 leading-relaxed">{result.readinessStatement}</p>
              </div>

              {/* Gap Analysis */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Verification Gap Analysis
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">{result.gapAnalysis}</p>
              </div>

              {/* Findings List */}
              {result.findings && result.findings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Compliance & Evidence Findings ({result.findings.length})
                  </h4>
                  <div className="space-y-2">
                    {result.findings.map((f, i) => (
                      <div
                        key={i}
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{f.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              f.severity === "critical"
                                ? "bg-rose-500/10 text-rose-400"
                                : f.severity === "high"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-blue-500/10 text-blue-400"
                            }`}
                          >
                            {f.severity}
                          </span>
                        </div>
                        <p className="text-slate-400">{f.description}</p>
                        {f.recommendation && (
                          <p className="text-teal-400/90 text-[11px]">
                            <strong>Remediation: </strong> {f.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Actionable Recommendations
                  </h4>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    {result.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={runAudit}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Re-run Audit</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              disabled={!result}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Markdown</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

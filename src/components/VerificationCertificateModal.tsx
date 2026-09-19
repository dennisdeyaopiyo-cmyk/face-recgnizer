import React from "react";
import { Award, ShieldCheck, Download, Printer, CheckCircle, QrCode, Lock, Hash } from "lucide-react";
import { ProjectPhase } from "../types";

interface VerificationCertificateModalProps {
  projectTitle: string;
  projectDomain: string;
  standard: string;
  phase: ProjectPhase;
  onClose: () => void;
}

export const VerificationCertificateModal: React.FC<VerificationCertificateModalProps> = ({
  projectTitle,
  projectDomain,
  standard,
  phase,
  onClose,
}) => {
  const cert = phase.certificate;

  if (!cert) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(cert, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Phase_Certificate_${cert.certId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Digital Phase Verification Certificate</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-slate-950 border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-inner">
            {/* Background Seal Watermark */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 text-emerald-500/5 pointer-events-none">
              <ShieldCheck className="w-full h-full" />
            </div>

            {/* Header / Authority */}
            <div className="text-center space-y-1 border-b border-slate-800 pb-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-2">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                SYSTEMS VERIFICATION & QUALITY GOVERNANCE BOARD
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                Phase Gate Clearance Certificate
              </h2>
              <p className="text-xs text-slate-400 font-mono">Certificate ID: {cert.certId}</p>
            </div>

            {/* Project & Phase Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Project Name</span>
                <p className="font-bold text-white text-sm">{projectTitle}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Domain / Standard</span>
                <p className="font-semibold text-slate-300">{standard}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Verified Phase Gate</span>
                <p className="font-bold text-emerald-400 text-sm">
                  {cert.gateCode} — {cert.phaseName}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Issued Timestamp</span>
                <p className="font-mono text-slate-300">{new Date(cert.issuedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Compliance Matrix Score */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Compliance Score: {cert.complianceScore}%</div>
                <p className="text-[11px] text-slate-400">
                  {cert.criteriaPassed} of {cert.criteriaTotal} mandatory verification criteria passed
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                STATUS: {cert.status}
              </div>
            </div>

            {/* Remarks */}
            <div className="text-xs text-slate-300 italic bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
              "{cert.remarks}"
            </div>

            {/* Signatories Ledger */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Authorized Signatories & Digital Signatures
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cert.signatories.map((sig, i) => (
                  <div key={i} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <div className="font-bold text-white">{sig.name}</div>
                    <div className="text-[10px] text-slate-400">{sig.role}</div>
                    <div className="text-[9px] font-mono text-emerald-400/80 mt-1">Signed: {sig.signedAt}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Integrity Seal */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <div className="flex items-center gap-1.5 truncate max-w-sm">
                <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{cert.verificationHash}</span>
              </div>
              <span className="shrink-0 text-emerald-500 font-semibold">VERIFIED TAMPER-EVIDENT</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/60">
          <button
            onClick={handleDownloadJSON}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

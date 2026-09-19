import React, { useState, useRef } from "react";
import {
  ShieldCheck,
  Zap,
  FolderGit2,
  Plus,
  Download,
  Upload,
  Sparkles,
  History,
  FileCheck2,
  ChevronDown,
  Layers,
  Scan,
  Users,
} from "lucide-react";
import { PhaseVerificationProject } from "../types";

interface HeaderProps {
  projects: PhaseVerificationProject[];
  activeProject: PhaseVerificationProject;
  activeView: "stage_gate" | "three_phase" | "face_scanner" | "face_directory" | "audit_trail";
  faceCount: number;
  onSelectProject: (projectId: string) => void;
  onChangeView: (view: "stage_gate" | "three_phase" | "face_scanner" | "face_directory" | "audit_trail") => void;
  onOpenNewProject: () => void;
  onOpenAIAudit: () => void;
  onExportProject: () => void;
  onImportProject: (importedData: PhaseVerificationProject) => void;
  onOpenEnrollModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  activeProject,
  activeView,
  faceCount,
  onSelectProject,
  onChangeView,
  onOpenNewProject,
  onOpenAIAudit,
  onExportProject,
  onImportProject,
  onOpenEnrollModal,
}) => {
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.id && parsed.phases) {
          onImportProject(parsed);
        } else {
          alert("Invalid project format. Please provide a valid Phase Verification project JSON.");
        }
      } catch (err) {
        alert("Failed to parse project file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 text-slate-950">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">PhaseVerify</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  V&V Platform
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Stage-Gate Lifecycle & Face Biometrics
              </p>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="hidden lg:flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              id="view-tab-stage-gate"
              onClick={() => onChangeView("stage_gate")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === "stage_gate"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Layers className="w-4 h-4" />
              Stage-Gate
            </button>

            <button
              id="view-tab-face-scanner"
              onClick={() => onChangeView("face_scanner")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === "face_scanner"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Scan className="w-4 h-4 text-cyan-400" />
              Face ID Scanner
            </button>

            <button
              id="view-tab-face-directory"
              onClick={() => onChangeView("face_directory")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === "face_directory"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              Faces Ledger ({faceCount}/100)
            </button>

            <button
              id="view-tab-three-phase"
              onClick={() => onChangeView("three_phase")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === "three_phase"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              3-Phase Analyzer
            </button>

            <button
              id="view-tab-audit-trail"
              onClick={() => onChangeView("audit_trail")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === "audit_trail"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <History className="w-4 h-4" />
              Audit Trail ({activeProject.auditLogs?.length || 0})
            </button>
          </div>

          {/* Project Switcher & Quick Actions */}
          <div className="flex items-center gap-2.5">
            {/* AI Auditor Button */}
            <button
              id="btn-ai-audit-trigger"
              onClick={onOpenAIAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>AI Gate Audit</span>
            </button>

            {/* Project Selector Dropdown */}
            <div className="relative">
              <button
                id="btn-project-dropdown"
                onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="max-w-[140px] truncate text-slate-100 font-semibold">{activeProject.title}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {projectMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Active Projects ({projects.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {projects.map((proj) => (
                      <button
                        key={proj.id}
                        onClick={() => {
                          onSelectProject(proj.id);
                          setProjectMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                          proj.id === activeProject.id ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-slate-300"
                        }`}
                      >
                        <div className="truncate mr-2">
                          <p className="truncate font-semibold">{proj.title}</p>
                          <p className="text-[10px] text-slate-500">{proj.domain}</p>
                        </div>
                        {proj.id === activeProject.id && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-800 mt-1 pt-1 px-2 space-y-1">
                    <button
                      onClick={() => {
                        onOpenNewProject();
                        setProjectMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Verification Project
                    </button>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 px-1">
                      <button
                        onClick={onExportProject}
                        title="Export current project data as JSON"
                        className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 py-1"
                      >
                        <Download className="w-3 h-3" />
                        Export JSON
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        title="Import project from JSON file"
                        className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 py-1"
                      >
                        <Upload className="w-3 h-3" />
                        Import JSON
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-slate-800 text-[11px] overflow-x-auto gap-1">
          <button
            onClick={() => onChangeView("stage_gate")}
            className={`flex items-center gap-1 py-1 px-2 rounded font-medium whitespace-nowrap ${
              activeView === "stage_gate" ? "text-emerald-400 bg-emerald-950/60" : "text-slate-400"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Stage-Gate
          </button>
          <button
            onClick={() => onChangeView("face_scanner")}
            className={`flex items-center gap-1 py-1 px-2 rounded font-medium whitespace-nowrap ${
              activeView === "face_scanner" ? "text-blue-400 bg-blue-950/60" : "text-slate-400"
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            Face ID
          </button>
          <button
            onClick={() => onChangeView("face_directory")}
            className={`flex items-center gap-1 py-1 px-2 rounded font-medium whitespace-nowrap ${
              activeView === "face_directory" ? "text-blue-400 bg-blue-950/60" : "text-slate-400"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Faces ({faceCount})
          </button>
          <button
            onClick={() => onChangeView("three_phase")}
            className={`flex items-center gap-1 py-1 px-2 rounded font-medium whitespace-nowrap ${
              activeView === "three_phase" ? "text-amber-400 bg-amber-950/60" : "text-slate-400"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            3-Phase
          </button>
          <button
            onClick={() => onChangeView("audit_trail")}
            className={`flex items-center gap-1 py-1 px-2 rounded font-medium whitespace-nowrap ${
              activeView === "audit_trail" ? "text-slate-200 bg-slate-800" : "text-slate-400"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit
          </button>
        </div>
      </div>
    </header>
  );
};


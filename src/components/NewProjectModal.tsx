import React, { useState } from "react";
import { Plus, Sparkles, FolderGit2, ShieldCheck, Cpu, HeartPulse, Zap, Cloud, Layers } from "lucide-react";
import { PhaseVerificationProject, ProjectDomain } from "../types";

interface NewProjectModalProps {
  onClose: () => void;
  onCreateProject: (project: PhaseVerificationProject) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onCreateProject }) => {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [domain, setDomain] = useState<ProjectDomain>("Automotive ASPICE / ISO 26262");
  const [standard, setStandard] = useState("ISO 26262 ASIL-D & ASPICE");
  const [description, setDescription] = useState("");
  const [leadEngineer, setLeadEngineer] = useState("Lead Systems Architect");

  const domainTemplates = [
    {
      domain: "Automotive ASPICE / ISO 26262" as ProjectDomain,
      standard: "ISO 26262 ASIL-D & ASPICE Level 3",
      icon: <Cpu className="w-4 h-4 text-blue-400" />,
      desc: "EV powertrain, ADAS, Braking & Steering Stage-Gate V&V.",
    },
    {
      domain: "Medical Device ISO 13485 / FDA" as ProjectDomain,
      standard: "ISO 13485:2016, IEC 62304 Class C, ISO 14971",
      icon: <HeartPulse className="w-4 h-4 text-rose-400" />,
      desc: "Design History File (DHF), clinical usability & risk management.",
    },
    {
      domain: "Aerospace DO-178C / DO-254" as ProjectDomain,
      standard: "RTCA DO-178C DAL-A & DO-254 HW V&V",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      desc: "Avionics safety-critical hardware and airborne software verification.",
    },
    {
      domain: "Power Electronics & Energy Grid" as ProjectDomain,
      standard: "IEEE 1547-2018 / IEC 61850 / IEEE 519",
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      desc: "Grid inverters, solar/BESS converters & 3-phase synchrocheck.",
    },
    {
      domain: "Enterprise Software Release Gate" as ProjectDomain,
      standard: "SOC 2 Type II & Continuous Delivery Verification",
      icon: <Cloud className="w-4 h-4 text-purple-400" />,
      desc: "Multi-stage CI/CD deployment gates, security & canary verification.",
    },
  ];

  const handleSelectTemplate = (tpl: (typeof domainTemplates)[0]) => {
    setDomain(tpl.domain);
    setStandard(tpl.standard);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const projCode = code.trim() || `VER-${Math.floor(100 + Math.random() * 900)}`;

    const newProject: PhaseVerificationProject = {
      id: `proj-${Date.now()}`,
      title,
      code: projCode,
      domain,
      standard: standard || "Stage-Gate Verification Framework",
      description: description || "Verification project workspace.",
      leadEngineer: leadEngineer || "Principal Systems Verifier",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentPhaseIndex: 0,
      phases: [
        {
          id: `phase-0-${Date.now()}`,
          gateNumber: 0,
          gateCode: "G0-FEAS",
          name: "Feasibility & Requirements Definition",
          stageName: "Stage 0: Concept & Planning",
          description: "Initial scoping, stakeholder requirements, and technical risk assessment.",
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          status: "in_progress",
          gateLead: leadEngineer,
          criteria: [
            {
              id: `c-init-1-${Date.now()}`,
              title: "System Requirements Specification (SRS) Baseline",
              category: "Requirements",
              required: true,
              status: "pending",
              description: "All functional and non-functional requirements documented and approved.",
              acceptanceCriteria: "100% review sign-off with zero unclassified requirements.",
              verificationMethod: "Inspection",
              assignedTo: leadEngineer,
            },
            {
              id: `c-init-2-${Date.now()}`,
              title: "Initial Hazard & Safety Risk Analysis",
              category: "Safety & Risk",
              required: true,
              status: "pending",
              description: "Preliminary risk analysis and mitigation targets defined.",
              acceptanceCriteria: "FMEA/PHA baseline approved by Safety Lead.",
              verificationMethod: "Analysis",
              assignedTo: leadEngineer,
            },
          ],
          artifacts: [],
          committeeVotes: [],
        },
        {
          id: `phase-1-${Date.now()}`,
          gateNumber: 1,
          gateCode: "G1-PDR",
          name: "Preliminary Design & Architecture Review",
          stageName: "Stage 1: Architecture & Prototyping",
          description: "System architecture freeze, interface definitions, and bench prototyping.",
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          status: "locked",
          gateLead: leadEngineer,
          criteria: [
            {
              id: `c-init-3-${Date.now()}`,
              title: "Subsystem Interface Control Document (ICD)",
              category: "Design Verification",
              required: true,
              status: "pending",
              description: "Interface definitions across hardware, firmware, and mechanical layers.",
              acceptanceCriteria: "Signed ICD with verified pinouts and protocol schemas.",
              verificationMethod: "Inspection",
              assignedTo: leadEngineer,
            },
          ],
          artifacts: [],
          committeeVotes: [],
        },
        {
          id: `phase-2-${Date.now()}`,
          gateNumber: 2,
          gateCode: "G2-CDR",
          name: "Critical Design & Formal Verification (V&V)",
          stageName: "Stage 2: Critical Testing & Validation",
          description: "Full verification test matrix execution, environmental testing, and compliance certification.",
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          status: "locked",
          gateLead: leadEngineer,
          criteria: [
            {
              id: `c-init-4-${Date.now()}`,
              title: "Comprehensive Verification Test Matrix (VTM) Pass",
              category: "Testing & Validation",
              required: true,
              status: "pending",
              description: "Formal laboratory test execution against all quantified requirements.",
              acceptanceCriteria: "100% test cases executed with 0 critical non-conformances.",
              verificationMethod: "Test",
              assignedTo: leadEngineer,
            },
          ],
          artifacts: [],
          committeeVotes: [],
        },
        {
          id: `phase-3-${Date.now()}`,
          gateNumber: 3,
          gateCode: "G3-RELEASE",
          name: "Operational Release & Customer Acceptance",
          stageName: "Stage 3: Production & Delivery",
          description: "Final quality audit, production readiness, and commercial gate sign-off.",
          targetDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          status: "locked",
          gateLead: leadEngineer,
          criteria: [
            {
              id: `c-init-5-${Date.now()}`,
              title: "Final Gate Review Committee Sign-Off",
              category: "Governance & Sign-off",
              required: true,
              status: "pending",
              description: "Formal approval by all stakeholder directors and lead auditor.",
              acceptanceCriteria: "Unanimous committee approval recorded in ledger.",
              verificationMethod: "Inspection",
              assignedTo: leadEngineer,
            },
          ],
          artifacts: [],
          committeeVotes: [],
        },
      ],
      auditLogs: [
        {
          id: `log-init-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: leadEngineer,
          action: "Project Created",
          phaseName: "All Gates",
          details: `Created new Phase Verification project '${title}' under ${domain}.`,
          type: "system",
        },
      ],
    };

    onCreateProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-white">Create Phase Verification Project</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Industry Templates */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Select Verification Domain Template
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {domainTemplates.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectTemplate(t)}
                className={`text-left p-2.5 rounded-xl border transition-all text-xs flex items-start gap-2.5 ${
                  domain === t.domain
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="mt-0.5">{t.icon}</div>
                <div>
                  <div className="font-semibold text-white">{t.domain}</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Details */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Next-Gen 3-Phase Solar Inverter V&V"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Project Code</label>
              <input
                type="text"
                placeholder="e.g. PV-INV-2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Compliance Standard</label>
              <input
                type="text"
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Lead Verification Engineer</label>
              <input
                type="text"
                value={leadEngineer}
                onChange={(e) => setLeadEngineer(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Domain</label>
              <input
                type="text"
                disabled
                value={domain}
                className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Project Description & Scope</label>
            <textarea
              rows={2}
              placeholder="High-level engineering overview..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

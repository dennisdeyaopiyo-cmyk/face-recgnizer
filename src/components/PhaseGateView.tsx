import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Sparkles,
  Search,
  Filter,
  FileCheck2,
  Upload,
  UserCheck,
  Award,
  Hash,
  FileText,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldAlert,
  Send,
  MessageSquare,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  ProjectPhase,
  VerificationCriterion,
  VerificationArtifact,
  CommitteeVote,
  CriterionCategory,
  CriterionStatus,
  VerificationMethod,
} from "../types";
import { calculatePhaseMetrics, createVerificationCertificate, generateVerificationHash } from "../lib/verificationUtils";

interface PhaseGateViewProps {
  projectId: string;
  projectTitle: string;
  phase: ProjectPhase;
  onUpdatePhase: (updatedPhase: ProjectPhase) => void;
  onOpenCertificate: (phase: ProjectPhase) => void;
  onOpenAIAudit: () => void;
  onLogAudit: (action: string, details: string, type: "criteria" | "artifact" | "vote" | "gate_status") => void;
}

export const PhaseGateView: React.FC<PhaseGateViewProps> = ({
  projectId,
  projectTitle,
  phase,
  onUpdatePhase,
  onOpenCertificate,
  onOpenAIAudit,
  onLogAudit,
}) => {
  const [activeTab, setActiveTab] = useState<"criteria" | "artifacts" | "committee">("criteria");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // New Criterion Modal state
  const [showAddCriterionModal, setShowAddCriterionModal] = useState(false);
  const [newCritTitle, setNewCritTitle] = useState("");
  const [newCritCategory, setNewCritCategory] = useState<CriterionCategory>("Testing & Validation");
  const [newCritMethod, setNewCritMethod] = useState<VerificationMethod>("Test");
  const [newCritDescription, setNewCritDescription] = useState("");
  const [newCritAcceptance, setNewCritAcceptance] = useState("");
  const [newCritAssignee, setNewCritAssignee] = useState("");
  const [newCritRequired, setNewCritRequired] = useState(true);

  // New Artifact state
  const [showAddArtifactModal, setShowAddArtifactModal] = useState(false);
  const [artName, setArtName] = useState("");
  const [artType, setArtType] = useState<VerificationArtifact["type"]>("Test Protocol");
  const [artSize, setArtSize] = useState("4.2 MB");
  const [artDescription, setArtDescription] = useState("");

  // Committee Voting state
  const [reviewerName, setReviewerName] = useState("Dr. Elena Rostova");
  const [reviewerRole, setReviewerRole] = useState("Lead Quality & Systems Auditor");
  const [voteChoice, setVoteChoice] = useState<"Approve" | "Conditional" | "Reject">("Approve");
  const [voteComments, setVoteComments] = useState("");

  // AI Criteria generation loading
  const [isGeneratingCriteria, setIsGeneratingCriteria] = useState(false);

  const metrics = calculatePhaseMetrics(phase);

  // Filter criteria
  const filteredCriteria = phase.criteria.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.acceptanceCriteria.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || c.category === selectedCategory;
    const matchesStatus = selectedStatus === "ALL" || c.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Toggle criterion status
  const handleToggleStatus = (criterionId: string, newStatus: CriterionStatus) => {
    const updatedCriteria = phase.criteria.map((c) => {
      if (c.id === criterionId) {
        const verifiedBy = newStatus === "passed" ? reviewerName || "Lead Engineer" : undefined;
        const verifiedAt = newStatus === "passed" ? new Date().toISOString().split("T")[0] : undefined;
        return { ...c, status: newStatus, verifiedBy, verifiedAt };
      }
      return c;
    });

    const targetCrit = phase.criteria.find((c) => c.id === criterionId);
    onLogAudit(
      "Criterion Status Changed",
      `Changed '${targetCrit?.title}' status to '${newStatus}'.`,
      "criteria"
    );

    onUpdatePhase({ ...phase, criteria: updatedCriteria });
  };

  // Add custom criterion
  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCritTitle.trim()) return;

    const newCrit: VerificationCriterion = {
      id: `crit-${Date.now()}`,
      title: newCritTitle,
      category: newCritCategory,
      verificationMethod: newCritMethod,
      required: newCritRequired,
      status: "pending",
      description: newCritDescription || "Verification task.",
      acceptanceCriteria: newCritAcceptance || "Criteria must pass with zero critical deviations.",
      assignedTo: newCritAssignee || "Systems Team",
    };

    onLogAudit("Criterion Added", `Added new verification criterion '${newCritTitle}' in ${newCritCategory}.`, "criteria");
    onUpdatePhase({ ...phase, criteria: [...phase.criteria, newCrit] });

    setNewCritTitle("");
    setNewCritDescription("");
    setNewCritAcceptance("");
    setNewCritAssignee("");
    setShowAddCriterionModal(false);
  };

  // AI Criteria Generation
  const handleAIGenerateCriteria = async () => {
    setIsGeneratingCriteria(true);
    try {
      const response = await fetch("/api/verify/generate-criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseName: phase.name,
          domain: projectTitle,
          standard: "Stage-Gate Verification V&V",
          focusArea: phase.stageName,
        }),
      });
      const data = await response.json();
      if (data.success && data.criteria && data.criteria.length > 0) {
        const mapped = data.criteria.map((c: any) => ({
          id: c.id || `ai-crit-${Date.now()}-${Math.random()}`,
          title: c.name || c.title || "AI Verification Item",
          category: (c.category as CriterionCategory) || "Testing & Validation",
          required: c.required ?? true,
          status: "pending" as CriterionStatus,
          description: c.description || "Generated verification criterion.",
          acceptanceCriteria: c.acceptanceCriteria || "Pass verified per standard specification.",
          verificationMethod: "Test" as VerificationMethod,
          assignedTo: "Systems Verification Team",
        }));

        onLogAudit("AI Criteria Generated", `AI generated ${mapped.length} verification criteria for ${phase.name}.`, "criteria");
        onUpdatePhase({ ...phase, criteria: [...phase.criteria, ...mapped] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCriteria(false);
    }
  };

  // Add Artifact
  const handleAddArtifact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artName.trim()) return;

    const hash = generateVerificationHash(`${artName}-${Date.now()}`);
    const newArt: VerificationArtifact = {
      id: `art-${Date.now()}`,
      name: artName,
      type: artType,
      fileSize: artSize,
      status: "verified",
      hash,
      uploadedAt: new Date().toISOString().split("T")[0],
      verifiedBy: reviewerName || "Lead QA",
      description: artDescription || "Verification evidence document.",
    };

    onLogAudit("Artifact Uploaded", `Registered verification evidence '${artName}' with hash ${hash.substring(0, 16)}...`, "artifact");
    onUpdatePhase({ ...phase, artifacts: [...phase.artifacts, newArt] });

    setArtName("");
    setArtDescription("");
    setShowAddArtifactModal(false);
  };

  // Cast Committee Vote
  const handleCastVote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) return;

    const sig = `SIG-${reviewerName.toUpperCase().replace(/\s+/g, "-")}-${Date.now().toString(16)}`;
    const newVote: CommitteeVote = {
      id: `vote-${Date.now()}`,
      reviewerName,
      role: reviewerRole,
      vote: voteChoice,
      comments: voteComments || "Formal review completed.",
      timestamp: new Date().toISOString().split("T")[0],
      digitalSignature: sig,
    };

    onLogAudit(
      "Committee Vote Cast",
      `${reviewerName} voted '${voteChoice}' for ${phase.name}.`,
      "vote"
    );

    onUpdatePhase({
      ...phase,
      committeeVotes: [...(phase.committeeVotes || []), newVote],
    });

    setVoteComments("");
  };

  // Official Gate Approval & Certificate Seal
  const handleApproveAndSealGate = () => {
    const cert = createVerificationCertificate(projectId, projectTitle, phase, reviewerName);
    const updatedPhase: ProjectPhase = {
      ...phase,
      status: "approved",
      certificate: cert,
      signOffDate: new Date().toISOString().split("T")[0],
    };

    onLogAudit(
      "Gate Officially Approved",
      `Issued Verification Certificate ${cert.certId} with cryptographic seal ${cert.verificationHash.substring(0, 16)}...`,
      "gate_status"
    );

    onUpdatePhase(updatedPhase);

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#14b8a6"],
      });
    } catch (_) {}

    onOpenCertificate(updatedPhase);
  };

  const categories: CriterionCategory[] = [
    "Requirements",
    "Design Verification",
    "Testing & Validation",
    "Safety & Risk",
    "Compliance & Standards",
    "Governance & Sign-off",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Phase Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm px-3 py-1 rounded-lg bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                {phase.gateCode}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {phase.name}
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">{phase.description}</p>

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 flex-wrap">
              <span>Target Gate Review: <strong className="text-slate-200">{phase.targetDate}</strong></span>
              <span>•</span>
              <span>Gate Lead: <strong className="text-slate-200">{phase.gateLead}</strong></span>
              <span>•</span>
              <span>Status: <strong className="text-emerald-400 uppercase">{phase.status.replace("_", " ")}</strong></span>
            </div>
          </div>

          {/* Gate Action Center */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              id="btn-trigger-ai-audit"
              onClick={onOpenAIAudit}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Run AI Audit</span>
            </button>

            {phase.certificate ? (
              <button
                id="btn-view-certificate"
                onClick={() => onOpenCertificate(phase)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
              >
                <Award className="w-4 h-4" />
                <span>View Sealed Certificate</span>
              </button>
            ) : (
              <button
                id="btn-approve-seal-gate"
                onClick={handleApproveAndSealGate}
                disabled={metrics.mandatoryRemaining > 0 && false} // allow user to seal or conditional seal
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                  metrics.isGatePassable
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 cursor-pointer"
                    : "bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 cursor-pointer"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{metrics.isGatePassable ? "Authorize Gate & Seal Certificate" : "Issue Gate Pass (Manual Override)"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Phase Health Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Criteria Passed</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {metrics.passed} / {metrics.total}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{metrics.completionRate}% complete</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Mandatory Pending</div>
            <div className={`text-xl font-bold mt-0.5 ${metrics.mandatoryRemaining === 0 ? "text-emerald-400" : "text-amber-400"}`}>
              {metrics.mandatoryRemaining} items
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {metrics.mandatoryRemaining === 0 ? "All mandatory items met" : "Blocking gate advance"}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Artifacts & Protocols</div>
            <div className="text-xl font-bold text-blue-400 mt-0.5">
              {phase.artifacts.length} Docs
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">SHA-256 integrity verified</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Committee Votes</div>
            <div className="text-xl font-bold text-slate-200 mt-0.5">
              {phase.committeeVotes?.length || 0} Votes
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {phase.committeeVotes?.filter((v) => v.vote === "Approve").length || 0} approvals
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            id="tab-criteria-matrix"
            onClick={() => setActiveTab("criteria")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "criteria"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            Verification Criteria Matrix ({phase.criteria.length})
          </button>

          <button
            id="tab-artifacts-vault"
            onClick={() => setActiveTab("artifacts")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "artifacts"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Hash className="w-4 h-4" />
            Verification Evidence Vault ({phase.artifacts.length})
          </button>

          <button
            id="tab-committee-panel"
            onClick={() => setActiveTab("committee")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "committee"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Gate Review Committee ({phase.committeeVotes?.length || 0})
          </button>
        </div>
      </div>

      {/* TAB 1: VERIFICATION CRITERIA MATRIX */}
      {activeTab === "criteria" && (
        <div className="space-y-4">
          {/* Controls: Search, Filters, Add button, AI Generator */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5 flex-1 flex-wrap">
              {/* Search input */}
              <div className="relative min-w-[220px] flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search verification criteria, tests, specifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="passed">Passed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="waived">Waived</option>
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                id="btn-ai-generate-criteria"
                onClick={handleAIGenerateCriteria}
                disabled={isGeneratingCriteria}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 text-teal-400 ${isGeneratingCriteria ? "animate-spin" : ""}`} />
                <span>{isGeneratingCriteria ? "Synthesizing..." : "AI Generate Checklist"}</span>
              </button>

              <button
                id="btn-add-criterion"
                onClick={() => setShowAddCriterionModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Criterion</span>
              </button>
            </div>
          </div>

          {/* Criteria Cards Grid */}
          <div className="space-y-3">
            {filteredCriteria.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800">
                <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-300 font-semibold">No verification criteria found</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search filters or click "Add Criterion".</p>
              </div>
            ) : (
              filteredCriteria.map((item) => (
                <div
                  key={item.id}
                  id={`criterion-card-${item.id}`}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Main Criterion Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-white">{item.title}</span>
                        {item.required ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Mandatory Gate Item
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                            Optional / Informational
                          </span>
                        )}
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-blue-300 border border-blue-900/40">
                          Method: {item.verificationMethod}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                      <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-400 space-y-1">
                        <div>
                          <strong className="text-slate-200">Acceptance Rule: </strong>
                          {item.acceptanceCriteria}
                        </div>
                        {item.notes && (
                          <div className="text-teal-400/90 text-[11px]">
                            <strong>Audit Observation: </strong>
                            {item.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span>Assigned: <strong className="text-slate-300">{item.assignedTo}</strong></span>
                        {item.verifiedBy && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">
                              Verified by {item.verifiedBy} ({item.verifiedAt})
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Selectors */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                      <button
                        onClick={() => handleToggleStatus(item.id, "passed")}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          item.status === "passed"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-emerald-300 hover:bg-slate-900"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Pass
                      </button>

                      <button
                        onClick={() => handleToggleStatus(item.id, "in_progress")}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          item.status === "in_progress"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-blue-300 hover:bg-slate-900"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        In Progress
                      </button>

                      <button
                        onClick={() => handleToggleStatus(item.id, "failed")}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          item.status === "failed"
                            ? "bg-rose-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-rose-300 hover:bg-slate-900"
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Fail
                      </button>

                      <button
                        onClick={() => handleToggleStatus(item.id, "waived")}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          item.status === "waived"
                            ? "bg-slate-700 text-slate-200"
                            : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                        }`}
                      >
                        Waive
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICATION EVIDENCE VAULT */}
      {activeTab === "artifacts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Verification Evidence & Deliverables</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Register test logs, simulation results, FMEA matrices, and compliance sign-offs with SHA-256 integrity hashes.
              </p>
            </div>
            <button
              onClick={() => setShowAddArtifactModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Register Artifact</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {phase.artifacts.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-300 font-semibold">No artifacts registered yet</p>
                <p className="text-xs text-slate-500 mt-1">Upload and link test logs, schematics, or simulation output.</p>
              </div>
            ) : (
              phase.artifacts.map((art) => (
                <div
                  key={art.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-white truncate max-w-[260px]">{art.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{art.type}</span>
                          <span>•</span>
                          <span>{art.fileSize}</span>
                          <span>•</span>
                          <span>Uploaded: {art.uploadedAt}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {art.status}
                    </span>
                  </div>

                  {art.description && (
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      {art.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60 text-slate-400">
                    <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 truncate max-w-[260px]">
                      <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{art.hash}</span>
                    </div>
                    <span className="text-slate-400">Verifier: <strong className="text-slate-200">{art.verifiedBy}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GATE REVIEW COMMITTEE VOTING */}
      {activeTab === "committee" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cast Vote Form */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Cast Formal Gate Vote</h3>
            </div>
            <p className="text-xs text-slate-400">
              Submit your formal decision and recorded digital signature for this Phase Gate review.
            </p>

            <form onSubmit={handleCastVote} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reviewer Name</label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Committee Role</label>
                <input
                  type="text"
                  required
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gate Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVoteChoice("Approve")}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      voteChoice === "Approve"
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoteChoice("Conditional")}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      voteChoice === "Conditional"
                        ? "bg-amber-600 text-white border-amber-500 shadow-sm"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    Conditional
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoteChoice("Reject")}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      voteChoice === "Reject"
                        ? "bg-rose-600 text-white border-rose-500 shadow-sm"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reviewer Comments / Action Items</label>
                <textarea
                  rows={3}
                  value={voteComments}
                  onChange={(e) => setVoteComments(e.target.value)}
                  placeholder="State technical rationale, acceptance caveats, or verification notes..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Signed Vote</span>
              </button>
            </form>
          </div>

          {/* Recorded Votes Ledger */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-bold text-sm text-white">Recorded Gate Votes ({phase.committeeVotes?.length || 0})</h3>

            {(!phase.committeeVotes || phase.committeeVotes.length === 0) ? (
              <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800">
                <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-300 font-semibold">No committee votes submitted yet</p>
                <p className="text-xs text-slate-500 mt-1">Use the voting form on the left to cast gate votes.</p>
              </div>
            ) : (
              phase.committeeVotes.map((vote) => (
                <div
                  key={vote.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white">{vote.reviewerName}</h4>
                      <p className="text-[11px] text-slate-400">{vote.role}</p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        vote.vote === "Approve"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : vote.vote === "Conditional"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {vote.vote}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    "{vote.comments}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>Sig: {vote.digitalSignature || "SIG-AUTORUN"}</span>
                    <span>Date: {vote.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Criterion */}
      {showAddCriterionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Verification Criterion</h3>
              <button
                onClick={() => setShowAddCriterionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCriterion} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Criterion Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3-Phase THD Distortion < 2.0% at Rated Power"
                  value={newCritTitle}
                  onChange={(e) => setNewCritTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newCritCategory}
                    onChange={(e) => setNewCritCategory(e.target.value as CriterionCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Verification Method</label>
                  <select
                    value={newCritMethod}
                    onChange={(e) => setNewCritMethod(e.target.value as VerificationMethod)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Test">Test (Empirical Bench / Lab)</option>
                    <option value="Analysis">Analysis (Calculations / FMEA)</option>
                    <option value="Inspection">Inspection (Visual / Physical)</option>
                    <option value="Simulation">Simulation (FEA / MATLAB / HIL)</option>
                    <option value="Demonstration">Demonstration (Operational)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Detailed verification scope..."
                  value={newCritDescription}
                  onChange={(e) => setNewCritDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Acceptance Rule / Criteria</label>
                <input
                  type="text"
                  placeholder="Quantitative pass/fail threshold..."
                  value={newCritAcceptance}
                  onChange={(e) => setNewCritAcceptance(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assigned Lead</label>
                  <input
                    type="text"
                    placeholder="Engineer Name"
                    value={newCritAssignee}
                    onChange={(e) => setNewCritAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="chk-mandatory"
                    checked={newCritRequired}
                    onChange={(e) => setNewCritRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800"
                  />
                  <label htmlFor="chk-mandatory" className="font-semibold text-slate-300">
                    Mandatory Gate Requirement
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCriterionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Criterion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Artifact */}
      {showAddArtifactModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register Verification Artifact</h3>
              <button
                onClick={() => setShowAddArtifactModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddArtifact} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Artifact / Document Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inverter_3Phase_EMC_Radiated_Emission_Report.pdf"
                  value={artName}
                  onChange={(e) => setArtName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Artifact Type</label>
                  <select
                    value={artType}
                    onChange={(e) => setArtType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Test Protocol">Test Protocol</option>
                    <option value="Simulation Result">Simulation Result</option>
                    <option value="CAD / Schematic">CAD / Schematic</option>
                    <option value="FMEA Report">FMEA Report</option>
                    <option value="Certification">Certification / Standard Pass</option>
                    <option value="Code Coverage">Code Coverage / Static Analysis</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Simulated File Size</label>
                  <input
                    type="text"
                    value={artSize}
                    onChange={(e) => setArtSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Verification Summary / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key findings or test environment description..."
                  value={artDescription}
                  onChange={(e) => setArtDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddArtifactModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Register & Seal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

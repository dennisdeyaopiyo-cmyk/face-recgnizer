import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { ProjectOverview } from "./components/ProjectOverview";
import { PhaseGateView } from "./components/PhaseGateView";
import { ThreePhaseAnalyzer } from "./components/ThreePhaseAnalyzer";
import { AuditTrailView } from "./components/AuditTrailView";
import { FaceRecognitionScanner } from "./components/FaceRecognitionScanner";
import { FaceDirectoryView } from "./components/FaceDirectoryView";
import { FaceEnrollmentModal } from "./components/FaceEnrollmentModal";
import { AIAuditModal } from "./components/AIAuditModal";
import { VerificationCertificateModal } from "./components/VerificationCertificateModal";
import { NewProjectModal } from "./components/NewProjectModal";
import { DEFAULT_PROJECTS } from "./data/defaultProjects";
import { DEFAULT_FACES } from "./data/defaultFaces";
import { PhaseVerificationProject, ProjectPhase, FaceProfile } from "./types";

export default function App() {
  // Load initial projects from localStorage or default
  const [projects, setProjects] = useState<PhaseVerificationProject[]>(() => {
    const saved = localStorage.getItem("phase_verify_projects");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return DEFAULT_PROJECTS;
  });

  // Load registered Face Profiles (Capacity: up to 100 faces)
  const [faceProfiles, setFaceProfiles] = useState<FaceProfile[]>(() => {
    const savedFaces = localStorage.getItem("phase_verify_face_profiles");
    if (savedFaces) {
      try {
        const parsed = JSON.parse(savedFaces);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return DEFAULT_FACES;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return projects[0]?.id || "proj-aerodrive-800v";
  });

  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [activeView, setActiveView] = useState<
    "stage_gate" | "three_phase" | "face_scanner" | "face_directory" | "audit_trail"
  >("stage_gate");

  // Face Enrollment Modal state
  const [showFaceEnrollment, setShowFaceEnrollment] = useState<boolean>(false);
  const [enrollInitialImage, setEnrollInitialImage] = useState<string>("");
  const [enrollInitialSuggestedData, setEnrollInitialSuggestedData] = useState<{
    suggestedName?: string;
    suggestedRole?: string;
    notes?: string;
  }>({});
  const [selectedTestProfile, setSelectedTestProfile] = useState<FaceProfile | null>(null);

  // Other Modals state
  const [showAIAudit, setShowAIAudit] = useState<boolean>(false);
  const [showNewProject, setShowNewProject] = useState<boolean>(false);
  const [certificatePhase, setCertificatePhase] = useState<ProjectPhase | null>(null);

  // Save projects to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("phase_verify_projects", JSON.stringify(projects));
    } catch (_) {}
  }, [projects]);

  // Save face profiles to localStorage on change (up to 100 faces)
  useEffect(() => {
    try {
      localStorage.setItem("phase_verify_face_profiles", JSON.stringify(faceProfiles));
    } catch (_) {}
  }, [faceProfiles]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || DEFAULT_PROJECTS[0];
  const currentPhase = activeProject.phases[activePhaseIndex] || activeProject.phases[0];

  // Set safe phase index if switching projects
  useEffect(() => {
    if (activePhaseIndex >= activeProject.phases.length) {
      setActivePhaseIndex(0);
    }
  }, [activeProjectId, activeProject.phases.length]);

  // Update active phase
  const handleUpdatePhase = (updatedPhase: ProjectPhase) => {
    const updatedPhases = activeProject.phases.map((p) =>
      p.id === updatedPhase.id ? updatedPhase : p
    );

    const updatedProject: PhaseVerificationProject = {
      ...activeProject,
      phases: updatedPhases,
      updatedAt: new Date().toISOString(),
    };

    setProjects(projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
  };

  // Log an audit event
  const handleLogAudit = (
    action: string,
    details: string,
    type: "criteria" | "artifact" | "vote" | "gate_status" | "ai_audit" = "criteria"
  ) => {
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actor: activeProject.leadEngineer || "Lead Systems Verifier",
      action,
      phaseName: currentPhase?.name ? `${currentPhase.gateCode} (${currentPhase.name})` : "General",
      details,
      type,
    };

    const updatedProject: PhaseVerificationProject = {
      ...activeProject,
      auditLogs: [newLog, ...(activeProject.auditLogs || [])],
      updatedAt: new Date().toISOString(),
    };

    setProjects(projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
  };

  // Face Profile Management Handlers
  const handleEnrollFace = (newProfile: FaceProfile) => {
    if (faceProfiles.length >= 100) {
      alert("Maximum capacity of 100 registered faces reached. Please remove an existing profile first.");
      return;
    }
    const updated = [newProfile, ...faceProfiles];
    setFaceProfiles(updated);
    handleLogAudit(
      `Biometric Enrollment: ${newProfile.name}`,
      `Enrolled new verifier profile (${newProfile.badgeId}, ${newProfile.clearanceLevel}) into facial biometric registry. Total: ${updated.length}/100`,
      "ai_audit"
    );
  };

  const handleDeleteFace = (profileId: string) => {
    const profile = faceProfiles.find((f) => f.id === profileId);
    const updated = faceProfiles.filter((f) => f.id !== profileId);
    setFaceProfiles(updated);
    if (profile) {
      handleLogAudit(
        `Biometric Profile Revoked: ${profile.name}`,
        `Revoked facial biometric clearance for badge ${profile.badgeId}.`,
        "ai_audit"
      );
    }
  };

  const handleResetDefaultFaces = () => {
    setFaceProfiles(DEFAULT_FACES);
    handleLogAudit(
      "Biometric Ledger Reset",
      "Reset registered face profiles back to default 5 verified engineering leads.",
      "ai_audit"
    );
  };

  const handleImportFaces = (imported: FaceProfile[]) => {
    // Limit to 100
    const limited = imported.slice(0, 100);
    setFaceProfiles(limited);
    handleLogAudit(
      "Biometric Ledger Imported",
      `Imported ${limited.length} biometric face profiles into verified ledger.`,
      "ai_audit"
    );
  };

  const handleOpenEnrollWithCapturedImage = (
    imageData: string,
    suggestedData?: { suggestedName?: string; suggestedRole?: string; notes?: string }
  ) => {
    setEnrollInitialImage(imageData);
    setEnrollInitialSuggestedData(suggestedData || {});
    setShowFaceEnrollment(true);
  };

  const handleSelectForScannerTest = (profile: FaceProfile) => {
    setSelectedTestProfile(profile);
    setActiveView("face_scanner");
  };

  // Biometric Sign-off on Gate Review
  const handleVerifiedSignOff = (profile: FaceProfile) => {
    if (!currentPhase) return;

    // Check if committee vote already exists from this person or create one
    const newVote = {
      id: `vote-${Date.now()}-${profile.id}`,
      reviewerName: profile.name,
      role: `${profile.role} (${profile.clearanceLevel.split(":")[0]})`,
      vote: "Approve" as const,
      comments: `Biometrically authenticated via Face Scanner (Badge: ${profile.badgeId}, Accuracy: 99.4%). Verified all Gate ${currentPhase.gateCode} criteria.`,
      timestamp: new Date().toISOString(),
      digitalSignature: `SHA256-BIO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    };

    const updatedVotes = [...(currentPhase.committeeVotes || []), newVote];
    const updatedPhase: ProjectPhase = {
      ...currentPhase,
      committeeVotes: updatedVotes,
    };

    handleUpdatePhase(updatedPhase);
    handleLogAudit(
      `Biometric Gate Sign-off: ${profile.name}`,
      `Authorized Gate ${currentPhase.gateCode} approval via Face Recognition verification (${profile.badgeId}).`,
      "vote"
    );

    alert(`Biometric Sign-off Recorded!\n\n${profile.name} (${profile.badgeId}) has approved Gate ${currentPhase.gateCode} with digital biometric signature.`);
    setActiveView("stage_gate");
  };

  // Create new project
  const handleCreateProject = (newProject: PhaseVerificationProject) => {
    setProjects([newProject, ...projects]);
    setActiveProjectId(newProject.id);
    setActivePhaseIndex(0);
    setActiveView("stage_gate");
  };

  // Export current project as JSON file
  const handleExportProject = () => {
    const jsonStr = JSON.stringify(activeProject, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PhaseVerification_${activeProject.code || "Project"}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import project JSON
  const handleImportProject = (importedData: PhaseVerificationProject) => {
    setProjects([importedData, ...projects.filter((p) => p.id !== importedData.id)]);
    setActiveProjectId(importedData.id);
    setActivePhaseIndex(0);
    setActiveView("stage_gate");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Main Navigation Header */}
      <Header
        projects={projects}
        activeProject={activeProject}
        activeView={activeView}
        faceCount={faceProfiles.length}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          setActivePhaseIndex(0);
        }}
        onChangeView={setActiveView}
        onOpenNewProject={() => setShowNewProject(true)}
        onOpenAIAudit={() => setShowAIAudit(true)}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
        onOpenEnrollModal={() => handleOpenEnrollWithCapturedImage("")}
      />

      {/* Main View Router */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeView === "stage_gate" && (
          <div className="space-y-6">
            {/* Project Overview & Stepper */}
            <ProjectOverview
              project={activeProject}
              activePhaseIndex={activePhaseIndex}
              onSelectPhase={setActivePhaseIndex}
              onOpenCertificate={(phase) => setCertificatePhase(phase)}
            />

            {/* Selected Phase Gate Deep-Dive */}
            {currentPhase && (
              <PhaseGateView
                projectId={activeProject.id}
                projectTitle={activeProject.title}
                phase={currentPhase}
                onUpdatePhase={handleUpdatePhase}
                onOpenCertificate={(phase) => setCertificatePhase(phase)}
                onOpenAIAudit={() => setShowAIAudit(true)}
                onLogAudit={handleLogAudit}
              />
            )}
          </div>
        )}

        {activeView === "face_scanner" && (
          <FaceRecognitionScanner
            registeredFaces={faceProfiles}
            onOpenEnrollModalWithImage={handleOpenEnrollWithCapturedImage}
            onNavigateToDirectory={() => setActiveView("face_directory")}
            onVerifiedSignOff={handleVerifiedSignOff}
            selectedTestProfile={selectedTestProfile}
            onClearSelectedTestProfile={() => setSelectedTestProfile(null)}
          />
        )}

        {activeView === "face_directory" && (
          <FaceDirectoryView
            faces={faceProfiles}
            onOpenEnrollModal={() => handleOpenEnrollWithCapturedImage("")}
            onDeleteProfile={handleDeleteFace}
            onSelectForScannerTest={handleSelectForScannerTest}
            onResetToDefault={handleResetDefaultFaces}
            onImportFaces={handleImportFaces}
          />
        )}

        {activeView === "three_phase" && <ThreePhaseAnalyzer />}

        {activeView === "audit_trail" && <AuditTrailView project={activeProject} />}
      </main>

      {/* Footer info ribbon */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-4 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Phase Verification Platform v2.5 • Biometric Facial Recognition & Stage-Gate V&V</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-3">
            <span>Biometric Capacity: {faceProfiles.length}/100 Faces</span>
            <span>•</span>
            <span>Compliance: ISO 26262, ISO 13485, DO-178C, IEEE 1547</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showFaceEnrollment && (
        <FaceEnrollmentModal
          isOpen={showFaceEnrollment}
          onClose={() => setShowFaceEnrollment(false)}
          onEnroll={handleEnrollFace}
          currentFaceCount={faceProfiles.length}
          initialImageData={enrollInitialImage}
          initialSuggestedData={enrollInitialSuggestedData}
        />
      )}

      {showAIAudit && currentPhase && (
        <AIAuditModal
          projectTitle={activeProject.title}
          projectDomain={activeProject.domain}
          phase={currentPhase}
          onClose={() => setShowAIAudit(false)}
        />
      )}

      {certificatePhase && (
        <VerificationCertificateModal
          projectTitle={activeProject.title}
          projectDomain={activeProject.domain}
          standard={activeProject.standard}
          phase={certificatePhase}
          onClose={() => setCertificatePhase(null)}
        />
      )}

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreateProject={handleCreateProject}
        />
      )}
    </div>
  );
}

export type ProjectDomain =
  | "Automotive ASPICE / ISO 26262"
  | "Medical Device ISO 13485 / FDA"
  | "Aerospace DO-178C / DO-254"
  | "Power Electronics & Energy Grid"
  | "Enterprise Software Release Gate"
  | "Industrial Systems & EPC";

export type PhaseStatus =
  | "locked"
  | "in_progress"
  | "ready_for_review"
  | "conditional_approval"
  | "approved"
  | "rejected";

export type CriterionStatus = "passed" | "failed" | "in_progress" | "waived" | "pending";

export type VerificationMethod = "Test" | "Inspection" | "Analysis" | "Demonstration" | "Simulation";

export type CriterionCategory =
  | "Requirements"
  | "Design Verification"
  | "Testing & Validation"
  | "Safety & Risk"
  | "Compliance & Standards"
  | "Governance & Sign-off";

export interface VerificationCriterion {
  id: string;
  title: string;
  category: CriterionCategory;
  required: boolean;
  status: CriterionStatus;
  description: string;
  acceptanceCriteria: string;
  verificationMethod: VerificationMethod;
  assignedTo: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  evidenceRef?: string;
}

export interface VerificationArtifact {
  id: string;
  name: string;
  type: "Test Protocol" | "Simulation Result" | "CAD / Schematic" | "FMEA Report" | "Certification" | "Code Coverage";
  status: "verified" | "under_review" | "rejected";
  hash: string;
  fileSize: string;
  uploadedAt: string;
  verifiedBy: string;
  description?: string;
}

export interface CommitteeVote {
  id: string;
  reviewerName: string;
  role: string;
  vote: "Approve" | "Conditional" | "Reject" | "Pending";
  comments: string;
  timestamp?: string;
  digitalSignature?: string;
}

export interface VerificationCertificate {
  certId: string;
  projectId: string;
  projectTitle: string;
  phaseId: string;
  phaseName: string;
  gateCode: string;
  issuedAt: string;
  issuedBy: string;
  complianceScore: number;
  criteriaTotal: number;
  criteriaPassed: number;
  verificationHash: string;
  signatories: { name: string; role: string; signedAt: string }[];
  status: "VALID" | "CONDITIONAL" | "REVOKED";
  remarks: string;
}

export interface ProjectPhase {
  id: string;
  gateNumber: number;
  gateCode: string;
  name: string;
  stageName: string;
  description: string;
  targetDate: string;
  status: PhaseStatus;
  criteria: VerificationCriterion[];
  artifacts: VerificationArtifact[];
  committeeVotes: CommitteeVote[];
  certificate?: VerificationCertificate;
  signOffDate?: string;
  gateLead: string;
}

export interface PhaseVerificationProject {
  id: string;
  title: string;
  code: string;
  domain: ProjectDomain;
  standard: string;
  description: string;
  leadEngineer: string;
  createdAt: string;
  updatedAt: string;
  currentPhaseIndex: number;
  phases: ProjectPhase[];
  auditLogs: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  phaseName: string;
  details: string;
  type: "criteria" | "artifact" | "vote" | "gate_status" | "ai_audit" | "system";
}

export interface SinglePhaseReading {
  phase: "A" | "B" | "C";
  voltage: number; // Volts RMS
  current: number; // Amps RMS
  angle: number; // Degrees (-180 to 180)
  thd: number; // Total harmonic distortion %
  powerFactor: number;
  frequency: number; // Hz
}

export interface ThreePhaseSignalTelemetry {
  timestamp: string;
  phaseA: SinglePhaseReading;
  phaseB: SinglePhaseReading;
  phaseC: SinglePhaseReading;
  frequency: number;
  voltageImbalancePercent: number;
  currentImbalancePercent: number;
  sequence: "ABC_POSITIVE" | "ACB_NEGATIVE" | "ZERO_SEQUENCE" | "FAULT_CONDITION";
  neutralCurrent: number;
  activePowerTotalKW: number;
  reactivePowerTotalKVAR: number;
  apparentPowerTotalKVA: number;
  status: "NORMAL" | "WARNING" | "CRITICAL_TRIP";
  statusMessage: string;
}

export interface AIAuditResult {
  score: number;
  status: "APPROVED" | "CONDITIONAL_APPROVAL" | "REWORK_REQUIRED" | "BLOCKED";
  auditSummary: string;
  findings: {
    type: "compliance" | "risk" | "evidence" | "quality";
    severity: "low" | "medium" | "high" | "critical" | "info";
    title: string;
    description: string;
    recommendation?: string;
  }[];
  blockingIssues: string[];
  gapAnalysis: string;
  recommendations: string[];
  readinessStatement: string;
  isFallback?: boolean;
}

export type ClearanceLevel =
  | "Level 1: Standard Verifier"
  | "Level 2: Lead Systems Verifier"
  | "Level 3: Phase Gate Chair"
  | "Level 4: Quality & Safety Executive";

export interface FaceProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  badgeId: string;
  clearanceLevel: ClearanceLevel;
  email: string;
  phone?: string;
  certifications: string[];
  avatar: string; // Image URL or Base64 data URI
  registeredAt: string;
  lastRecognizedAt?: string;
  biometricNotes?: string;
  recognitionCount: number;
  verificationStats?: {
    gatesApproved: number;
    auditsSigned: number;
    accuracyScore: number;
  };
  featuresDescription?: string;
}

export interface FaceRecognitionResult {
  recognized: boolean;
  matchedProfileId?: string;
  matchedProfile?: FaceProfile;
  confidenceScore: number; // 0 - 100
  similarityReasoning: string;
  status: "RECOGNIZED_MATCH" | "NEW_FACE_UNREGISTERED" | "NO_FACE_DETECTED";
  detectedFacialFeatures?: {
    ageEstimate?: string;
    facialStructure?: string;
    expression?: string;
    hasGlasses?: boolean;
    lightingQuality?: string;
    uniqueLandmarks?: string[];
  };
  suggestedEnrollmentData?: {
    suggestedName?: string;
    suggestedRole?: string;
    notes?: string;
  };
}


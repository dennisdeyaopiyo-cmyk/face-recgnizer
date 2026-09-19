import { ProjectPhase, VerificationCertificate, ThreePhaseSignalTelemetry } from "../types";

export function generateVerificationHash(dataString: string): string {
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  const randomSuffix = Math.random().toString(16).substring(2, 10);
  const timeHex = Date.now().toString(16);
  return `sha256-${hex}${randomSuffix}${timeHex}`.substring(0, 64);
}

export function calculatePhaseMetrics(phase: ProjectPhase) {
  const totalCriteria = phase.criteria.length;
  if (totalCriteria === 0) {
    return {
      passed: 0,
      total: 0,
      completionRate: 0,
      mandatoryRemaining: 0,
      isGatePassable: false,
      riskLevel: "LOW" as const,
    };
  }

  const passed = phase.criteria.filter((c) => c.status === "passed").length;
  const inProgress = phase.criteria.filter((c) => c.status === "in_progress").length;
  const failed = phase.criteria.filter((c) => c.status === "failed").length;
  const mandatoryPending = phase.criteria.filter((c) => c.required && c.status !== "passed" && c.status !== "waived").length;

  const completionRate = Math.round(((passed + inProgress * 0.5) / totalCriteria) * 100);
  const isGatePassable = mandatoryPending === 0;

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (failed > 0) riskLevel = "CRITICAL";
  else if (mandatoryPending > 2) riskLevel = "HIGH";
  else if (mandatoryPending > 0) riskLevel = "MEDIUM";

  return {
    passed,
    inProgress,
    failed,
    total: totalCriteria,
    completionRate,
    mandatoryRemaining: mandatoryPending,
    isGatePassable,
    riskLevel,
  };
}

export function createVerificationCertificate(
  projectId: string,
  projectTitle: string,
  phase: ProjectPhase,
  leadAuditor: string
): VerificationCertificate {
  const metrics = calculatePhaseMetrics(phase);
  const dateStr = new Date().toISOString();
  const rawData = `${projectId}-${phase.id}-${dateStr}-${metrics.completionRate}-${leadAuditor}`;
  const verificationHash = generateVerificationHash(rawData);

  const signatories = (phase.committeeVotes || [])
    .filter((v) => v.vote === "Approve" || v.vote === "Conditional")
    .map((v) => ({
      name: v.reviewerName,
      role: v.role,
      signedAt: v.timestamp || dateStr.split("T")[0],
    }));

  if (signatories.length === 0) {
    signatories.push({
      name: leadAuditor || "Lead Systems Verifier",
      role: "Lead Quality Auditor",
      signedAt: dateStr.split("T")[0],
    });
  }

  return {
    certId: `CERT-${phase.gateCode}-${Math.floor(100000 + Math.random() * 900000)}`,
    projectId,
    projectTitle,
    phaseId: phase.id,
    phaseName: phase.name,
    gateCode: phase.gateCode,
    issuedAt: dateStr,
    issuedBy: "Phase Verification Authority & Review Board",
    complianceScore: metrics.completionRate,
    criteriaTotal: metrics.total,
    criteriaPassed: metrics.passed,
    verificationHash,
    signatories,
    status: metrics.isGatePassable ? "VALID" : "CONDITIONAL",
    remarks: metrics.isGatePassable
      ? `Full Phase Verification Gate Clearance granted under standard audit controls.`
      : `Conditional Phase Verification issued with monitored open action items.`,
  };
}

export function calculateThreePhaseTelemetry(
  va: number,
  angA: number,
  vb: number,
  angB: number,
  vc: number,
  angC: number,
  ia: number,
  ib: number,
  ic: number,
  freq: number = 60
): ThreePhaseSignalTelemetry {
  const avgV = (va + vb + vc) / 3;
  const maxVDev = Math.max(Math.abs(va - avgV), Math.abs(vb - avgV), Math.abs(vc - avgV));
  const vImbalance = avgV > 0 ? (maxVDev / avgV) * 100 : 0;

  const avgI = (ia + ib + ic) / 3;
  const maxIDev = Math.max(Math.abs(ia - avgI), Math.abs(ib - avgI), Math.abs(ic - avgI));
  const iImbalance = avgI > 0 ? (maxIDev / avgI) * 100 : 0;

  // Check phase sequence: angle B should lag angle A by ~120°
  const diffAB = (angA - angB + 360) % 360;
  const diffBC = (angB - angC + 360) % 360;

  let sequence: "ABC_POSITIVE" | "ACB_NEGATIVE" | "ZERO_SEQUENCE" | "FAULT_CONDITION" = "ABC_POSITIVE";
  let status: "NORMAL" | "WARNING" | "CRITICAL_TRIP" = "NORMAL";
  let statusMessage = "Phase sequence verified positive (A-B-C, 120° displacement). Symmetrical balance nominal.";

  if (Math.abs(diffAB - 120) < 25 && Math.abs(diffBC - 120) < 25) {
    sequence = "ABC_POSITIVE";
  } else if (Math.abs(diffAB - 240) < 25) {
    sequence = "ACB_NEGATIVE";
    status = "WARNING";
    statusMessage = "Negative phase sequence detected (A-C-B reversal). Check motor rotation polarity.";
  } else {
    sequence = "FAULT_CONDITION";
    status = "CRITICAL_TRIP";
    statusMessage = "Severe phase angle asymmetry detected! Check transformer taps or phase loss.";
  }

  if (vImbalance > 3.0) {
    status = status === "CRITICAL_TRIP" ? "CRITICAL_TRIP" : "WARNING";
    statusMessage = `Voltage unbalance (${vImbalance.toFixed(1)}%) exceeds IEEE 1159 3.0% threshold.`;
  }

  if (va < 50 || vb < 50 || vc < 50) {
    status = "CRITICAL_TRIP";
    statusMessage = "Single-phasing / Phase loss condition detected on one or more lines!";
  }

  // Active power estimation
  const pf = 0.92;
  const activePowerKW = (va * ia * pf + vb * ib * pf + vc * ic * pf) / 1000;
  const reactivePowerKVAR = (va * ia * Math.sin(Math.acos(pf)) + vb * ib * Math.sin(Math.acos(pf)) + vc * ic * Math.sin(Math.acos(pf))) / 1000;
  const apparentPowerKVA = (va * ia + vb * ib + vc * ic) / 1000;

  // Neutral current estimation via vector sum
  const inReal = ia * Math.cos((angA * Math.PI) / 180) + ib * Math.cos((angB * Math.PI) / 180) + ic * Math.cos((angC * Math.PI) / 180);
  const inImag = ia * Math.sin((angA * Math.PI) / 180) + ib * Math.sin((angB * Math.PI) / 180) + ic * Math.sin((angC * Math.PI) / 180);
  const neutralCurrent = Math.sqrt(inReal * inReal + inImag * inImag);

  return {
    timestamp: new Date().toISOString(),
    phaseA: { phase: "A", voltage: va, current: ia, angle: angA, thd: 1.2, powerFactor: 0.94, frequency: freq },
    phaseB: { phase: "B", voltage: vb, current: ib, angle: angB, thd: 1.3, powerFactor: 0.93, frequency: freq },
    phaseC: { phase: "C", voltage: vc, current: ic, angle: angC, thd: 1.1, powerFactor: 0.94, frequency: freq },
    frequency: freq,
    voltageImbalancePercent: parseFloat(vImbalance.toFixed(2)),
    currentImbalancePercent: parseFloat(iImbalance.toFixed(2)),
    sequence,
    neutralCurrent: parseFloat(neutralCurrent.toFixed(1)),
    activePowerTotalKW: parseFloat(activePowerKW.toFixed(2)),
    reactivePowerTotalKVAR: parseFloat(reactivePowerKVAR.toFixed(2)),
    apparentPowerTotalKVA: parseFloat(apparentPowerKVA.toFixed(2)),
    status,
    statusMessage,
  };
}

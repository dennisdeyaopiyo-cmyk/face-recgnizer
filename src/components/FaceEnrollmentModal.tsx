import React, { useState, useRef } from "react";
import {
  X,
  Camera,
  Upload,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  User,
  Mail,
  Phone,
  Award,
  Layers,
} from "lucide-react";
import { FaceProfile, ClearanceLevel } from "../types";

interface FaceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: (newProfile: FaceProfile) => void;
  currentFaceCount: number;
  initialImageData?: string;
  initialSuggestedData?: {
    suggestedName?: string;
    suggestedRole?: string;
    notes?: string;
  };
}

const COMMON_CERTIFICATIONS = [
  "ISO 26262 ASIL-D",
  "ISO 13485:2016 Lead Auditor",
  "RTCA DO-178C DAL-A",
  "IEC 62304 Class C",
  "IEEE 1547-2018",
  "FDA 21 CFR 820",
  "CMMI Level 5",
  "ASPICE Assessor Level 3",
  "INCOSE CSEP",
];

export const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onEnroll,
  currentFaceCount,
  initialImageData,
  initialSuggestedData,
}) => {
  const [activeInputMode, setActiveInputMode] = useState<"camera" | "upload" | "url">("camera");
  const [imagePreview, setImagePreview] = useState<string>(initialImageData || "");
  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  
  // Camera capture state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState(initialSuggestedData?.suggestedName || "");
  const [role, setRole] = useState(initialSuggestedData?.suggestedRole || "");
  const [department, setDepartment] = useState("Systems Safety & Avionics Engineering");
  const [badgeId, setBadgeId] = useState(`VER-${Math.floor(1000 + Math.random() * 9000)}`);
  const [clearanceLevel, setClearanceLevel] = useState<ClearanceLevel>("Level 2: Lead Systems Verifier");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCerts, setSelectedCerts] = useState<string[]>(["ISO 26262 ASIL-D"]);
  const [customCert, setCustomCert] = useState("");
  const [biometricNotes, setBiometricNotes] = useState(initialSuggestedData?.notes || "");
  const [featuresDescription, setFeaturesDescription] = useState("");

  // AI Extraction State
  const [isExtractingFeatures, setIsExtractingFeatures] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState(false);

  // Auto-start camera when switching to camera mode
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn("Camera start error:", err);
      setCameraError(err.message || "Could not access webcam. Please check permissions or upload a file.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL("image/jpeg", 0.85);
      setImagePreview(dataUri);
      stopCamera();
      triggerAIExtract(dataUri);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        triggerAIExtract(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = () => {
    if (imageUrlInput.trim()) {
      setImagePreview(imageUrlInput.trim());
      triggerAIExtract(imageUrlInput.trim());
    }
  };

  const triggerAIExtract = async (imgData: string) => {
    setIsExtractingFeatures(true);
    setExtractSuccess(false);
    try {
      const response = await fetch("/api/face-recognition/enroll-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imgData }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.featuresDescription) setFeaturesDescription(data.featuresDescription);
        if (data.suggestedRole && !role) setRole(data.suggestedRole);
        if (data.suggestedDepartment && !department) setDepartment(data.suggestedDepartment);
        setExtractSuccess(true);
      }
    } catch (err) {
      console.warn("Feature extraction non-critical error:", err);
    } finally {
      setIsExtractingFeatures(false);
    }
  };

  const toggleCert = (cert: string) => {
    if (selectedCerts.includes(cert)) {
      setSelectedCerts(selectedCerts.filter((c) => c !== cert));
    } else {
      setSelectedCerts([...selectedCerts, cert]);
    }
  };

  const handleAddCustomCert = () => {
    if (customCert.trim() && !selectedCerts.includes(customCert.trim())) {
      setSelectedCerts([...selectedCerts, customCert.trim()]);
      setCustomCert("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!imagePreview) return;

    const newProfile: FaceProfile = {
      id: `face-${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      name: name.trim(),
      role: role.trim() || "Verification Systems Specialist",
      department: department.trim() || "Quality & Verification Engineering",
      badgeId: badgeId.trim() || `VER-${Math.floor(1000 + Math.random() * 9000)}`,
      clearanceLevel,
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@systems-verify.org`,
      phone: phone.trim() || "+1 (555) 000-0000",
      certifications: selectedCerts.length > 0 ? selectedCerts : ["Stage-Gate V&V Certified"],
      avatar: imagePreview,
      registeredAt: new Date().toISOString(),
      recognitionCount: 0,
      biometricNotes: biometricNotes.trim() || "Newly enrolled personnel via Biometric Face Scanner.",
      featuresDescription: featuresDescription.trim() || "Enrolled via high-resolution facial scan.",
      verificationStats: {
        gatesApproved: 0,
        auditsSigned: 0,
        accuracyScore: 100,
      },
    };

    onEnroll(newProfile);
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="face-enrollment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="face-enrollment-modal-container"
        className="relative w-full max-w-4xl my-8 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Enroll New Face Profile</h2>
              <p className="text-xs text-slate-400">
                Scan and register facial biometrics into the Phase Verification Database ({currentFaceCount} / 100 slots used)
              </p>
            </div>
          </div>
          <button
            id="close-enroll-modal-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Capacity notice */}
          {currentFaceCount >= 100 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Database capacity reached (100 faces max). Please remove existing profiles to add new ones.</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Image Acquisition & Biometrics Preview */}
            <div className="lg:col-span-5 space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                1. Facial Image Capture *
              </label>

              {/* Mode Tabs */}
              <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-medium text-slate-600">
                <button
                  type="button"
                  id="tab-camera-capture"
                  onClick={() => {
                    setActiveInputMode("camera");
                    startCamera();
                  }}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    activeInputMode === "camera" ? "bg-white text-slate-900 shadow-sm font-semibold" : "hover:text-slate-900"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" /> Webcam
                </button>
                <button
                  type="button"
                  id="tab-upload-file"
                  onClick={() => {
                    setActiveInputMode("upload");
                    stopCamera();
                  }}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    activeInputMode === "upload" ? "bg-white text-slate-900 shadow-sm font-semibold" : "hover:text-slate-900"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> File
                </button>
                <button
                  type="button"
                  id="tab-url-input"
                  onClick={() => {
                    setActiveInputMode("url");
                    stopCamera();
                  }}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    activeInputMode === "url" ? "bg-white text-slate-900 shadow-sm font-semibold" : "hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> URL
                </button>
              </div>

              {/* Input Display Area */}
              <div className="relative aspect-4/3 w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group">
                {activeInputMode === "camera" && (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${!isCameraActive ? "hidden" : ""}`}
                    />
                    {!isCameraActive && (
                      <div className="text-center p-4">
                        <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 mb-3">Camera is idle or waiting for permission</p>
                        <button
                          type="button"
                          id="btn-start-camera-feed"
                          onClick={startCamera}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" /> Start Webcam Feed
                        </button>
                        {cameraError && (
                          <p className="text-[11px] text-rose-400 mt-2 max-w-xs">{cameraError}</p>
                        )}
                      </div>
                    )}
                    {isCameraActive && (
                      <div className="absolute bottom-3 inset-x-0 flex justify-center">
                        <button
                          type="button"
                          id="btn-snap-photo"
                          onClick={handleCaptureSnapshot}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-2 border-2 border-white/40"
                        >
                          <Camera className="w-4 h-4" /> Snap Facial Image
                        </button>
                      </div>
                    )}
                  </>
                )}

                {activeInputMode === "upload" && (
                  <div className="p-6 text-center w-full">
                    <input
                      type="file"
                      id="face-file-upload-input"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="face-file-upload-input"
                      className="cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl transition-colors"
                    >
                      <Upload className="w-8 h-8 text-blue-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-200">Click to upload photo</span>
                      <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP up to 10MB</span>
                    </label>
                  </div>
                )}

                {activeInputMode === "url" && (
                  <div className="p-4 w-full space-y-3">
                    <input
                      type="url"
                      id="face-image-url-input"
                      placeholder="https://example.com/photo.jpg"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      id="btn-apply-image-url"
                      onClick={handleApplyUrl}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
                    >
                      Load Image from URL
                    </button>
                  </div>
                )}

                {/* Preview Thumbnail Overlay if snapshot taken */}
                {imagePreview && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-md text-[10px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Image Loaded
                  </div>
                )}
              </div>

              {/* Image Preview & AI Scanner Status */}
              {imagePreview && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Facial Biometric Analysis
                    </span>
                    <button
                      type="button"
                      id="btn-reextract-ai"
                      onClick={() => triggerAIExtract(imagePreview)}
                      disabled={isExtractingFeatures}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isExtractingFeatures ? "animate-spin" : ""}`} />
                      {isExtractingFeatures ? "Extracting..." : "Re-Scan Traits"}
                    </button>
                  </div>
                  {isExtractingFeatures ? (
                    <div className="text-xs text-slate-500 flex items-center gap-2 py-1">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      Gemini Vision analyzing landmarks & posture...
                    </div>
                  ) : extractSuccess ? (
                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                      {featuresDescription || "Facial geometric points mapped successfully."}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">Ready to enroll into biometric index.</p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Personnel Details Form */}
            <div className="lg:col-span-7 space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                2. Verifier Credentials & Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name & Title *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      id="input-enroll-name"
                      required
                      placeholder="e.g. Dr. Maya Lin, PE"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Engineering Role / Designation *
                  </label>
                  <input
                    type="text"
                    id="input-enroll-role"
                    required
                    placeholder="e.g. Lead Systems Safety Architect"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Department / Division *
                  </label>
                  <select
                    id="select-enroll-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="Systems Safety & Avionics Engineering">Systems Safety & Avionics Engineering</option>
                    <option value="High-Voltage Power Systems Lab">High-Voltage Power Systems Lab</option>
                    <option value="Medical Device Regulatory Affairs">Medical Device Regulatory Affairs</option>
                    <option value="Flight Control & Critical Software">Flight Control & Critical Software</option>
                    <option value="Executive Quality Governance">Executive Quality Governance</option>
                    <option value="Automotive V&V Testing Facility">Automotive V&V Testing Facility</option>
                    <option value="Firmware & DSP Architecture">Firmware & DSP Architecture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Badge ID / Token *
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      id="input-enroll-badge"
                      required
                      value={badgeId}
                      onChange={(e) => setBadgeId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Gate Clearance Level
                  </label>
                  <select
                    id="select-enroll-clearance"
                    value={clearanceLevel}
                    onChange={(e) => setClearanceLevel(e.target.value as ClearanceLevel)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="Level 1: Standard Verifier">Level 1: Standard Verifier</option>
                    <option value="Level 2: Lead Systems Verifier">Level 2: Lead Systems Verifier</option>
                    <option value="Level 3: Phase Gate Chair">Level 3: Phase Gate Chair</option>
                    <option value="Level 4: Quality & Safety Executive">Level 4: Quality & Safety Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Official Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      id="input-enroll-email"
                      placeholder="engineer@systems-verify.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Safety Standards Certifications */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>Authorized Compliance Certifications</span>
                  <span className="text-[11px] text-slate-500 font-normal">Click to toggle</span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {COMMON_CERTIFICATIONS.map((cert) => {
                    const isSelected = selectedCerts.includes(cert);
                    return (
                      <button
                        type="button"
                        key={cert}
                        onClick={() => toggleCert(cert)}
                        className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {cert}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Add custom certification..."
                    value={customCert}
                    onChange={(e) => setCustomCert(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomCert();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCert}
                    className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Biometric & Authorization Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Biometric / Gate Authorization Notes
                </label>
                <textarea
                  id="input-enroll-notes"
                  rows={2}
                  placeholder="e.g. Authorized to verify Class III medical device software gates and cryogenic telemetry."
                  value={biometricNotes}
                  onChange={(e) => setBiometricNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              * Required fields. Profile will be saved locally and indexed for live camera recognition.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-cancel-enroll"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-enroll-profile"
                disabled={!name.trim() || !imagePreview || currentFaceCount >= 100}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Register & Save Face Profile
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

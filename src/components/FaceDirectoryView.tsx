import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Shield,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Award,
  Sparkles,
  Fingerprint,
} from "lucide-react";
import { FaceProfile, ClearanceLevel } from "../types";

interface FaceDirectoryViewProps {
  faces: FaceProfile[];
  onOpenEnrollModal: () => void;
  onDeleteProfile: (id: string) => void;
  onSelectForScannerTest: (profile: FaceProfile) => void;
  onResetToDefault: () => void;
  onImportFaces: (imported: FaceProfile[]) => void;
}

export const FaceDirectoryView: React.FC<FaceDirectoryViewProps> = ({
  faces,
  onOpenEnrollModal,
  onDeleteProfile,
  onSelectForScannerTest,
  onResetToDefault,
  onImportFaces,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClearance, setSelectedClearance] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [activeProfileDetails, setActiveProfileDetails] = useState<FaceProfile | null>(null);

  const departments = Array.from(new Set(faces.map((f) => f.department)));

  const filteredFaces = faces.filter((face) => {
    const matchesSearch =
      face.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      face.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      face.badgeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      face.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClearance =
      selectedClearance === "ALL" || face.clearanceLevel.includes(selectedClearance);

    const matchesDept = selectedDept === "ALL" || face.department === selectedDept;

    return matchesSearch && matchesClearance && matchesDept;
  });

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(faces, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `phase-verification-faces-ledger-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportFaces(parsed);
          }
        } catch (err) {
          alert("Invalid JSON faces ledger file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const getClearanceBadgeClass = (level: ClearanceLevel) => {
    if (level.includes("Level 4")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (level.includes("Level 3")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (level.includes("Level 2")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Capacity Metric */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Registered Personnel & Biometric Faces</h1>
          </div>
          <p className="text-sm text-slate-500">
            Database of authorized engineers and auditors registered for Phase Gate biometric verification.
          </p>
        </div>

        {/* Capacity Progress Bar */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[280px]">
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Database Storage</span>
              <span className="text-blue-600">{faces.length} / 100 Faces</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all rounded-full ${
                  faces.length > 90 ? "bg-rose-500" : faces.length > 70 ? "bg-amber-500" : "bg-blue-600"
                }`}
                style={{ width: `${Math.min(100, (faces.length / 100) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400">
              {100 - faces.length} free enrollment slots remaining
            </span>
          </div>

          <button
            id="btn-enroll-face-header"
            onClick={onOpenEnrollModal}
            disabled={faces.length >= 100}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Enroll Face
          </button>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Export/Import */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              id="input-search-faces"
              placeholder="Search by name, role, badge ID, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Clearance Level Filter */}
          <div className="sm:w-48">
            <select
              id="filter-clearance-select"
              value={selectedClearance}
              onChange={(e) => setSelectedClearance(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="ALL">All Clearance Levels</option>
              <option value="Level 1">Level 1: Standard</option>
              <option value="Level 2">Level 2: Lead</option>
              <option value="Level 3">Level 3: Chair</option>
              <option value="Level 4">Level 4: Executive</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="sm:w-56">
            <select
              id="filter-department-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 truncate"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-export-faces-json"
            onClick={handleExportJSON}
            title="Export faces ledger to JSON"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-xs font-medium flex items-center gap-1.5 px-3"
          >
            <Download className="w-4 h-4" /> Export Ledger
          </button>

          <label
            htmlFor="import-faces-file-input"
            title="Import faces from JSON file"
            className="cursor-pointer p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-xs font-medium flex items-center gap-1.5 px-3"
          >
            <Upload className="w-4 h-4" /> Import
            <input
              id="import-faces-file-input"
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            id="btn-reset-default-faces"
            onClick={() => {
              if (confirm("Reset face profiles back to the default 5 verified engineering leads?")) {
                onResetToDefault();
              }
            }}
            title="Reset to default 5 faces"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-xs font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* Grid of Face Cards */}
      {filteredFaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No matching personnel found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or filter criteria, or enroll a new face into the database.
          </p>
          <button
            onClick={onOpenEnrollModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Enroll New Face
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaces.map((profile) => {
            return (
              <div
                key={profile.id}
                id={`face-card-${profile.id}`}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Header Profile Row */}
                <div className="p-5 flex gap-4 border-b border-slate-100">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback avatar placeholder
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center font-bold text-slate-400 text-lg">
                      {profile.name.charAt(0)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {profile.badgeId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getClearanceBadgeClass(
                          profile.clearanceLevel
                        )}`}
                      >
                        {profile.clearanceLevel.split(":")[0]}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 truncate" title={profile.name}>
                      {profile.name}
                    </h3>
                    <p className="text-xs text-blue-600 font-medium truncate" title={profile.role}>
                      {profile.role}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {profile.department}
                    </p>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 space-y-3 bg-slate-50/50 text-xs">
                  {/* Certifications badges */}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Authorized Standards
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {profile.certifications.slice(0, 3).map((cert) => (
                        <span
                          key={cert}
                          className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[10px] font-medium"
                        >
                          {cert}
                        </span>
                      ))}
                      {profile.certifications.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-medium">
                          +{profile.certifications.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Verification Stats */}
                  <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Gates</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {profile.verificationStats?.gatesApproved ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Audits</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {profile.verificationStats?.auditsSigned ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Accuracy</span>
                      <span className="font-bold text-emerald-600 text-xs">
                        {profile.verificationStats?.accuracyScore ?? 100}%
                      </span>
                    </div>
                  </div>

                  {profile.featuresDescription && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                      "{profile.featuresDescription}"
                    </p>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    id={`btn-test-match-${profile.id}`}
                    onClick={() => onSelectForScannerTest(profile)}
                    className="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    Test Face Recognition
                  </button>

                  <button
                    type="button"
                    id={`btn-delete-face-${profile.id}`}
                    onClick={() => {
                      if (confirm(`Remove ${profile.name} (${profile.badgeId}) from biometric face database?`)) {
                        onDeleteProfile(profile.id);
                      }
                    }}
                    title="Delete Profile"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

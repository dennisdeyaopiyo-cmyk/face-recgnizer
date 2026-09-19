import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Radio,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { calculateThreePhaseTelemetry } from "../lib/verificationUtils";
import { ThreePhaseSignalTelemetry } from "../types";

export const ThreePhaseAnalyzer: React.FC = () => {
  // Phase parameter states
  const [va, setVa] = useState<number>(230);
  const [angA, setAngA] = useState<number>(0);
  const [ia, setIa] = useState<number>(45);

  const [vb, setVb] = useState<number>(230);
  const [angB, setAngB] = useState<number>(-120);
  const [ib, setIb] = useState<number>(45);

  const [vc, setVc] = useState<number>(230);
  const [angC, setAngC] = useState<number>(120);
  const [ic, setIc] = useState<number>(45);

  const [frequency, setFrequency] = useState<number>(60);
  const [thdPercent, setThdPercent] = useState<number>(1.2);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // AI Diagnostic State
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Canvas refs
  const phasorCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Telemetry calculation
  const telemetry: ThreePhaseSignalTelemetry = calculateThreePhaseTelemetry(
    va,
    angA,
    vb,
    angB,
    vc,
    angC,
    ia,
    ib,
    ic,
    frequency
  );

  // Preset Configurations
  const applyPreset = (preset: string) => {
    switch (preset) {
      case "balanced_60hz":
        setVa(230);
        setAngA(0);
        setIa(45);
        setVb(230);
        setAngB(-120);
        setIb(45);
        setVc(230);
        setAngC(120);
        setIc(45);
        setFrequency(60);
        setThdPercent(1.2);
        break;
      case "phase_reversal":
        setVa(230);
        setAngA(0);
        setIa(45);
        setVb(230);
        setAngB(120); // Reversed
        setIb(45);
        setVc(230);
        setAngC(-120); // Reversed
        setIc(45);
        break;
      case "phase_loss_l2":
        setVa(230);
        setAngA(0);
        setIa(45);
        setVb(12); // Dropped
        setAngB(-120);
        setIb(2);
        setVc(230);
        setAngC(120);
        setIc(45);
        break;
      case "voltage_unbalance":
        setVa(242);
        setAngA(0);
        setIa(48);
        setVb(218);
        setAngB(-114);
        setIb(41);
        setVc(230);
        setAngC(125);
        setIc(46);
        break;
      case "high_harmonics":
        setVa(230);
        setAngA(0);
        setIa(45);
        setVb(230);
        setAngB(-120);
        setIb(45);
        setVc(230);
        setAngC(120);
        setIc(45);
        setThdPercent(8.5);
        break;
    }
  };

  // Draw Phasor Diagram Canvas
  useEffect(() => {
    const canvas = phasorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 32;

    ctx.clearRect(0, 0, width, height);

    // Background concentric grid circles
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    [0.33, 0.66, 1.0].forEach((ratio) => {
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius * ratio, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Reference axes (0°, 90°, 180°, 270°)
    ctx.strokeStyle = "#334155";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - maxRadius - 10, cy);
    ctx.lineTo(cx + maxRadius + 10, cy);
    ctx.moveTo(cx, cy - maxRadius - 10);
    ctx.lineTo(cx, cy + maxRadius + 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Degree labels
    ctx.fillStyle = "#64748b";
    ctx.font = "10px monospace";
    ctx.fillText("0°", cx + maxRadius + 8, cy + 3);
    ctx.fillText("90°", cx - 8, cy - maxRadius - 6);
    ctx.fillText("180°", cx - maxRadius - 26, cy + 3);
    ctx.fillText("270°", cx - 12, cy + maxRadius + 14);

    // Helper to draw vector
    const drawPhasorVector = (
      mag: number,
      deg: number,
      color: string,
      label: string,
      maxVal: number
    ) => {
      const rad = (-deg * Math.PI) / 180; // Invert for standard CCW cartesian
      const length = Math.min(maxRadius, (mag / maxVal) * maxRadius);
      const ex = cx + length * Math.cos(rad);
      const ey = cy + length * Math.sin(rad);

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;

      // Line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Arrowhead
      const headLen = 8;
      const angle = Math.atan2(ey - cy, ex - cx);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - headLen * Math.cos(angle - Math.PI / 6),
        ey - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        ex - headLen * Math.cos(angle + Math.PI / 6),
        ey - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();

      // Label text
      ctx.font = "bold 11px sans-serif";
      const textOffset = 16;
      ctx.fillText(
        label,
        ex + textOffset * Math.cos(rad) - 8,
        ey + textOffset * Math.sin(rad) + 4
      );
    };

    const maxNominalV = 280;
    drawPhasorVector(va, angA, "#ef4444", `Va (${va}V, ${angA}°)`, maxNominalV); // Phase A Red
    drawPhasorVector(vb, angB, "#eab308", `Vb (${vb}V, ${angB}°)`, maxNominalV); // Phase B Yellow
    drawPhasorVector(vc, angC, "#3b82f6", `Vc (${vc}V, ${angC}°)`, maxNominalV); // Phase C Blue

    // Center pivot dot
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [va, angA, vb, angB, vc, angC]);

  // Waveform Oscilloscope Animation
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const renderWaveforms = () => {
      if (isPlaying) {
        timeRef.current += 0.04;
      }

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;
      const t = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Zero axis
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      const scaleY = (midY - 20) / 280;

      const drawSine = (mag: number, deg: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const radOffset = (deg * Math.PI) / 180;
        const cycles = 2.5;

        for (let x = 0; x < width; x++) {
          const progress = (x / width) * (Math.PI * 2 * cycles);
          let yVal = mag * Math.sin(progress - t + radOffset);

          // Harmonic distortion component
          if (thdPercent > 2) {
            const h5 = (mag * (thdPercent / 100)) * Math.sin(5 * (progress - t) + radOffset);
            yVal += h5;
          }

          const yPos = midY - yVal * scaleY;
          if (x === 0) ctx.moveTo(x, yPos);
          else ctx.lineTo(x, yPos);
        }
        ctx.stroke();
      };

      drawSine(va, angA, "#ef4444"); // Phase A Red
      drawSine(vb, angB, "#eab308"); // Phase B Yellow
      drawSine(vc, angC, "#3b82f6"); // Phase C Blue

      animId = requestAnimationFrame(renderWaveforms);
    };

    renderWaveforms();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [va, angA, vb, angB, vc, angC, thdPercent, isPlaying]);

  // Execute AI Signal Analysis
  const handleAISignalAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/verify/signal-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseA: { voltage: va, angle: angA, current: ia, thd: thdPercent },
          phaseB: { voltage: vb, angle: angB, current: ib, thd: thdPercent },
          phaseC: { voltage: vc, angle: angC, current: ic, thd: thdPercent },
          frequency,
          loadType: "Industrial Inverter Dynamometer Load",
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAiAnalysis(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  3-Phase Signal Verifier & Phasor Scope
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  IEEE 1159 / 519 Standard
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time AC vector balance, symmetrical sequence analysis, phase unbalance verification, and oscilloscope monitoring.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleAISignalAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold transition-all"
            >
              <Sparkles className={`w-4 h-4 text-teal-400 ${isAnalyzing ? "animate-spin" : ""}`} />
              <span>{isAnalyzing ? "Analyzing Signals..." : "AI Signal Diagnostics"}</span>
            </button>
          </div>
        </div>

        {/* Quick Fault & Preset Selectors */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" /> Simulation Presets:
          </span>
          <button
            onClick={() => applyPreset("balanced_60hz")}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
          >
            Normal Balanced (120°)
          </button>
          <button
            onClick={() => applyPreset("phase_reversal")}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
          >
            Phase Reversal (ACB)
          </button>
          <button
            onClick={() => applyPreset("phase_loss_l2")}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700"
          >
            Phase Loss (Single-Phasing)
          </button>
          <button
            onClick={() => applyPreset("voltage_unbalance")}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700"
          >
            Voltage Unbalance (5%)
          </button>
          <button
            onClick={() => applyPreset("high_harmonics")}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700"
          >
            High 5th Harmonics (THD 8.5%)
          </button>
        </div>
      </div>

      {/* Main Grid: Phasor Diagram + Waveform Scope */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Phasor Canvas (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Phasor Vector Diagram
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-rose-400">● Va (L1)</span>
              <span className="text-yellow-400">● Vb (L2)</span>
              <span className="text-blue-400">● Vc (L3)</span>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl p-2 border border-slate-800 flex items-center justify-center">
            <canvas
              ref={phasorCanvasRef}
              width={340}
              height={300}
              className="max-w-full h-auto"
            />
          </div>

          {/* Symmetrical Sequence Status */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Phase Sequence:</span>
              <strong
                className={`font-mono ${
                  telemetry.sequence === "ABC_POSITIVE"
                    ? "text-emerald-400"
                    : telemetry.sequence === "ACB_NEGATIVE"
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                {telemetry.sequence}
              </strong>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">{telemetry.statusMessage}</p>
          </div>
        </div>

        {/* Waveform Scope (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              AC 3-Phase Sinusoidal Oscilloscope ({frequency} Hz)
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "Freeze" : "Run"}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl p-2 border border-slate-800">
            <canvas
              ref={waveformCanvasRef}
              width={540}
              height={260}
              className="w-full h-auto"
            />
          </div>

          {/* Real-time Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Voltage Unbalance</div>
              <div
                className={`text-base font-bold font-mono mt-0.5 ${
                  telemetry.voltageImbalancePercent < 3.0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {telemetry.voltageImbalancePercent}%
              </div>
              <div className="text-[9px] text-slate-500">IEEE limit &lt; 3.0%</div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Neutral Current In</div>
              <div className="text-base font-bold font-mono mt-0.5 text-blue-400">
                {telemetry.neutralCurrent} A
              </div>
              <div className="text-[9px] text-slate-500">Vector Return Sum</div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Active Power (P)</div>
              <div className="text-base font-bold font-mono mt-0.5 text-amber-400">
                {telemetry.activePowerTotalKW} kW
              </div>
              <div className="text-[9px] text-slate-500">cos φ ≈ 0.94</div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Total Harmonics THD</div>
              <div
                className={`text-base font-bold font-mono mt-0.5 ${
                  thdPercent < 5.0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {thdPercent.toFixed(1)}%
              </div>
              <div className="text-[9px] text-slate-500">IEEE 519 limit &lt; 5%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls per Phase */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          Interactive Phase Parameter Calibration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Phase A */}
          <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/40 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-rose-400">Phase A (L1 / Red)</span>
              <span className="font-mono text-xs text-slate-300">{va}V / {angA}°</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Voltage (RMS)</span>
                <span className="font-mono text-white">{va} V</span>
              </div>
              <input
                type="range"
                min={0}
                max={280}
                value={va}
                onChange={(e) => setVa(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Phase Angle θ</span>
                <span className="font-mono text-white">{angA}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={angA}
                onChange={(e) => setAngA(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Current (Arms)</span>
                <span className="font-mono text-white">{ia} A</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={ia}
                onChange={(e) => setIa(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
          </div>

          {/* Phase B */}
          <div className="bg-slate-950 p-4 rounded-xl border border-yellow-900/40 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-yellow-400">Phase B (L2 / Yellow)</span>
              <span className="font-mono text-xs text-slate-300">{vb}V / {angB}°</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Voltage (RMS)</span>
                <span className="font-mono text-white">{vb} V</span>
              </div>
              <input
                type="range"
                min={0}
                max={280}
                value={vb}
                onChange={(e) => setVb(Number(e.target.value))}
                className="w-full accent-yellow-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Phase Angle θ</span>
                <span className="font-mono text-white">{angB}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={angB}
                onChange={(e) => setAngB(Number(e.target.value))}
                className="w-full accent-yellow-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Current (Arms)</span>
                <span className="font-mono text-white">{ib} A</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={ib}
                onChange={(e) => setIb(Number(e.target.value))}
                className="w-full accent-yellow-500"
              />
            </div>
          </div>

          {/* Phase C */}
          <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/40 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-blue-400">Phase C (L3 / Blue)</span>
              <span className="font-mono text-xs text-slate-300">{vc}V / {angC}°</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Voltage (RMS)</span>
                <span className="font-mono text-white">{vc} V</span>
              </div>
              <input
                type="range"
                min={0}
                max={280}
                value={vc}
                onChange={(e) => setVc(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Phase Angle θ</span>
                <span className="font-mono text-white">{angC}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={angC}
                onChange={(e) => setAngC(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Current (Arms)</span>
                <span className="font-mono text-white">{ic} A</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={ic}
                onChange={(e) => setIc(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Signal Analysis Findings Card */}
      {aiAnalysis && (
        <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-5 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-base text-white">AI Phase Diagnostic Assessment</h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                aiAnalysis.healthStatus === "OPTIMAL" || aiAnalysis.healthStatus === "HEALTHY"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              Status: {aiAnalysis.healthStatus}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            <strong>Diagnosis: </strong> {aiAnalysis.faultDiagnosis || aiAnalysis.complianceIEEE}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <span className="font-semibold text-slate-300">Auditor Observations:</span>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                {aiAnalysis.observations?.map((obs: string, i: number) => (
                  <li key={i}>{obs}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <span className="font-semibold text-teal-300">Recommended Action Items:</span>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                {aiAnalysis.actionableSteps?.map((step: string, i: number) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

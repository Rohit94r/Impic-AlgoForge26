"use client";

import Link from "next/link";
import { useReportWorkflow } from "@/components/report/ReportWorkflowContext";
import {
  buildCaseRef,
  buildFinalRiskScore,
  buildModelFirstSummary,
  buildSignalRows,
} from "@/components/report/utils";
import { ImageEvidence } from "@/components/report/ImageEvidence";
import { C2PAProvenance } from "@/components/report/C2PAProvenance";
import { NeuralModelVerdict } from "@/components/report/NeuralModelVerdict";
import { ForensicSignals } from "@/components/report/ForensicSignals";

export default function AnalysisStepPage() {
  const { caseId, caseData, analysis, suspiciousImg, referenceImg, evidenceImg } = useReportWorkflow();
  if (!caseData) return null;

  if (!analysis) {
    return (
      <div className="mb-8 rounded-xl border border-[#e8e4de] bg-white px-6 py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-[#fafaf8] border border-[#e8e4de] flex items-center justify-center mx-auto mb-4">
          <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-[14px] font-semibold text-[#0a0a0a] mb-1">Analysis not yet available</p>
        <p className="text-[12.5px] text-[#6b7280] mb-5 max-w-sm mx-auto leading-relaxed">
          The case was created but forensic analysis has not been run yet.
        </p>
        <Link
          href={`/report/${caseId}/distribution`}
          className="inline-flex items-center gap-2 text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
        >
          Skip to distribution trace →
        </Link>
      </div>
    );
  }

  const score = buildFinalRiskScore(analysis);
  const summaryText = buildModelFirstSummary(analysis);
  const signalRows = buildSignalRows(analysis);
  const showEla = Boolean(analysis.reference_based);

  const isManipulated = score >= 85;
  const isHigh = score >= 70 && score < 85;
  const isMedium = score >= 50 && score < 70;

  const verdictLabel = isManipulated ? "Likely Manipulated"
    : isHigh ? "High Suspicion"
    : isMedium ? "Inconclusive"
    : "Likely Authentic";

  const verdictDot = isManipulated ? "bg-red-500"
    : isHigh ? "bg-orange-500"
    : isMedium ? "bg-amber-400"
    : "bg-emerald-500";

  const verdictBorder = isManipulated ? "border-red-200"
    : isHigh ? "border-orange-200"
    : isMedium ? "border-amber-200"
    : "border-emerald-200";

  const verdictBg = isManipulated ? "bg-red-50"
    : isHigh ? "bg-orange-50"
    : isMedium ? "bg-amber-50"
    : "bg-emerald-50";

  const verdictText = isManipulated ? "text-red-700"
    : isHigh ? "text-orange-700"
    : isMedium ? "text-amber-700"
    : "text-emerald-700";

  const scoreText = isManipulated ? "text-red-600"
    : isHigh ? "text-orange-600"
    : isMedium ? "text-amber-600"
    : "text-emerald-600";

  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const gaugeColor = isManipulated ? "#dc2626" : isHigh ? "#ea580c" : isMedium ? "#d97706" : "#16a34a";

  return (
    <>
      {/* ── Verdict + Score banner ─────────────────────────────────── */}
      <div className={`mb-6 rounded-xl border ${verdictBorder} ${verdictBg} px-5 py-4 flex items-center gap-5`}>
        {/* Gauge */}
        <svg width="88" height="88" viewBox="0 0 100 100" className="shrink-0">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="9" />
          <circle
            cx="50" cy="50" r={r} fill="none"
            stroke={gaugeColor} strokeWidth="9"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 1.2s ease" }}
          />
          <text x="50" y="46" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0a0a0a" fontFamily="Georgia,serif">{score}</text>
          <text x="50" y="59" textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="monospace">/100</text>
        </svg>

        {/* Verdict text */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-1">Forensic Verdict</p>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${verdictDot}`} />
            <p className={`text-[17px] font-bold tracking-tight ${verdictText}`}>{verdictLabel}</p>
          </div>
          <p className="text-[12px] text-[#6b7280] leading-relaxed">
            {isManipulated ? "Strong manipulation indicators detected across forensic signals."
              : isHigh ? "Multiple manipulation signals flagged — manual review advised."
              : isMedium ? "Mixed signals detected — insufficient confidence for clear verdict."
              : "No significant manipulation detected. Content appears authentic."}
          </p>
          {analysis.forensic_certainty && (
            <p className={`text-[11px] font-mono mt-1.5 ${scoreText}`}>{analysis.forensic_certainty}</p>
          )}
        </div>

        {/* Score text */}
        <div className={`shrink-0 text-right hidden sm:block`}>
          <p className={`text-[36px] font-bold leading-none font-mono ${scoreText}`}>{score}</p>
          <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">risk score</p>
        </div>
      </div>

      {/* ── Submitted Images ──────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-[#e8e4de] bg-white px-5 py-4">
        <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Submitted Evidence</p>
        <ImageEvidence
          suspiciousImg={suspiciousImg}
          referenceImg={referenceImg}
          tamperHeatmap={showEla ? analysis.tamper_heatmap : undefined}
        />
      </div>

      {/* ── Analysis Summary ──────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-[#e8e4de] bg-white px-5 py-4">
        <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">Analysis Summary</p>
        <p className="text-[13.5px] text-[#374151] leading-[1.8]">{summaryText}</p>
      </div>

      {/* ── Neural Model Verdict ──────────────────────────────────── */}
      <NeuralModelVerdict ai={analysis.ai_detection} />

      {/* ── Forensic Signals ──────────────────────────────────────── */}
      {signalRows.length > 0 && <ForensicSignals rows={signalRows} />}

      {/* ── C2PA Provenance ──────────────────────────────────────── */}
      <C2PAProvenance c2pa={analysis.c2pa_result} />

      {/* ── Supporting Evidence Card ─────────────────────────────── */}
      {analysis.supporting_evidence && (
        <div className="mb-8 rounded-xl border border-[#e8e4de] bg-white px-5 py-4">
          <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">
            Supporting Evidence Analysis
          </p>
          <div className="flex gap-4 items-start">
            {evidenceImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={evidenceImg}
                alt="Supporting evidence"
                className="w-20 h-20 object-cover rounded-lg border border-[#e8e4de] shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-[10px] uppercase tracking-wider ${
                analysis.supporting_evidence.ela_flagged
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${analysis.supporting_evidence.ela_flagged ? "bg-red-500" : "bg-emerald-500"}`} />
                {analysis.supporting_evidence.ela_flagged ? "Editing Artifacts Detected" : "No Artifacts Detected"}
              </span>
              <p className="text-[12.5px] text-[#374151] leading-relaxed">{analysis.supporting_evidence.manipulation_note}</p>
              <p className="text-[10.5px] text-[#9ca3af] font-mono">
                SHA-256: {analysis.supporting_evidence.sha256.slice(0, 24)}…
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Next Step CTA ────────────────────────────────────────── */}
      <div className="mb-8 print:hidden">
        <Link
          href={`/report/${caseId}/distribution`}
          className="flex items-center justify-between gap-4 w-full rounded-xl border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white px-6 py-4 hover:bg-[#1a1a1a] transition-all group"
        >
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-0.5">Step 2 of 3</p>
            <p className="text-[15px] font-semibold">Trace Distribution →</p>
            <p className="text-[12px] text-white/60 mt-0.5">See where this content is spreading across the web</p>
          </div>
          <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </>
  );
}

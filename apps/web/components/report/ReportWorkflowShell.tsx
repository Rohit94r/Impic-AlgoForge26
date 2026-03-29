"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaseHeader } from "@/components/report/CaseHeader";
import { NCIIReportLayout } from "@/components/report/NCIIReportLayout";
import { buildCaseRef, buildVerdict, buildVerdictColor } from "@/components/report/utils";
import { useReportWorkflow } from "@/components/report/ReportWorkflowContext";

function StepNav({ caseId, isNcii }: { caseId: string; isNcii?: boolean }) {
  const pathname = usePathname();

  const steps = [
    {
      id: "analysis",
      label: isNcii ? "Record Evidence" : "Analyze Evidence",
      href: `/report/${caseId}/analysis`,
    },
    { id: "distribution", label: "Trace Distribution", href: `/report/${caseId}/distribution` },
    { id: "takedown", label: "Execute Takedown", href: `/report/${caseId}/takedown` },
  ];

  return (
    <div className="mb-6 rounded-xl border border-[#e8e4de] bg-white px-4 py-3 print:hidden">
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">Investigation Flow</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {steps.map((step, idx) => {
          const active = pathname === step.href;
          const isDone = pathname.includes("/distribution")
            ? idx === 0
            : pathname.includes("/takedown")
            ? idx <= 1
            : false;

          return (
            <Link
              key={step.id}
              href={step.href}
              className={`rounded-lg border px-3 py-2.5 transition-colors ${
                active
                  ? "border-[#0a0a0a] bg-[#fafaf8]"
                  : isDone
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-[#e8e4de] bg-white hover:bg-[#fafaf8]"
              }`}
            >
              <p className="text-[9px] font-mono uppercase tracking-widest text-[#9ca3af]">Step {idx + 1}</p>
              <p className="text-[12.5px] font-semibold text-[#0a0a0a] mt-1">{step.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ReportWorkflowShell({ children }: { children: React.ReactNode }) {
  const {
    caseId,
    caseData,
    analysis,
    suspiciousImg,
    loading,
    fetchError,
    hashCopied,
    copyHash,
    isCaseSaved,
    isSaving,
    saveSent,
    saveEmail,
    setSaveEmail,
    handleSendMagicLink,
    handleSaveCase,
    sessionUserId,
  } = useReportWorkflow();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-7 h-7 border-2 border-[#e8e4de] border-t-[#0a0a0a] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-[#9ca3af] font-mono">Loading forensic report…</p>
        </div>
      </div>
    );
  }

  if (fetchError || !caseData) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <p className="text-[14px] text-red-600 mb-4">{fetchError ?? "Report not found"}</p>
          <Link href="/start" className="text-[13px] text-indigo-600 hover:underline">
            ← Start a new investigation
          </Link>
        </div>
      </div>
    );
  }

  if (caseData.pipeline_type === "ncii") {
    return (
      <NCIIReportLayout
        caseId={caseId}
        caseData={caseData}
        suspiciousImg={suspiciousImg}
        isCaseSaved={isCaseSaved}
        isSaving={isSaving}
        saveSent={saveSent}
        saveEmail={saveEmail}
        onSaveEmailChange={setSaveEmail}
        onSendMagicLink={handleSendMagicLink}
        onSaveCase={handleSaveCase}
        sessionUserId={sessionUserId}
      />
    );
  }

  const caseRef = buildCaseRef(caseId);
  const verdict = analysis ? buildVerdict(analysis) : "ANALYSIS PENDING";
  const verdictColor = analysis
    ? buildVerdictColor(analysis)
    : "text-slate-700 bg-slate-50 border-slate-300";
  const headerCertainty =
    analysis?.forensic_certainty === "AI-Generated (C2PA Verified)"
      ? analysis.forensic_certainty
      : undefined;

  return (
    <div className="min-h-screen bg-[#fafaf8] print:bg-white">
      {/* Sticky top nav */}
      <header className="border-b border-[#e8e4de] px-6 py-3.5 flex items-center gap-3 bg-white/95 backdrop-blur-sm print:hidden sticky top-0 z-10">
        <Link href="/" className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity">
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="text-[13px] text-[#9ca3af]">Forensic Report</span>
        <span className="font-mono text-[11px] text-[#c4bdb5] ml-1">· {caseRef}</span>
        <div className="ml-auto flex items-center gap-2">
          {isCaseSaved ? (
            <Link href="/dashboard" className="text-[12px] text-emerald-700 font-medium border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
              ✓ Saved · View dashboard
            </Link>
          ) : (
            <button
              onClick={handleSaveCase}
              disabled={isSaving}
              className="text-[12px] text-[#6b7280] hover:text-[#0a0a0a] border border-[#e8e4de] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save case"}
            </button>
          )}
          <button
            onClick={copyHash}
            className="text-[12px] text-[#6b7280] hover:text-[#0a0a0a] border border-[#e8e4de] px-3 py-1.5 rounded-lg transition-colors"
          >
            {hashCopied ? "✓ Copied" : "Copy hash"}
          </button>
          <button
            onClick={() => window.print()}
            className="text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-1.5 rounded-full hover:bg-[#1a1a1a] transition-colors"
          >
            Download PDF
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 print:py-6 print:px-10">
        <CaseHeader
          caseRef={caseRef}
          verdict={verdict}
          verdictColor={verdictColor}
          caseData={caseData}
          forensicCertainty={headerCertainty}
          tamperRegionCount={analysis?.tamper_regions?.length}
        />

        <StepNav caseId={caseId} isNcii={caseData.pipeline_type === "ncii"} />

        {children}

        <div className="border-t border-[#e8e4de] pt-5 mt-4 flex items-center justify-between print:border-[#0a0a0a]">
          <p className="font-mono text-[10px] text-[#c4bdb5] tracking-widest">SNIFFER · IMPIC LABS · 2026</p>
          <div className="flex gap-4 print:hidden">
            <Link href="/start" className="text-[12px] text-indigo-600 hover:underline">
              New Investigation
            </Link>
            <button onClick={() => window.print()} className="text-[12px] text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
              Print Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

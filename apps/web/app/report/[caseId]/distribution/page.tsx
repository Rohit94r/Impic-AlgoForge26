"use client";

import Link from "next/link";
import { useReportWorkflow } from "@/components/report/ReportWorkflowContext";
import { ContentTrace } from "@/components/report/ContentTrace";

export default function DistributionStepPage() {
  const { caseId, caseData } = useReportWorkflow();
  if (!caseData) return null;

  return (
    <>
      <div className="mb-6 rounded-xl border border-[#e8e4de] bg-white px-5 py-4">
        <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-1.5">
          Step 2 · Distribution Trace
        </p>
        <p className="text-[12.5px] text-[#374151] leading-relaxed">
          Sniffer scans known domains for visual matches using perceptual fingerprinting. Results below are live — no simulated data.
        </p>
      </div>

      <div className="mb-8">
        <ContentTrace caseId={caseId} />
      </div>

      <div className="mb-8 print:hidden">
        <Link
          href={`/report/${caseId}/takedown`}
          className="flex items-center justify-between gap-4 w-full rounded-2xl border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white px-6 py-4 hover:bg-[#1a1a1a] hover:border-[#1a1a1a] transition-all group"
        >
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-0.5">Step 3 of 3</p>
            <p className="text-[15px] font-semibold">Execute Takedown →</p>
            <p className="text-[12px] text-white/60 mt-0.5">Generate DMCA notices and platform-specific removal requests</p>
          </div>
          <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </>
  );
}

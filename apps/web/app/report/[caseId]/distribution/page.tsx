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

      <div className="mb-8 rounded-xl border border-[#e8e4de] bg-white px-5 py-4 print:hidden">
        <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">Next Step</p>
        <p className="text-[12.5px] text-[#374151] mb-3 leading-relaxed">
          Use the distribution intelligence above to prepare platform-specific takedown actions.
        </p>
        <Link
          href={`/report/${caseId}/takedown`}
          className="inline-flex items-center gap-2 text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
        >
          Execute Takedown →
        </Link>
      </div>
    </>
  );
}

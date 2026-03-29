import type { CaseData } from "./types";
import { formatDate } from "./utils";

interface Props {
  caseRef: string;
  verdict: string;
  verdictColor: string;
  caseData: CaseData;
  forensicCertainty?: string;
  tamperRegionCount?: number;
}

export function CaseHeader({ caseRef, caseData }: Props) {
  return (
    <div className="pb-5 mb-5 border-b border-[#e8e4de] print:border-[#0a0a0a]">
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {[
          { label: "Case Reference", value: caseRef },
          { label: "Date", value: formatDate(caseData.created_at) },
          { label: "Platform", value: caseData.platform_source },
          { label: "Issue Type", value: caseData.issue_type },
          { label: "Report Type", value: caseData.anonymous ? "Anonymous" : "Named" },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[9px] font-mono text-[#a8a29e] uppercase tracking-widest">{item.label}</p>
            <p className={`mt-0.5 font-medium text-[#0a0a0a] ${item.label === "Case Reference" ? "font-mono text-[14px]" : "text-[13px]"}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {caseData.description && (
        <p className="mt-4 text-[12.5px] text-[#6b7280] border-l-2 border-[#e8e4de] pl-4 italic leading-relaxed">
          &ldquo;{caseData.description}&rdquo;
        </p>
      )}
    </div>
  );
}

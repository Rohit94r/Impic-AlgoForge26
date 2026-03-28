"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const PLATFORMS = [
  "Instagram", "Twitter / X", "Telegram", "Facebook",
  "Reddit", "TikTok", "WhatsApp", "Other",
];

const ISSUE_TYPES = [
  { value: "AI-generated deepfake", label: "AI-generated deepfake" },
  { value: "Face swap / manipulation", label: "Face swap / manipulation" },
  { value: "Edited or altered image", label: "Edited or altered image" },
  { value: "Other manipulation", label: "Other" },
];

export default function VerifyPage() {
  const router = useRouter();
  const [platform, setPlatform] = useState("Instagram");
  const [issueType, setIssueType] = useState("AI-generated deepfake");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/cases/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous: true,
          platform_source: platform,
          issue_type: issueType,
          pipeline_type: "deepfake",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Failed to create case");
      }
      const json = await res.json() as { case_id: string };
      void fetch("/api/claim/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "case_created",
          caseId: json.case_id,
          platformSource: platform,
          issueType,
          pipelineType: "deepfake",
          anonymous: true,
        }),
        keepalive: true,
      }).catch(() => {});
      router.push(`/verify/upload?caseId=${json.case_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#f0ede8] px-6 py-4 flex items-center gap-3">
        <Link href="/" className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity">
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <Link href="/start" className="text-[13px] text-[#9ca3af] hover:text-[#0a0a0a] transition-colors">
          Start
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="text-[13px] text-[#9ca3af]">Deepfake Analysis</span>
      </header>

      <main className="max-w-xl mx-auto px-6 py-14">
        <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
          <span className="font-mono text-[10px] text-indigo-600 uppercase tracking-widest">Deepfake · Forensic Analysis</span>
        </div>

        <h1
          className="text-3xl text-[#0a0a0a] leading-snug mt-4 mb-2"
          style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
        >
          Start your investigation
        </h1>
        <p className="text-[14px] text-[#6b7280] mb-8">
          Tell us where the content appeared and what type of manipulation is suspected. Then upload the image to run forensic analysis.
        </p>

        <form onSubmit={submit} className="space-y-6">
          {/* Platform */}
          <div>
            <label className="block text-[11px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">
              Platform where content appeared
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`px-3.5 py-2 rounded-full border text-[13px] font-medium transition-all ${
                    platform === p
                      ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                      : "border-[#e8e4de] text-[#374151] hover:border-[#0a0a0a] bg-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Issue type */}
          <div>
            <label className="block text-[11px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">
              Type of manipulation
            </label>
            <div className="flex flex-col gap-2">
              {ISSUE_TYPES.map((it) => (
                <button
                  key={it.value}
                  type="button"
                  onClick={() => setIssueType(it.value)}
                  className={`text-left px-4 py-3 rounded-xl border text-[13.5px] transition-all flex items-center justify-between ${
                    issueType === it.value
                      ? "border-indigo-400 bg-indigo-50 text-[#0a0a0a]"
                      : "border-[#e8e4de] bg-white text-[#374151] hover:border-[#9ca3af]"
                  }`}
                >
                  {it.label}
                  {issueType === it.value && (
                    <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                      <svg width="8" height="8" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link href="/start" className="text-[13px] text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
              ← Back
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 bg-[#0a0a0a] text-white text-[13px] font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a1a1a] transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating case…
                </>
              ) : (
                "Upload Image →"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

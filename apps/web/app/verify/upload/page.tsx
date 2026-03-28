"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DropZone } from "@/components/upload/DropZone";
import { ReferenceQuestion } from "@/components/upload/ReferenceQuestion";
import { ReferenceUploadPhase } from "@/components/upload/ReferenceUploadPhase";
import { AnalysisLoader } from "@/components/dashboard/AnalysisLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const ANALYSIS_STEPS = [
  "Creating case evidence",
  "Analyzing image metadata",
  "Scanning for manipulation signals",
  "Comparing image structures",
  "Generating forensic report",
];

type Phase = "suspicious" | "reference_question" | "reference_upload" | "analyzing";

function UploadContent() {
  const router = useRouter();
  const params = useSearchParams();
  const caseId = params.get("caseId");

  const [phase, setPhase] = useState<Phase>("suspicious");
  const [suspiciousFile, setSuspiciousFile] = useState<File | null>(null);
  const [suspiciousPreview, setSuspiciousPreview] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) router.replace("/verify");
  }, [caseId, router]);

  function handleSuspiciousFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }
    setError(null);
    setSuspiciousFile(file);
    setSuspiciousPreview(URL.createObjectURL(file));
  }

  function handleReferenceFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setError(null);
    setReferenceFile(file);
    setReferencePreview(URL.createObjectURL(file));
  }

  function handleEvidenceFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file for supporting evidence.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Evidence file must be under 10 MB.");
      return;
    }
    setError(null);
    setEvidenceFile(file);
    setEvidencePreview(URL.createObjectURL(file));
  }

  async function storePreview(src: string, key: string) {
    try {
      const canvas = document.createElement("canvas");
      const img = new Image();
      img.src = src;
      await new Promise<void>((res) => {
        img.onload = () => res();
      });
      canvas.width = Math.min(img.width, 480);
      canvas.height = Math.round((canvas.width / img.width) * img.height);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      sessionStorage.setItem(key, canvas.toDataURL("image/jpeg", 0.75));
    } catch {
      // non-critical
    }
  }

  async function startAnalysis(withReference: boolean) {
    if (!suspiciousFile || !caseId) return;
    setPhase("analyzing");
    setAnalysisStep(0);
    setError(null);

    // Store image thumbnails for report page
    if (suspiciousPreview) await storePreview(suspiciousPreview, `sniffer_suspicious_${caseId}`);
    if (withReference && referencePreview) await storePreview(referencePreview, `sniffer_reference_${caseId}`);
    if (evidencePreview) await storePreview(evidencePreview, `sniffer_evidence_${caseId}`);

    // Advance steps every 700ms
    const interval = setInterval(() => {
      setAnalysisStep((s) => {
        if (s >= ANALYSIS_STEPS.length - 1) {
          clearInterval(interval);
          return s;
        }
        return s + 1;
      });
    }, 700);

    const minDelay = new Promise<void>((res) => setTimeout(res, 3800));

    try {
      const formData = new FormData();
      formData.append("suspicious_image", suspiciousFile);
      if (withReference && referenceFile) {
        formData.append("reference_image", referenceFile);
      }
      if (evidenceFile) {
        formData.append("evidence_image", evidenceFile);
      }

      const [res] = await Promise.all([
        fetch(`${API_URL}/api/analysis/${caseId}/run`, {
          method: "POST",
          body: formData,
        }),
        minDelay,
      ]);

      clearInterval(interval);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail || "Analysis failed");
      }

      const discoveryData = new FormData();
      discoveryData.append("suspicious_image", suspiciousFile);
      void fetch(`${API_URL}/api/analysis/${caseId}/discover`, {
        method: "POST",
        body: discoveryData,
      }).catch(() => {
        // Discovery is additive. The forensic report should still load even if trace startup fails.
      });

      await new Promise<void>((res) => setTimeout(res, 400));
      router.push(`/report/${caseId}`);
    } catch (e) {
      clearInterval(interval);
      setPhase("suspicious");
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    }
  }

  if (!caseId) return null;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Nav */}
      <header className="border-b border-[#e8e4de] px-6 py-4 flex items-center gap-3 bg-white">
        <Link
          href="/"
          className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity"
        >
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <Link href="/verify" className="text-[13px] text-[#9ca3af] hover:text-[#0a0a0a] transition-colors">
          New Case
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="font-mono text-[12px] text-[#9ca3af]">{caseId.slice(0, 8).toUpperCase()}</span>
      </header>

      {phase === "analyzing" && (
        <AnalysisLoader 
          image={suspiciousPreview || ""} 
          onComplete={() => {
            // Animation finished
          }}
        />
      )}

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Phase 1: Upload suspicious image */}
        {phase === "suspicious" && (
          <div>
            <p className="font-mono text-[11px] text-indigo-500 uppercase tracking-widest mb-3">Upload</p>
            <h1
              className="text-3xl text-[#0a0a0a] leading-snug mb-2"
              style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
            >
              Upload the suspicious image
            </h1>
            <p className="text-sm text-[#6b7280] mb-8">
              Supports JPG, PNG, WEBP — up to 10 MB. This image will be submitted for forensic analysis.
            </p>

            <DropZone
              file={suspiciousFile}
              preview={suspiciousPreview}
              onFile={handleSuspiciousFile}
              onClear={() => { setSuspiciousFile(null); setSuspiciousPreview(null); }}
            />

            {/* Supporting Evidence upload */}
            {suspiciousFile && (
              <div className="mt-6 rounded-xl border border-[#e8e4de] bg-white p-5">
                <p className="text-[11px] font-mono text-[#a8a29e] uppercase tracking-widest mb-1">
                  Supporting Evidence <span className="text-[#c4bdb5]">— optional</span>
                </p>
                <p className="text-[12px] text-[#6b7280] mb-4 leading-relaxed">
                  Upload a screenshot showing where this content appeared online (Telegram, social media, a website, etc.). 
                  This helps identify where the content is spreading.
                </p>
                {evidenceFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-[#e8e4de] bg-[#fafaf8]">
                    {evidencePreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={evidencePreview} alt="Evidence" className="w-12 h-12 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#0a0a0a] truncate">{evidenceFile.name}</p>
                      <p className="text-[11px] text-[#9ca3af]">Supporting evidence uploaded</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setEvidenceFile(null); setEvidencePreview(null); }}
                      className="text-[11px] text-[#9ca3af] hover:text-red-500 transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-[#e8e4de] bg-[#fafaf8] cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#f0ede8] flex items-center justify-center shrink-0">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9l4-4 4 4 4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-[12px] text-[#6b7280]">Click to upload a screenshot or drag one here</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleEvidenceFile(f); }}
                    />
                  </label>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center mt-8">
              <Link href="/verify" className="text-[13px] text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
                ← Back to questions
              </Link>
              <button
                type="button"
                onClick={() => setPhase("reference_question")}
                disabled={!suspiciousFile}
                className="px-6 py-2.5 bg-[#0a0a0a] text-white text-[13px] font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a1a1a] transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {phase === "reference_question" && (
          <ReferenceQuestion
            onUpload={() => setPhase("reference_upload")}
            onSkip={() => startAnalysis(false)}
            onBack={() => setPhase("suspicious")}
          />
        )}

        {phase === "reference_upload" && (
          <ReferenceUploadPhase
            suspiciousPreview={suspiciousPreview}
            referenceFile={referenceFile}
            referencePreview={referencePreview}
            onFile={handleReferenceFile}
            onClear={() => { setReferenceFile(null); setReferencePreview(null); }}
            onSubmit={() => startAnalysis(true)}
            onBack={() => setPhase("reference_question")}
            error={error}
          />
        )}
      </main>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense>
      <UploadContent />
    </Suspense>
  );
}

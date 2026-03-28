"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DropZone } from "@/components/upload/DropZone";
import { AnalysisLoader } from "@/components/dashboard/AnalysisLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const ANALYSIS_STEPS = [
  "Creating case evidence",
  "Analyzing image metadata",
  "Scanning for manipulation signals",
  "Comparing image structures",
  "Generating forensic report",
];

async function storePreview(src: string, key: string) {
  try {
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.src = src;
    await new Promise<void>((res) => { img.onload = () => res(); });
    canvas.width = Math.min(img.width, 480);
    canvas.height = Math.round((canvas.width / img.width) * img.height);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    sessionStorage.setItem(key, canvas.toDataURL("image/jpeg", 0.75));
  } catch { /* non-critical */ }
}

function UploadContent() {
  const router = useRouter();
  const params = useSearchParams();
  const caseId = params.get("caseId");

  const [suspiciousFile, setSuspiciousFile] = useState<File | null>(null);
  const [suspiciousPreview, setSuspiciousPreview] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) router.replace("/verify");
  }, [caseId, router]);

  function handleFile(file: File, setter: (f: File) => void, previewSetter: (s: string) => void) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }
    setError(null);
    setter(file);
    previewSetter(URL.createObjectURL(file));
  }

  async function startAnalysis() {
    if (!suspiciousFile || !caseId) return;
    setAnalyzing(true);
    setAnalysisStep(0);
    setError(null);

    if (suspiciousPreview) await storePreview(suspiciousPreview, `sniffer_suspicious_${caseId}`);
    if (referencePreview) await storePreview(referencePreview, `sniffer_reference_${caseId}`);
    if (evidencePreview) await storePreview(evidencePreview, `sniffer_evidence_${caseId}`);

    const interval = setInterval(() => {
      setAnalysisStep((s) => {
        if (s >= ANALYSIS_STEPS.length - 1) { clearInterval(interval); return s; }
        return s + 1;
      });
    }, 700);

    const minDelay = new Promise<void>((res) => setTimeout(res, 3800));

    try {
      const formData = new FormData();
      formData.append("suspicious_image", suspiciousFile);
      if (referenceFile) formData.append("reference_image", referenceFile);
      if (evidenceFile) formData.append("evidence_image", evidenceFile);

      const [res] = await Promise.all([
        fetch(`${API_URL}/api/analysis/${caseId}/run`, { method: "POST", body: formData }),
        minDelay,
      ]);

      clearInterval(interval);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail || "Analysis failed");
      }

      // Kick off discovery scan in background (non-blocking)
      const discoveryData = new FormData();
      discoveryData.append("suspicious_image", suspiciousFile);
      void fetch(`${API_URL}/api/analysis/${caseId}/discover`, {
        method: "POST",
        body: discoveryData,
      }).catch(() => {});

      await new Promise<void>((res) => setTimeout(res, 400));
      router.push(`/report/${caseId}/analysis`);
    } catch (e) {
      clearInterval(interval);
      setAnalyzing(false);
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    }
  }

  if (!caseId) return null;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="border-b border-[#e8e4de] px-6 py-4 flex items-center gap-3 bg-white">
        <Link href="/" className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity">
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <Link href="/verify" className="text-[13px] text-[#9ca3af] hover:text-[#0a0a0a] transition-colors">
          New Case
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="font-mono text-[12px] text-[#9ca3af]">{caseId.slice(0, 8).toUpperCase()}</span>
      </header>

      {analyzing && (
        <AnalysisLoader
          image={suspiciousPreview || ""}
          onComplete={() => {}}
        />
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <p className="font-mono text-[11px] text-indigo-500 uppercase tracking-widest mb-2">Upload</p>
        <h1
          className="text-3xl text-[#0a0a0a] leading-snug mb-1"
          style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
        >
          Upload your images
        </h1>
        <p className="text-sm text-[#6b7280] mb-8">
          Upload the suspicious image to analyze. Reference and evidence uploads are optional but improve results.
        </p>

        {/* Three upload zones in a row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Suspicious — required */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#0a0a0a] uppercase tracking-widest font-semibold">Suspicious Image</span>
              <span className="text-[10px] font-mono text-red-500 uppercase">Required</span>
            </div>
            <p className="text-[11.5px] text-[#9ca3af] leading-relaxed">
              The image you suspect has been manipulated or AI-generated.
            </p>
            <DropZone
              file={suspiciousFile}
              preview={suspiciousPreview}
              onFile={(f) => handleFile(f, setSuspiciousFile, setSuspiciousPreview)}
              onClear={() => { setSuspiciousFile(null); setSuspiciousPreview(null); }}
              label="Drop suspicious image"
              compact
            />
          </div>

          {/* Reference — optional */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#6b7280] uppercase tracking-widest">Reference Image</span>
              <span className="text-[10px] font-mono text-[#c4bdb5] uppercase">Optional</span>
            </div>
            <p className="text-[11.5px] text-[#9ca3af] leading-relaxed">
              The known-authentic original for pixel-level comparison and hash validation.
            </p>
            <DropZone
              file={referenceFile}
              preview={referencePreview}
              onFile={(f) => handleFile(f, setReferenceFile, setReferencePreview)}
              onClear={() => { setReferenceFile(null); setReferencePreview(null); }}
              label="Drop reference image"
              compact
            />
          </div>

          {/* Evidence — optional */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#6b7280] uppercase tracking-widest">Supporting Evidence</span>
              <span className="text-[10px] font-mono text-[#c4bdb5] uppercase">Optional</span>
            </div>
            <p className="text-[11.5px] text-[#9ca3af] leading-relaxed">
              Screenshot showing where the content appeared online (Telegram, social media, etc.).
            </p>
            <DropZone
              file={evidenceFile}
              preview={evidencePreview}
              onFile={(f) => handleFile(f, setEvidenceFile, setEvidencePreview)}
              onClear={() => { setEvidenceFile(null); setEvidencePreview(null); }}
              label="Drop screenshot evidence"
              compact
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link href="/verify" className="text-[13px] text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
            ← Change details
          </Link>
          <button
            type="button"
            onClick={startAnalysis}
            disabled={!suspiciousFile || analyzing}
            className="px-8 py-3 bg-[#0a0a0a] text-white text-[13px] font-semibold rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a1a1a] transition-colors flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing…
              </>
            ) : (
              "Run Forensic Analysis →"
            )}
          </button>
        </div>

        {!suspiciousFile && (
          <p className="text-center text-[11.5px] text-[#c4bdb5] mt-4 font-mono">
            Upload the suspicious image to enable analysis
          </p>
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

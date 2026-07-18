\"use client";

import { useState, useCallback } from "react";
import PhotoUpload from "@/components/PhotoUpload";
import ResultsDisplay from "@/components/ResultsDisplay";
import DebugOverlay from "@/components/DebugOverlay";
import ManualPointPlacement from "@/components/ManualPointPlacement";
import { AnalysisResult, Point, VisionScores } from "@/lib/types";
import { calculateAllMetrics } from "@/lib/metrics";
import { calculateOverallScore } from "@/lib/scoring";
import Link from "next/link";

async function imageUrlToBase64(url: string): Promise<{ base64: string; mediaType: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  const mediaType = "image/jpeg";

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 1024;
      let width = img.width;
      let height = img.height;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, mediaType });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

async function getVisionScore(imageUrl: string): Promise<{ visionScores?: VisionScores; visionError?: string }> {
  try {
    const { base64, mediaType } = await imageUrlToBase64(imageUrl);
    const response = await fetch("/api/vision-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, imageMediaType: mediaType }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      return { visionError: errorData.error || "Vision API request failed" };
    }
    const data = await response.json();
    if (data.result) return { visionScores: data.result as VisionScores };
    return { visionError: "No result from vision API" };
  } catch (error) {
    console.error("Vision score error:", error);
    return { visionError: error instanceof Error ? error.message : "Unknown error" };
  }
}

type AppState = "upload" | "debug" | "results" | "error" | "manual";

export default function Home() {
  const [state, setState] = useState<AppState>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [manualImageData, setManualImageData] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);

  const handleImageSelect = useCallback((file: File) => {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    const img = new Image();
    img.onload = () => {
      setManualImageData({
        url: URL.createObjectURL(file),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setState("manual");
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const handleManualComplete = useCallback((landmarks: Point[]) => {
    if (!manualImageData) return;
    const landmarkArray: Point[] = new Array(53).fill({ x: 0, y: 0 });
    landmarks.forEach((point, arrayIndex) => {
      const faceiqIndex = arrayIndex + 1;
      landmarkArray[faceiqIndex] = point;
    });
    const metrics = calculateAllMetrics({
      landmarks: landmarkArray,
      imageWidth: manualImageData.width,
      imageHeight: manualImageData.height,
    });
    const scores = metrics.map((m) => m.score);
    const metricIds = metrics.map((m) => m.definition.id);
    const overallScore = calculateOverallScore(scores, metricIds);
    const analysisResult: AnalysisResult = {
      metrics,
      overallScore,
      imageUrl: manualImageData.url,
      analyzedAt: new Date(),
      landmarks: landmarkArray,
      imageWidth: manualImageData.width,
      imageHeight: manualImageData.height,
      visionScores: undefined,
      visionError: undefined,
      finalScore: undefined,
    };
    setResult(analysisResult);
    setState("results");
    getVisionScore(manualImageData.url).then(({ visionScores, visionError }) => {
      setResult((prev) => {
        if (!prev) return prev;
        let visionAvg: number | undefined;
        if (visionScores) {
          const scores = [
            visionScores.jaw_definition,
            visionScores.cheekbone_prominence,
            visionScores.skin_quality,
            visionScores.sexual_dimorphism,
            visionScores.facial_fat,
            visionScores.overall_harmony,
            visionScores.eye_appeal,
            visionScores.overall_impression,
          ];
          visionAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
        }
        const finalScore = visionAvg !== undefined
          ? (prev.overallScore * 0.5) + (visionAvg * 0.5)
          : prev.overallScore;
        return { ...prev, visionScores, visionError, finalScore };
      });
    });
  }, [manualImageData]);

  const handleManualCancel = useCallback(() => {
    setState("upload");
    setManualImageData(null);
  }, []);

  const handleContinueToResults = useCallback(() => {
    setState("results");
  }, []);

  const handleReset = useCallback(() => {
    setState("upload");
    setImageFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setManualImageData(null);
  }, []);

  if (state === "manual" && manualImageData) {
    return (
      <ManualPointPlacement
        imageUrl={manualImageData.url}
        imageWidth={manualImageData.width}
        imageHeight={manualImageData.height}
        onComplete={handleManualComplete}
        onCancel={handleManualCancel}
      />
    );
  }

  if (state === "debug" && result && result.landmarks) {
    return (
      <DebugOverlay
        imageUrl={result.imageUrl}
        landmarks={result.landmarks}
        imageWidth={result.imageWidth || 0}
        imageHeight={result.imageHeight || 0}
        onContinue={handleContinueToResults}
      />
    );
  }

  if (state === "results" && result) {
    return <ResultsDisplay result={result} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col">
      <header className="flex items-center justify-between px-8 py-6 border-b border-zinc-200">
        <Link href="/dashboard" className="text-lg font-semibold text-black tracking-tight">
          Paxxora
        </Link>
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-black transition-colors">
          ← Back
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <div className="text-center mb-10">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-4">
              Step 1 of 2
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-black tracking-tight mb-3">
              Upload your photo
            </h1>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed">
              Use a clear, front-facing photo with good lighting. No sunglasses, no tilted angles.
            </p>
          </div>

          <PhotoUpload onImageSelect={handleImageSelect} isAnalyzing={false} />

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-500 text-sm text-center">{error}</p>
              <button onClick={handleReset} className="mt-3 w-full py-2 text-sm text-red-400 hover:text-red-500 transition-colors">
                Try Again
              </button>
            </div>
          )}

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { value: "33", label: "Facial Metrics" },
              { value: "52", label: "Key Landmarks" },
              { value: "0–10", label: "Precision Score" },
            ].map((stat) => (
              <div key={stat.label} className="p-4 bg-white rounded-xl border border-zinc-200">
                <div className="text-xl font-semibold text-black mb-1">{stat.value}</div>
                <div className="text-xs text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-6 bg-white rounded-xl border border-zinc-200">
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-4">How it works</h3>
            <div className="space-y-3">
              {[
                "Upload a clear, front-facing photo with good lighting",
                "Place 52 key facial landmarks with guided reference images",
                "33 metrics calculated and scored against ideal ranges",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-zinc-500">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 px-8 py-4 text-center text-xs text-zinc-400">
        All analysis runs locally in your browser. No images are stored on any server.
      </footer>
    </div>
  );
}
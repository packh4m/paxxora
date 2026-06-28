"use client";

import { useState, useCallback } from "react";
import PhotoUpload from "@/components/PhotoUpload";
import ResultsDisplay from "@/components/ResultsDisplay";
import DebugOverlay from "@/components/DebugOverlay";
import ManualPointPlacement from "@/components/ManualPointPlacement";
import { AnalysisResult, Point, VisionScores } from "@/lib/types";
import { runScoringTest, testDeviationScoring, testModelPhoto, testBelowAverage } from "@/lib/testScoring";
import { calculateAllMetrics } from "@/lib/metrics";
import { calculateOverallScore } from "@/lib/scoring";

// Helper function to convert image URL to base64
async function imageUrlToBase64(url: string): Promise<{ base64: string; mediaType: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  const mediaType = blob.type || "image/jpeg";

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Remove the "data:image/jpeg;base64," prefix
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper function to call vision score API
async function getVisionScore(imageUrl: string): Promise<{ visionScores?: VisionScores; visionError?: string }> {
  try {
    const { base64, mediaType } = await imageUrlToBase64(imageUrl);

    const response = await fetch("/api/vision-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageBase64: base64,
        imageMediaType: mediaType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { visionError: errorData.error || "Vision API request failed" };
    }

    const data = await response.json();
    if (data.result) {
      return { visionScores: data.result as VisionScores };
    }
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
    // Go directly to manual placement
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

    // 52-point landmark system (1-indexed, FaceIQ compatible)
    // landmarks array from UI is 0-indexed with 52 elements
    // We create a size-53 array so indices 1-52 work directly
    const landmarkArray: Point[] = new Array(53).fill({ x: 0, y: 0 });

    // Store each placed point at its FaceIQ index (1-52)
    landmarks.forEach((point, arrayIndex) => {
      const faceiqIndex = arrayIndex + 1; // Convert 0-indexed to 1-indexed
      landmarkArray[faceiqIndex] = point;
    });

    // Calculate metrics
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
      // Vision scores will be added after API call
      visionScores: undefined,
      visionError: undefined,
      finalScore: undefined,
    };

    setResult(analysisResult);
    setState("results");

    // Start vision analysis in background
    getVisionScore(manualImageData.url).then(({ visionScores, visionError }) => {
      setResult((prev) => {
        if (!prev) return prev;

        // Calculate vision score average
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

        // Calculate final score (50% geometric + 50% vision)
        const finalScore = visionAvg !== undefined
          ? (prev.overallScore * 0.5) + (visionAvg * 0.5)
          : prev.overallScore;

        return {
          ...prev,
          visionScores,
          visionError,
          finalScore,
        };
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

  // Show manual placement mode
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

  // Show debug overlay first
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

  // Show results view
  if (state === "results" && result) {
    return <ResultsDisplay result={result} onReset={handleReset} />;
  }

  // Show upload/analyzing view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-white text-center">
            LooksLadder
          </h1>
          <p className="text-gray-400 text-center mt-1">
            Precise Facial Analysis
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Hero text */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">
              Analyze Your Facial Metrics
            </h2>
            <p className="text-gray-400">
              Upload a front-facing photo to receive detailed analysis of 30
              facial measurements scored against ideal anthropometric ranges.
            </p>
          </div>

          {/* Upload area */}
          <PhotoUpload
            onImageSelect={handleImageSelect}
            isAnalyzing={false}
          />

          {/* Error message */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
              <button
                onClick={handleReset}
                className="mt-3 w-full py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Features list */}
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">30</div>
              <div className="text-xs text-gray-500">Facial Metrics</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">52</div>
              <div className="text-xs text-gray-500">Key Landmarks</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">0-10</div>
              <div className="text-xs text-gray-500">Precision Scoring</div>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-12 p-6 bg-surface rounded-2xl border border-border">
            <h3 className="text-sm font-medium text-white mb-4">How it works</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center">
                  1
                </span>
                <p className="text-sm text-gray-400">
                  Upload a clear, front-facing photo with good lighting
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center">
                  2
                </span>
                <p className="text-sm text-gray-400">
                  Place 52 key facial landmarks with guided reference images
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center">
                  3
                </span>
                <p className="text-sm text-gray-400">
                  30 metrics calculated and scored against ideal ranges
                </p>
              </div>
            </div>
          </div>

          {/* Debug: Scoring Tests */}
          <div className="mt-6 p-6 bg-surface rounded-2xl border border-yellow-500/30">
            <h3 className="text-sm font-medium text-yellow-400 mb-4">
              Debug: Test Penalty-Based Scoring
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Open browser console (F12) to see full metric breakdowns
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => testModelPhoto()}
                className="px-4 py-2 text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                Model Photo (8.0-8.8)
              </button>
              <button
                onClick={() => testBelowAverage()}
                className="px-4 py-2 text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Below Average (3.5-4.5)
              </button>
              <button
                onClick={() => runScoringTest("perfect")}
                className="px-4 py-2 text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                Perfect Values (9.5-10)
              </button>
              <button
                onClick={() => testDeviationScoring()}
                className="px-4 py-2 text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                Penalty Curve Test
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-xs text-gray-500">
          All analysis runs locally in your browser. No images are uploaded to any server.
        </div>
      </footer>
    </div>
  );
}

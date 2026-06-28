"use client";

import { useEffect, useRef } from "react";
import { Point } from "@/lib/types";
import { calculateCoreMetrics, CoreMetrics } from "@/lib/metrics";

interface DebugOverlayProps {
  imageUrl: string;
  landmarks: Point[];
  imageWidth: number;
  imageHeight: number;
  onContinue: () => void;
}

// PROVEN RELIABLE LANDMARKS - with colors for visualization
const DEBUG_LANDMARKS = {
  // Eyes - Left (GREEN)
  leftEyeOuter: { idx: 33, color: "#00ff00", label: "33" },
  leftEyeInner: { idx: 133, color: "#00ff00", label: "133" },
  leftEyeTop: { idx: 159, color: "#00ff00", label: "159" },
  leftEyeBottom: { idx: 145, color: "#00ff00", label: "145" },

  // Eyes - Right (GREEN)
  rightEyeOuter: { idx: 263, color: "#00ff00", label: "263" },
  rightEyeInner: { idx: 362, color: "#00ff00", label: "362" },
  rightEyeTop: { idx: 386, color: "#00ff00", label: "386" },
  rightEyeBottom: { idx: 374, color: "#00ff00", label: "374" },

  // Nose (CYAN)
  noseTip: { idx: 4, color: "#00ffff", label: "4 (subnasale)" },
  sellion: { idx: 168, color: "#ff0000", label: "168 (sellion)" },  // RED - key reference
  leftAlar: { idx: 218, color: "#00ffff", label: "218" },
  rightAlar: { idx: 438, color: "#00ffff", label: "438" },

  // Mouth (MAGENTA)
  mouthLeft: { idx: 61, color: "#ff00ff", label: "61" },
  mouthRight: { idx: 291, color: "#ff00ff", label: "291" },
  upperLipTop: { idx: 0, color: "#ff00ff", label: "0" },
  lowerLipBottom: { idx: 17, color: "#ff00ff", label: "17" },

  // Brows (ORANGE)
  leftBrowInner: { idx: 46, color: "#ff9900", label: "46" },
  leftBrowOuter: { idx: 70, color: "#ff9900", label: "70" },
  rightBrowInner: { idx: 276, color: "#ff9900", label: "276" },
  rightBrowOuter: { idx: 300, color: "#ff9900", label: "300" },

  // Face structure (RED)
  glabella: { idx: 9, color: "#ff0000", label: "9" },
  chin: { idx: 152, color: "#ff0000", label: "152" },

  // Jaw / Face width (BLUE)
  leftJaw: { idx: 234, color: "#0066ff", label: "234" },
  rightJaw: { idx: 454, color: "#0066ff", label: "454" },

  // Cheekbones (BLUE)
  leftCheekbone: { idx: 116, color: "#0066ff", label: "116" },
  rightCheekbone: { idx: 345, color: "#0066ff", label: "345" },

  // Temples (BLUE)
  leftTemple: { idx: 127, color: "#0066ff", label: "127" },
  rightTemple: { idx: 356, color: "#0066ff", label: "356" },
};

export default function DebugOverlay({
  imageUrl,
  landmarks,
  imageWidth,
  imageHeight,
  onContinue,
}: DebugOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper to safely format numbers
  const fmt = (val: number | undefined, decimals: number = 1): string => {
    if (val === undefined || val === null || isNaN(val)) return "N/A";
    return val.toFixed(decimals);
  };

  // Calculate the 7 core metrics
  const coreMetrics: CoreMetrics | null = landmarks.length > 0
    ? calculateCoreMetrics({ landmarks, imageWidth, imageHeight })
    : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      ctx.drawImage(img, 0, 0, imageWidth, imageHeight);

      // Draw all 468 landmarks as tiny dots
      landmarks.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.fill();
      });

      // Draw key landmarks with labels
      Object.entries(DEBUG_LANDMARKS).forEach(([name, config]) => {
        const point = landmarks[config.idx];
        if (!point) return;

        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = config.color;
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(config.label, point.x + 8, point.y - 6);
        ctx.fillText(config.label, point.x + 8, point.y - 6);
      });

      // Draw measurement lines
      const glabella = landmarks[9];
      const chin = landmarks[152];
      const noseTip = landmarks[4];
      const leftJaw = landmarks[234];
      const rightJaw = landmarks[454];
      const leftAlar = landmarks[218];
      const rightAlar = landmarks[438];
      const mouthLeft = landmarks[61];
      const mouthRight = landmarks[291];

      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;

      // Face height line (9 to 152)
      ctx.strokeStyle = "#ff0000";
      ctx.beginPath();
      ctx.moveTo(glabella.x, glabella.y);
      ctx.lineTo(chin.x, chin.y);
      ctx.stroke();

      // Face width line (234 to 454)
      ctx.strokeStyle = "#0066ff";
      ctx.beginPath();
      ctx.moveTo(leftJaw.x, leftJaw.y);
      ctx.lineTo(rightJaw.x, rightJaw.y);
      ctx.stroke();

      // Nose width line (218 to 438)
      ctx.strokeStyle = "#00ffff";
      ctx.beginPath();
      ctx.moveTo(leftAlar.x, leftAlar.y);
      ctx.lineTo(rightAlar.x, rightAlar.y);
      ctx.stroke();

      // Mouth width line (61 to 291)
      ctx.strokeStyle = "#ff00ff";
      ctx.beginPath();
      ctx.moveTo(mouthLeft.x, mouthLeft.y);
      ctx.lineTo(mouthRight.x, mouthRight.y);
      ctx.stroke();

      // Upper/Lower face division at nose tip
      ctx.strokeStyle = "#ffff00";
      ctx.beginPath();
      ctx.moveTo(0, noseTip.y);
      ctx.lineTo(imageWidth, noseTip.y);
      ctx.stroke();

      ctx.setLineDash([]);
    };
    img.src = imageUrl;
  }, [imageUrl, landmarks, imageWidth, imageHeight]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <h1 className="text-xl font-bold text-red-400 mb-2">
            CORE METRICS DEBUG - Raw Values
          </h1>
          <p className="text-sm text-red-200/70">
            Compare these raw values with FaceIQ to identify calculation discrepancies.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Canvas with landmarks */}
          <div className="bg-surface rounded-2xl p-4 border border-border">
            <h2 className="text-sm font-medium text-gray-400 mb-3">
              Landmark Positions (using proven reliable indices)
            </h2>
            <canvas
              ref={canvasRef}
              className="w-full rounded-xl"
              style={{ maxHeight: "70vh", objectFit: "contain" }}
            />
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-gray-400">Face height (9→152)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-gray-400">Face width (234→454)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-gray-400">Eyes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                <span className="text-gray-400">Nose (218→438)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-fuchsia-500"></span>
                <span className="text-gray-400">Mouth (61→291)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="text-gray-400">Brows</span>
              </div>
            </div>
          </div>

          {/* Core metrics comparison */}
          <div className="space-y-4">
            {/* 7 CORE METRICS */}
            <div className="bg-surface rounded-2xl p-4 border border-red-500/30">
              <h2 className="text-lg font-bold text-red-400 mb-4">
                7 CORE METRICS - Raw Calculated Values
              </h2>

              {coreMetrics && (
                <div className="space-y-3">
                  {/* Metric comparison table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-mono">
                      <thead>
                        <tr className="text-gray-400 border-b border-border">
                          <th className="text-left py-2">Metric</th>
                          <th className="text-right py-2">Our Value</th>
                          <th className="text-right py-2">FaceIQ Est.</th>
                          <th className="text-right py-2">Ideal</th>
                        </tr>
                      </thead>
                      <tbody className="text-white">
                        <tr className="border-b border-border/50">
                          <td className="py-2">1. Face Width/Height</td>
                          <td className="text-right text-yellow-400 font-bold">
                            {fmt(coreMetrics.faceWidthToHeight, 3)}
                          </td>
                          <td className="text-right text-gray-500">~0.62-0.72</td>
                          <td className="text-right text-green-400">0.62-0.72</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2">3. Eye Aspect Ratio</td>
                          <td className="text-right text-yellow-400 font-bold">
                            {fmt(coreMetrics.eyeAspectRatio, 2)}
                          </td>
                          <td className="text-right text-gray-500">~3.0-3.5</td>
                          <td className="text-right text-green-400">3.0-3.5</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2">4. Canthal Tilt (avg)</td>
                          <td className="text-right text-yellow-400 font-bold">
                            {fmt(coreMetrics.canthalTiltAvg)}°
                          </td>
                          <td className="text-right text-gray-500">~3-8°</td>
                          <td className="text-right text-green-400">3-5°</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2">5. IPD (% face width)</td>
                          <td className="text-right text-yellow-400 font-bold">
                            {fmt(coreMetrics.interpupillaryDistance)}%
                          </td>
                          <td className="text-right text-gray-500">~42-48%</td>
                          <td className="text-right text-green-400">42-48%</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2">6. Nose Width (% face)</td>
                          <td className="text-right text-yellow-400 font-bold">
                            {fmt(coreMetrics.noseWidth)}%
                          </td>
                          <td className="text-right text-gray-500">~24-28%</td>
                          <td className="text-right text-green-400">~25%</td>
                        </tr>
                        <tr>
                          <td className="py-2">7. Mouth Width (% face)</td>
                          <td className="text-right text-yellow-400 font-bold">
                            {fmt(coreMetrics.mouthWidth)}%
                          </td>
                          <td className="text-right text-gray-500">~38-42%</td>
                          <td className="text-right text-green-400">~40%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <hr className="border-border my-4" />

                  {/* Canthal tilt breakdown */}
                  <div className="text-xs text-gray-400">
                    <p className="font-bold text-white mb-1">Canthal Tilt Breakdown:</p>
                    <p>Left eye: {fmt(coreMetrics.canthalTiltLeft, 2)}°</p>
                    <p>Right eye: {fmt(coreMetrics.canthalTiltRight, 2)}°</p>
                  </div>
                </div>
              )}
            </div>

            {/* Raw pixel values */}
            <div className="bg-surface rounded-2xl p-4 border border-border">
              <h2 className="text-sm font-medium text-gray-400 mb-3">
                Raw Pixel Measurements
              </h2>
              {coreMetrics && coreMetrics.raw && (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Face Width (234→454):</span>
                    <span className="text-white">{fmt(coreMetrics.raw.faceWidth)}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Face Height (168→152):</span>
                    <span className="text-white">{fmt(coreMetrics.raw.faceHeight)}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">L Eye W×H:</span>
                    <span className="text-white">
                      {coreMetrics.raw.leftEyeWidth.toFixed(1)}×{coreMetrics.raw.leftEyeHeight.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">R Eye W×H:</span>
                    <span className="text-white">
                      {coreMetrics.raw.rightEyeWidth.toFixed(1)}×{coreMetrics.raw.rightEyeHeight.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">IPD:</span>
                    <span className="text-white">{coreMetrics.raw.ipd.toFixed(1)}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nose Width:</span>
                    <span className="text-white">{coreMetrics.raw.noseWidthPx.toFixed(1)}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mouth Width:</span>
                    <span className="text-white">{coreMetrics.raw.mouthWidthPx.toFixed(1)}px</span>
                  </div>
                </div>
              )}
            </div>

            {/* Landmark coordinates for key points */}
            <div className="bg-surface rounded-2xl p-4 border border-border max-h-48 overflow-y-auto">
              <h2 className="text-sm font-medium text-gray-400 mb-3">
                Key Landmark Coordinates
              </h2>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                {[
                  { name: "Sellion (168)", idx: 168 },
                  { name: "Subnasale (4)", idx: 4 },
                  { name: "Menton (152)", idx: 152 },
                  { name: "L Jaw (234)", idx: 234 },
                  { name: "R Jaw (454)", idx: 454 },
                  { name: "L Alar (218)", idx: 218 },
                  { name: "R Alar (438)", idx: 438 },
                  { name: "Mouth L (61)", idx: 61 },
                  { name: "Mouth R (291)", idx: 291 },
                  { name: "L Eye Out (33)", idx: 33 },
                  { name: "L Eye In (133)", idx: 133 },
                  { name: "R Eye Out (263)", idx: 263 },
                  { name: "R Eye In (362)", idx: 362 },
                ].map(({ name, idx }) => (
                  <div key={idx} className="flex justify-between py-0.5">
                    <span className="text-gray-500">{name}:</span>
                    <span className="text-white">
                      ({landmarks[idx]?.x.toFixed(0)}, {landmarks[idx]?.y.toFixed(0)})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue button */}
            <button
              onClick={onContinue}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
            >
              Continue to Scoring →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

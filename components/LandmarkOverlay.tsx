"use client";

import { useEffect, useRef } from "react";
import { Point } from "@/lib/types";

interface LandmarkOverlayProps {
  imageUrl: string;
  landmarks: Point[];
  imageWidth: number;
  imageHeight: number;
}

// Key landmarks to highlight with labels
const KEY_LANDMARKS: Record<number, { name: string; color: string }> = {
  // Face outline
  10: { name: "Forehead", color: "#ff0000" },
  152: { name: "Chin", color: "#ff0000" },

  // Eyebrows
  105: { name: "L Brow In", color: "#ff9900" },
  46: { name: "L Brow Out", color: "#ff9900" },
  334: { name: "R Brow In", color: "#ff9900" },
  276: { name: "R Brow Out", color: "#ff9900" },
  66: { name: "L Brow Peak", color: "#ffcc00" },
  296: { name: "R Brow Peak", color: "#ffcc00" },

  // Eyes
  33: { name: "L Eye Out", color: "#00ff00" },
  133: { name: "L Eye In", color: "#00ff00" },
  159: { name: "L Eye Top", color: "#00ff00" },
  145: { name: "L Eye Bot", color: "#00ff00" },
  263: { name: "R Eye Out", color: "#00ff00" },
  362: { name: "R Eye In", color: "#00ff00" },
  386: { name: "R Eye Top", color: "#00ff00" },
  374: { name: "R Eye Bot", color: "#00ff00" },

  // Nose
  6: { name: "Nasion", color: "#00ffff" },
  4: { name: "Nose Tip", color: "#00ffff" },
  2: { name: "Subnasale", color: "#00ffff" },
  98: { name: "L Alar", color: "#00ffff" },
  327: { name: "R Alar", color: "#00ffff" },

  // Mouth
  0: { name: "Upper Lip", color: "#ff00ff" },
  17: { name: "Lower Lip", color: "#ff00ff" },
  61: { name: "Mouth L", color: "#ff00ff" },
  291: { name: "Mouth R", color: "#ff00ff" },

  // Jaw/Cheeks
  234: { name: "L Cheek", color: "#0066ff" },
  454: { name: "R Cheek", color: "#0066ff" },
  172: { name: "L Gonion", color: "#0066ff" },
  397: { name: "R Gonion", color: "#0066ff" },
  127: { name: "L Temple", color: "#0066ff" },
  356: { name: "R Temple", color: "#0066ff" },
};

export default function LandmarkOverlay({
  imageUrl,
  landmarks,
  imageWidth,
  imageHeight,
}: LandmarkOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !landmarks.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Set canvas size to match container
      const containerWidth = container.clientWidth;
      const scale = containerWidth / imageWidth;
      const displayHeight = imageHeight * scale;

      canvas.width = containerWidth;
      canvas.height = displayHeight;

      // Draw image
      ctx.drawImage(img, 0, 0, containerWidth, displayHeight);

      // Draw all landmarks as small dots
      landmarks.forEach((point, index) => {
        const x = point.x * scale;
        const y = point.y * scale;

        const keyLandmark = KEY_LANDMARKS[index];

        if (keyLandmark) {
          // Draw larger circle for key landmarks
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = keyLandmark.color;
          ctx.fill();

          // Draw label
          ctx.font = "10px sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.strokeText(keyLandmark.name, x + 6, y + 3);
          ctx.fillText(keyLandmark.name, x + 6, y + 3);
        } else {
          // Draw small dot for other landmarks
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.fill();
        }
      });

      // Draw face outline connecting key points
      ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical midline
      const foreheadTop = landmarks[10];
      const chin = landmarks[152];
      ctx.beginPath();
      ctx.moveTo(foreheadTop.x * scale, foreheadTop.y * scale);
      ctx.lineTo(chin.x * scale, chin.y * scale);
      ctx.stroke();

      // Horizontal lines for thirds
      const leftBrowIn = landmarks[105];
      const rightBrowIn = landmarks[334];
      const browY = ((leftBrowIn?.y || 0) + (rightBrowIn?.y || 0)) / 2 * scale;

      const subnasale = landmarks[2];
      const noseY = (subnasale?.y || 0) * scale;

      ctx.beginPath();
      ctx.moveTo(0, browY);
      ctx.lineTo(canvas.width, browY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, noseY);
      ctx.lineTo(canvas.width, noseY);
      ctx.stroke();

      // Face width line
      const leftCheek = landmarks[234];
      const rightCheek = landmarks[454];
      if (leftCheek && rightCheek) {
        ctx.beginPath();
        ctx.moveTo(leftCheek.x * scale, leftCheek.y * scale);
        ctx.lineTo(rightCheek.x * scale, rightCheek.y * scale);
        ctx.stroke();
      }
    };
    img.src = imageUrl;
  }, [imageUrl, landmarks, imageWidth, imageHeight]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full rounded-xl" />
      <div className="mt-3 text-xs text-gray-500">
        <div className="flex flex-wrap gap-3">
          <span><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>Face outline</span>
          <span><span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-1"></span>Brows</span>
          <span><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>Eyes</span>
          <span><span className="inline-block w-3 h-3 rounded-full bg-cyan-500 mr-1"></span>Nose</span>
          <span><span className="inline-block w-3 h-3 rounded-full bg-fuchsia-500 mr-1"></span>Mouth</span>
          <span><span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>Jaw/Cheeks</span>
        </div>
      </div>
    </div>
  );
}

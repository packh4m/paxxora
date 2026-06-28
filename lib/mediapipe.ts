import { FaceLandmarks, Point } from "./types";

/**
 * Stub implementation for MediaPipe face detection.
 * The main app uses manual landmark placement instead of automatic detection.
 * This is kept for backwards compatibility with CalibrationMode.
 */
export async function detectFaceLandmarks(
  imageData: ImageData | HTMLImageElement
): Promise<FaceLandmarks | null> {
  // Return null to indicate no automatic detection available
  // Use ManualPointPlacement component for landmark placement
  console.warn("MediaPipe automatic detection not implemented. Use manual landmark placement.");
  return null;
}

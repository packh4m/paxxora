"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrainingAnnotation,
  fetchTrainingAnnotations,
  isSupabaseConfigured,
  LANDMARK_NAMES,
  NUM_LANDMARKS,
} from "@/lib/supabase";
import {
  runQualityChecks,
  splitDataset,
  exportToCOCO,
  exportToCSV,
  generatePyTorchFiles,
  calculateStats,
  QualityReport,
  DatasetStats,
  DatasetSplit,
} from "@/lib/exportUtils";
import { generateDemoAnnotationsWithIssues } from "@/lib/demoData";

// Simple password protection (move to env var in production)
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "looksladder2024";

type Tab = "stats" | "quality" | "export";

export default function ExportDataPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Data state
  const [annotations, setAnnotations] = useState<TrainingAnnotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [split, setSplit] = useState<DatasetSplit | null>(null);

  // Export state
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  // Handle password submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError("");
      loadData();
    } else {
      setAuthError("Incorrect password");
    }
  };

  // Load data from Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingDemoData(false);

    try {
      const data = await fetchTrainingAnnotations();
      setAnnotations(data);

      // Calculate stats
      const dataStats = calculateStats(data);
      setStats(dataStats);

      // Run quality checks
      const quality = runQualityChecks(data);
      setQualityReport(quality);

      // Generate split
      const dataSplit = splitDataset(data);
      setSplit(dataSplit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load demo data for testing
  const loadDemoData = useCallback(() => {
    setLoading(true);
    setError(null);
    setUsingDemoData(true);

    // Simulate loading delay
    setTimeout(() => {
      const data = generateDemoAnnotationsWithIssues();
      setAnnotations(data);

      // Calculate stats
      const dataStats = calculateStats(data);
      setStats(dataStats);

      // Run quality checks
      const quality = runQualityChecks(data);
      setQualityReport(quality);

      // Generate split
      const dataSplit = splitDataset(data);
      setSplit(dataSplit);

      setLoading(false);
    }, 500);
  }, []);

  // Download helper
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export handlers
  const handleExportCOCO = () => {
    if (!annotations.length) return;
    const coco = exportToCOCO(annotations);
    const json = JSON.stringify(coco, null, 2);
    downloadFile(json, "looksladder_coco.json", "application/json");
  };

  const handleExportCSV = () => {
    if (!annotations.length) return;
    const csv = exportToCSV(annotations);
    downloadFile(csv, "looksladder_landmarks.csv", "text/csv");
  };

  const handleExportPyTorch = async () => {
    if (!split) return;

    setExportProgress("Generating PyTorch dataset files...");

    try {
      const files = generatePyTorchFiles(split);

      // Use JSZip-like approach but simpler: just download each file
      // In production, you'd want to use a proper ZIP library
      // For now, download as a JSON with all file contents
      const zipContent = {
        _readme: "Extract these files into a dataset/ folder structure",
        files: {
          "dataset.yaml": files["dataset.yaml"],
          "train.txt": files["train.txt"],
          "val.txt": files["val.txt"],
          "test.txt": files["test.txt"],
          labels: files.labels,
        },
        image_urls: {
          train: split.train.map((a, i) => ({
            filename: `train_${String(i + 1).padStart(4, "0")}.jpg`,
            url: a.photo_url,
          })),
          val: split.val.map((a, i) => ({
            filename: `val_${String(i + 1).padStart(4, "0")}.jpg`,
            url: a.photo_url,
          })),
          test: split.test.map((a, i) => ({
            filename: `test_${String(i + 1).padStart(4, "0")}.jpg`,
            url: a.photo_url,
          })),
        },
      };

      const json = JSON.stringify(zipContent, null, 2);
      downloadFile(json, "looksladder_pytorch_dataset.json", "application/json");

      setExportProgress(null);
    } catch (err) {
      setExportProgress(null);
      alert("Export failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  // Check Supabase configuration
  const supabaseConfigured = isSupabaseConfigured();

  // Password screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Data Export
            </h1>
            <p className="text-zinc-500 text-center text-sm mb-6">
              Admin access required
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              {authError && (
                <p className="text-red-400 text-sm text-center">{authError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
              >
                Access Export Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Supabase not configured screen (but still allow demo mode)
  if (!supabaseConfigured && annotations.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-zinc-900 rounded-2xl border border-amber-500/30 p-8">
            <div className="text-4xl text-center mb-4">⚙️</div>
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Supabase Not Configured
            </h1>
            <p className="text-zinc-400 text-center text-sm mb-6">
              To use real data export, you need to configure Supabase credentials.
            </p>

            {/* Demo Mode Button */}
            <button
              onClick={loadDemoData}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors mb-6"
            >
              Try with Demo Data
            </button>

            <div className="border-t border-zinc-700 pt-6">
              <p className="text-sm text-zinc-500 mb-4 text-center">Or configure Supabase:</p>

              <div className="bg-black rounded-xl p-4 font-mono text-xs text-zinc-400 mb-6">
                <p className="text-zinc-500 mb-2"># Add to .env.local:</p>
                <p className="text-amber-400">NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</p>
                <p className="text-amber-400">NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</p>
              </div>

              <div className="space-y-2 text-xs text-zinc-500">
                <p>1. Create a Supabase project at <span className="text-amber-400">supabase.com</span></p>
                <p>2. Create a <code className="text-amber-400">training_annotations</code> table</p>
                <p>3. Copy your project URL and anon key from Settings &gt; API</p>
                <p>4. Add them to your .env.local file and restart</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading dataset...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">Failed to load data</div>
          <p className="text-zinc-500 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Training Data Export</h1>
                {usingDemoData && (
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-zinc-500 text-sm mt-1">
                Export annotated facial landmarks for model training
              </p>
            </div>
            <div className="flex gap-2">
              {usingDemoData && isSupabaseConfigured() && (
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                >
                  Load Real Data
                </button>
              )}
              <button
                onClick={usingDemoData ? loadDemoData : loadData}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {(["stats", "quality", "export"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? "text-amber-400 border-b-2 border-amber-400"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                {tab === "stats" && "Dataset Stats"}
                {tab === "quality" && "Quality Checks"}
                {tab === "export" && "Export Data"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Tab */}
        {activeTab === "stats" && stats && (
          <div className="space-y-6">
            {/* Model Readiness Banner */}
            <div
              className={`p-6 rounded-2xl border ${
                stats.modelReadiness.status === "ready"
                  ? "bg-green-500/10 border-green-500/30"
                  : stats.modelReadiness.status === "almost"
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-zinc-800/50 border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                    stats.modelReadiness.status === "ready"
                      ? "bg-green-500/20 text-green-400"
                      : stats.modelReadiness.status === "almost"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {stats.modelReadiness.status === "ready" ? "✓" : stats.modelReadiness.current}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Model Readiness</h2>
                  <p className="text-zinc-400 text-sm">{stats.modelReadiness.message}</p>
                  <div className="mt-2 h-2 w-64 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        stats.modelReadiness.status === "ready"
                          ? "bg-green-500"
                          : "bg-amber-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (stats.modelReadiness.current / stats.modelReadiness.recommended) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Annotations"
                value={stats.totalAnnotations}
                icon="📊"
              />
              <StatCard
                label="Avg Landmarks/Photo"
                value={stats.avgLandmarksPerPhoto}
                suffix={`/ ${NUM_LANDMARKS}`}
                icon="📍"
              />
              <StatCard
                label="Date Range"
                value={
                  stats.dateRange
                    ? `${stats.dateRange.earliest.slice(5)} to ${stats.dateRange.latest.slice(5)}`
                    : "N/A"
                }
                small
                icon="📅"
              />
              <StatCard
                label="Unique Annotators"
                value={Object.keys(stats.annotatorBreakdown).length}
                icon="👥"
              />
            </div>

            {/* Annotator Breakdown */}
            {Object.keys(stats.annotatorBreakdown).length > 0 && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Annotator Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(stats.annotatorBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([annotator, count]) => (
                      <div key={annotator} className="flex items-center justify-between">
                        <span className="text-zinc-400">{annotator}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500"
                              style={{
                                width: `${(count / stats.totalAnnotations) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-zinc-500 w-16 text-right">
                            {count} ({((count / stats.totalAnnotations) * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quality Tab */}
        {activeTab === "quality" && qualityReport && (
          <div className="space-y-6">
            {/* Quality Summary */}
            <div
              className={`p-6 rounded-2xl border ${
                qualityReport.passedChecks
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                    qualityReport.passedChecks
                      ? "bg-green-500/20"
                      : "bg-red-500/20"
                  }`}
                >
                  {qualityReport.passedChecks ? "✓" : "⚠"}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {qualityReport.passedChecks
                      ? "All Quality Checks Passed"
                      : "Quality Issues Found"}
                  </h2>
                  <p className="text-zinc-400 text-sm">
                    {qualityReport.validAnnotations} of {qualityReport.totalAnnotations} annotations are valid
                  </p>
                </div>
              </div>
            </div>

            {/* Issues List */}
            {qualityReport.issues.length > 0 && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Issues ({qualityReport.issues.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {qualityReport.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        issue.severity === "error"
                          ? "bg-red-500/10 border-red-500/30"
                          : "bg-amber-500/10 border-amber-500/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">
                          {issue.severity === "error" ? "❌" : "⚠️"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              issue.severity === "error"
                                ? "text-red-400"
                                : "text-amber-400"
                            }`}
                          >
                            {issue.issue}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1 truncate">
                            ID: {issue.annotationId}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {qualityReport.issues.length === 0 && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-12 text-center">
                <div className="text-4xl mb-4">✨</div>
                <p className="text-zinc-400">No quality issues found!</p>
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === "export" && split && (
          <div className="space-y-6">
            {/* Split Preview */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4">Train/Val/Test Split</h3>
              <div className="grid grid-cols-3 gap-4">
                <SplitCard
                  label="Training"
                  count={split.train.length}
                  total={annotations.length}
                  color="green"
                />
                <SplitCard
                  label="Validation"
                  count={split.val.length}
                  total={annotations.length}
                  color="blue"
                />
                <SplitCard
                  label="Test"
                  count={split.test.length}
                  total={annotations.length}
                  color="purple"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-4">
                Default 80/10/10 split with fixed seed for reproducibility
              </p>
            </div>

            {/* Export Options */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* COCO JSON */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <div className="text-3xl mb-3">📋</div>
                <h3 className="text-lg font-semibold mb-2">COCO Keypoints JSON</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Standard format for keypoint detection models. Compatible with most training frameworks.
                </p>
                <button
                  onClick={handleExportCOCO}
                  disabled={annotations.length === 0}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-medium rounded-lg transition-colors"
                >
                  Download COCO JSON
                </button>
              </div>

              {/* CSV */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold mb-2">CSV Format</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Simple spreadsheet format. Good for analysis, visualization, and custom pipelines.
                </p>
                <button
                  onClick={handleExportCSV}
                  disabled={annotations.length === 0}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-medium rounded-lg transition-colors"
                >
                  Download CSV
                </button>
              </div>

              {/* PyTorch */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <div className="text-3xl mb-3">🔥</div>
                <h3 className="text-lg font-semibold mb-2">PyTorch Dataset</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Ready-to-train format with train/val/test splits and YAML config.
                </p>
                <button
                  onClick={handleExportPyTorch}
                  disabled={annotations.length === 0 || !!exportProgress}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-medium rounded-lg transition-colors"
                >
                  {exportProgress || "Download PyTorch Files"}
                </button>
              </div>
            </div>

            {/* Landmark Reference */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4">Landmark Reference</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                {LANDMARK_NAMES.map((name, idx) => (
                  <div key={name} className="flex items-center gap-2 text-zinc-400">
                    <span className="text-zinc-600 w-6">{idx}:</span>
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper components
function StatCard({
  label,
  value,
  suffix,
  icon,
  small,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: string;
  small?: boolean;
}) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`font-bold ${small ? "text-lg" : "text-2xl"} text-white`}>
        {value}
        {suffix && <span className="text-zinc-500 text-sm font-normal ml-1">{suffix}</span>}
      </div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

function SplitCard({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: "green" | "blue" | "purple";
}) {
  const colorClasses = {
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-xs opacity-50 mt-1">{percentage}%</div>
    </div>
  );
}

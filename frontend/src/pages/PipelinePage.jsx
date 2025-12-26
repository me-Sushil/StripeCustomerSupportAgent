// ============================================
// src/pages/PipelinePage.jsx
// ============================================

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import toast from "react-hot-toast";
import { Play, CheckCircle, XCircle, Loader } from "lucide-react";
import {
  runCompletePipeline,
 
  selectPipelineRunning,
  selectCurrentStep,
  selectPipelineProgress,
  selectPipelineLogs,
} from "../store/slices/pipelineSlice";

const StepCard = ({ title, status, count, isActive }) => {
  const getStatusIcon = () => {
    if (status === "complete")
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    if (status === "failed")
      return <XCircle className="w-6 h-6 text-red-500" />;
    if (status === "running" || isActive)
      return <Loader className="w-6 h-6 text-primary-500 animate-spin" />;
    return <div className="w-6 h-6 rounded-full border-2 border-gray-300" />;
  };

  return (
    <div
      className={`p-6 rounded-lg border-2 ${
        isActive
          ? "border-primary-500 bg-primary-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {getStatusIcon()}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{count}</span>
        <span className="text-gray-600">processed</span>
      </div>
      <Badge
        variant={
          status === "complete"
            ? "success"
            : status === "running"
            ? "info"
            : status === "failed"
            ? "danger"
            : "gray"
        }
        className="mt-2"
      >
        {status}
      </Badge>
    </div>
  );
};

export const PipelinePage = () => {
  const dispatch = useDispatch();
  const [urls, setUrls] = useState("");

  const running = useSelector(selectPipelineRunning);
  const currentStep = useSelector(selectCurrentStep);
  const progress = useSelector(selectPipelineProgress);
  const logs = useSelector(selectPipelineLogs);

  const handleRunPipeline = () => {
    const urlList = urls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    if (urlList.length === 0) {
      toast.error("Please enter at least one URL");
      return;
    }
    dispatch(runCompletePipeline({ urls: urlList }));
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pipeline Runner</h1>
        <p className="text-gray-600 mt-1">
          Run the complete pipeline: Scrape → Chunk → Embed → Store
        </p>
      </div>

      {/* URL Input */}
      <Card title="URLs to Process">
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder="Enter URLs (one per line)&#10;https://stripe.com/docs/api&#10;https://stripe.com/docs/payments"
          className="textarea-field"
          rows={6}
        />
        <div className="flex gap-4 mt-4">
          <Button
            onClick={handleRunPipeline}
            loading={running}
            icon={Play}
            className="flex-1"
          >
            Run Complete Pipeline
          </Button>
        </div>
      </Card>

      {/* Pipeline Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StepCard
          title="1. Scraping"
          status={progress.scraping.status}
          count={progress.scraping.count}
          isActive={currentStep === "scraping"}
        />
        <StepCard
          title="2. Chunking"
          status={progress.chunking.status}
          count={progress.chunking.count}
          isActive={currentStep === "chunking"}
        />
        <StepCard
          title="3. Embedding"
          status={progress.embedding.status}
          count={progress.embedding.count}
          isActive={currentStep === "embedding"}
        />
      </div>

      {/* Logs */}
      <Card title="Pipeline Logs">
        <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No logs yet. Start the pipeline to see logs.
            </p>
          ) : (
            <div className="space-y-1 font-mono text-sm">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`${
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "success"
                      ? "text-green-400"
                      : "text-gray-300"
                  }`}
                >
                  <span className="text-gray-500">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>{" "}
                  {log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

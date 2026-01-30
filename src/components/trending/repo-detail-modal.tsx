"use client";

import { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Target,
  Lightbulb,
  Code2,
  BarChart3,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RepoSummary {
  repo_name: string;
  summary: string;
  what_it_does: string;
  core_features: string[];
  why_useful: string;
  use_cases: string[];
  tech_stack: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  recommendation: "high" | "medium" | "low";
  recommendation_reason: string;
}

interface RepoDetailModalProps {
  repoName: string;
  repoUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const difficultyConfig = {
  beginner: { label: "入门级", className: "bg-green-100 text-green-700" },
  intermediate: { label: "中级", className: "bg-yellow-100 text-yellow-700" },
  advanced: { label: "高级", className: "bg-red-100 text-red-700" },
};

const recommendationConfig = {
  high: { label: "强烈推荐", className: "bg-green-100 text-green-700" },
  medium: { label: "值得关注", className: "bg-blue-100 text-blue-700" },
  low: { label: "一般", className: "bg-gray-100 text-gray-600" },
};

export function RepoDetailModal({
  repoName,
  repoUrl,
  isOpen,
  onClose,
}: RepoDetailModalProps) {
  const [summary, setSummary] = useState<RepoSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && repoName) {
      setLoading(true);
      setError(null);

      fetch(`/api/summary?repo=${encodeURIComponent(repoName)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error === "Summary not found"
              ? "暂无 AI 分析，请在本地运行生成脚本"
              : data.error);
          } else {
            setSummary(data.summary);
          }
        })
        .catch(() => setError("加载失败"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, repoName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-lg">AI 项目分析</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
              <p className="text-muted-foreground">正在加载 AI 分析...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{error}</p>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                npx tsx src/scripts/generate-summaries.ts
              </code>
            </div>
          )}

          {summary && (
            <div className="space-y-6">
              {/* Repo Name & Summary */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold">{summary.repo_name}</h3>
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-lg text-purple-600 font-medium">
                  {summary.summary}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    recommendationConfig[summary.recommendation].className
                  )}
                >
                  {recommendationConfig[summary.recommendation].label}
                </span>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    difficultyConfig[summary.difficulty].className
                  )}
                >
                  {difficultyConfig[summary.difficulty].label}
                </span>
              </div>

              {/* What it does */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold">这个项目是做什么的</h4>
                </div>
                <p className="text-muted-foreground">{summary.what_it_does}</p>
              </div>

              {/* Core Features */}
              {summary.core_features.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold">核心功能</h4>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {summary.core_features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Why Useful */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold text-green-800">为什么对你有用</h4>
                </div>
                <p className="text-green-700">{summary.why_useful}</p>
                {summary.recommendation_reason && (
                  <p className="text-sm text-green-600 mt-2">
                    💡 {summary.recommendation_reason}
                  </p>
                )}
              </div>

              {/* Use Cases */}
              {summary.use_cases.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">使用场景</h4>
                  <div className="flex flex-wrap gap-2">
                    {summary.use_cases.map((useCase, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                      >
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tech Stack */}
              {summary.tech_stack.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold">技术栈</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summary.tech_stack.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <ExternalLink className="w-4 h-4" />
            查看 GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

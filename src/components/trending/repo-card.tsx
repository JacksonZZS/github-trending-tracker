"use client";

import { Star, GitFork, Heart, Copy, ExternalLink, Sparkles, TrendingUp, Bookmark, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatNumber, getCloneCommand, copyToClipboard } from "@/lib/utils";
import { useFavoriteStore } from "@/stores/favorite-store";
import { useState } from "react";
import { RepoDetailModal } from "./repo-detail-modal";

interface RepoCardProps {
  rank: number;
  repoName: string;
  owner: string;
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  languageColor: string | null;
  stars: number;
  starsToday: number;
  forks: number;
  usefulness?: "high" | "medium" | "low";
  usefulnessReason?: string;
  tags?: string[];
}

export function RepoCard({
  rank,
  repoName,
  owner,
  name,
  description,
  url,
  language,
  languageColor,
  stars,
  starsToday,
  forks,
  usefulness = "low",
  usefulnessReason,
  tags = [],
}: RepoCardProps) {
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const [copied, setCopied] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const favorite = isFavorite(repoName);

  const handleCopy = async () => {
    await copyToClipboard(getCloneCommand(url));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFavorite = () => {
    toggleFavorite(repoName);
  };

  const usefulnessConfig = {
    high: {
      icon: Sparkles,
      label: "高度推荐",
      className: "bg-green-100 text-green-700 border-green-200",
      iconClassName: "text-green-600",
    },
    medium: {
      icon: TrendingUp,
      label: "值得关注",
      className: "bg-blue-100 text-blue-700 border-blue-200",
      iconClassName: "text-blue-600",
    },
    low: {
      icon: Bookmark,
      label: "一般",
      className: "bg-gray-100 text-gray-600 border-gray-200",
      iconClassName: "text-gray-500",
    },
  };

  const config = usefulnessConfig[usefulness];
  const UsefulnessIcon = config.icon;

  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow",
      usefulness === "high" && "ring-2 ring-green-200 bg-green-50/30"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
            {rank}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-primary hover:underline truncate"
              >
                <span className="text-muted-foreground">{owner}/</span>
                {name}
              </a>
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />

              {/* 有用程度标签 */}
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                config.className
              )}>
                <UsefulnessIcon className={cn("w-3 h-3", config.iconClassName)} />
                {config.label}
              </span>
            </div>

            {description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {description}
              </p>
            )}

            {/* 推荐理由 */}
            {usefulnessReason && usefulness !== "low" && (
              <p className="text-xs text-green-600 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {usefulnessReason}
              </p>
            )}

            {/* 标签 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {language && (
                <div className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: languageColor || "#8b8b8b" }}
                  />
                  <span>{language}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>{formatNumber(stars)}</span>
              </div>

              <div className="flex items-center gap-1">
                <GitFork className="w-4 h-4" />
                <span>{formatNumber(forks)}</span>
              </div>

              {starsToday > 0 && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Star className="w-4 h-4 fill-yellow-500" />
                  <span>+{formatNumber(starsToday)} today</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetail(true)}
              className="gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Info className="w-4 h-4" />
              AI 分析
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Clone"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavorite}
              className={cn(favorite && "text-red-500")}
            >
              <Heart
                className={cn("w-5 h-5", favorite && "fill-red-500")}
              />
            </Button>
          </div>
        </div>
      </CardContent>

      <RepoDetailModal
        repoName={repoName}
        repoUrl={url}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </Card>
  );
}

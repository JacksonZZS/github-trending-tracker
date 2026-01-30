"use client";

import { Star, GitFork, Heart, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatNumber, getCloneCommand, copyToClipboard } from "@/lib/utils";
import { useFavoriteStore } from "@/stores/favorite-store";
import { useState } from "react";

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
}: RepoCardProps) {
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const [copied, setCopied] = useState(false);
  const favorite = isFavorite(repoName);

  const handleCopy = async () => {
    await copyToClipboard(getCloneCommand(url));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFavorite = () => {
    toggleFavorite(repoName);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
            {rank}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
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
            </div>

            {description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {description}
              </p>
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
    </Card>
  );
}

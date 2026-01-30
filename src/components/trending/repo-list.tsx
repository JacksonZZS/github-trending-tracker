"use client";

import { RepoCard } from "./repo-card";
import type { TrendingRepo } from "@/lib/types";
import { generateRepoSummary } from "@/lib/summary/repo-summary";
import { useFilterStore, type UsefulnessLevel } from "@/stores/filter-store";
import { useMemo } from "react";

interface RepoListProps {
  repos: TrendingRepo[];
  loading?: boolean;
}

export function RepoList({ repos, loading }: RepoListProps) {
  const { selectedUsefulness } = useFilterStore();

  const reposWithSummary = useMemo(() => {
    return repos.map((repo) => {
      const summary = generateRepoSummary({
        repo_name: repo.repo_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stars,
        stars_today: repo.stars_today,
        url: repo.url,
      });
      return { ...repo, summary };
    });
  }, [repos]);

  const filteredRepos = useMemo(() => {
    if (selectedUsefulness === "all") {
      return reposWithSummary;
    }
    return reposWithSummary.filter(
      (repo) => repo.summary.usefulness === selectedUsefulness
    );
  }, [reposWithSummary, selectedUsefulness]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-muted rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No trending repositories found.</p>
        <p className="text-sm mt-2">Try a different language or date.</p>
      </div>
    );
  }

  if (filteredRepos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>没有找到符合筛选条件的项目</p>
        <p className="text-sm mt-2">试试切换筛选条件</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredRepos.map((repo) => (
        <RepoCard
          key={repo.id}
          rank={repo.rank}
          repoName={repo.repo_name}
          owner={repo.owner}
          name={repo.name}
          description={repo.description}
          url={repo.url}
          language={repo.language}
          languageColor={repo.language_color}
          stars={repo.stars}
          starsToday={repo.stars_today}
          forks={repo.forks}
          usefulness={repo.summary.usefulness}
          usefulnessReason={repo.summary.usefulnessReason}
          tags={repo.summary.tags}
        />
      ))}
    </div>
  );
}

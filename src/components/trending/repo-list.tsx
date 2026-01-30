"use client";

import { RepoCard } from "./repo-card";
import type { TrendingRepo } from "@/lib/types";

interface RepoListProps {
  repos: TrendingRepo[];
  loading?: boolean;
}

export function RepoList({ repos, loading }: RepoListProps) {
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

  return (
    <div className="space-y-4">
      {repos.map((repo) => (
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
        />
      ))}
    </div>
  );
}

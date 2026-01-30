"use client";

import { useEffect, useState } from "react";
import { Github, RefreshCw } from "lucide-react";
import { RepoList } from "@/components/trending/repo-list";
import { LanguageFilter } from "@/components/trending/language-filter";
import { Button } from "@/components/ui/button";
import { useFilterStore } from "@/stores/filter-store";
import type { TrendingRepo } from "@/lib/types";

export default function HomePage() {
  const [repos, setRepos] = useState<TrendingRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedLanguage, selectedDate } = useFilterStore();

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);
      if (selectedLanguage) params.set("language", selectedLanguage);

      const response = await fetch(`/api/trending?${params}`);
      const data = await response.json();
      setRepos(data.repos || []);
    } catch (error) {
      console.error("Failed to fetch repos:", error);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, [selectedLanguage, selectedDate]);

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Github className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">GitHub Trending Tracker</h1>
                <p className="text-sm text-muted-foreground">
                  每日追踪热门开源项目
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRepos}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                刷新
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">语言筛选</h2>
          <LanguageFilter />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Trending Repositories
            {repos.length > 0 && (
              <span className="text-muted-foreground font-normal ml-2">
                ({repos.length} repos)
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">{selectedDate}</p>
        </div>

        <RepoList repos={repos} loading={loading} />
      </main>

      <footer className="border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>GitHub Trending Tracker - Built with Next.js & Supabase</p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useFilterStore } from "@/stores/filter-store";
import { Button } from "@/components/ui/button";

const POPULAR_LANGUAGES = [
  { value: null, label: "All Languages" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "c++", label: "C++" },
  { value: "c", label: "C" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
];

export function LanguageFilter() {
  const { selectedLanguage, setLanguage } = useFilterStore();

  return (
    <div className="flex flex-wrap gap-2">
      {POPULAR_LANGUAGES.map((lang) => (
        <Button
          key={lang.value ?? "all"}
          variant={selectedLanguage === lang.value ? "default" : "outline"}
          size="sm"
          onClick={() => setLanguage(lang.value)}
        >
          {lang.label}
        </Button>
      ))}
    </div>
  );
}

"use client";

import { Sparkles, TrendingUp, Bookmark, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFilterStore, type UsefulnessLevel } from "@/stores/filter-store";
import { cn } from "@/lib/utils";

const filterOptions: {
  value: UsefulnessLevel;
  label: string;
  icon: typeof Sparkles;
  className: string;
}[] = [
  {
    value: "all",
    label: "全部",
    icon: List,
    className: "hover:bg-gray-100",
  },
  {
    value: "high",
    label: "高度推荐",
    icon: Sparkles,
    className: "hover:bg-green-100 data-[active=true]:bg-green-100 data-[active=true]:text-green-700",
  },
  {
    value: "medium",
    label: "值得关注",
    icon: TrendingUp,
    className: "hover:bg-blue-100 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700",
  },
  {
    value: "low",
    label: "一般",
    icon: Bookmark,
    className: "hover:bg-gray-100 data-[active=true]:bg-gray-200",
  },
];

export function UsefulnessFilter() {
  const { selectedUsefulness, setUsefulness } = useFilterStore();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        按推荐程度筛选
      </span>
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const Icon = option.icon;
          const isActive = selectedUsefulness === option.value;

          return (
            <Button
              key={option.value}
              variant="outline"
              size="sm"
              onClick={() => setUsefulness(option.value)}
              data-active={isActive}
              className={cn(
                "gap-1.5 transition-colors",
                option.className,
                isActive && "ring-2 ring-offset-1"
              )}
            >
              <Icon className="w-4 h-4" />
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

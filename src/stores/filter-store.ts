import { create } from "zustand";

export type UsefulnessLevel = "all" | "high" | "medium" | "low";

interface FilterStore {
  selectedLanguage: string | null;
  selectedDate: string;
  selectedUsefulness: UsefulnessLevel;
  setLanguage: (language: string | null) => void;
  setDate: (date: string) => void;
  setUsefulness: (usefulness: UsefulnessLevel) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  selectedLanguage: null,
  selectedDate: new Date().toISOString().split("T")[0],
  selectedUsefulness: "all",
  setLanguage: (language) => set({ selectedLanguage: language }),
  setDate: (date) => set({ selectedDate: date }),
  setUsefulness: (usefulness) => set({ selectedUsefulness: usefulness }),
}));

import { create } from "zustand";

interface FilterStore {
  selectedLanguage: string | null;
  selectedDate: string;
  setLanguage: (language: string | null) => void;
  setDate: (date: string) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  selectedLanguage: null,
  selectedDate: new Date().toISOString().split("T")[0],
  setLanguage: (language) => set({ selectedLanguage: language }),
  setDate: (date) => set({ selectedDate: date }),
}));

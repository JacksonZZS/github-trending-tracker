import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoriteStore {
  favorites: Set<string>;
  addFavorite: (repoName: string) => void;
  removeFavorite: (repoName: string) => void;
  isFavorite: (repoName: string) => boolean;
  toggleFavorite: (repoName: string) => void;
}

export const useFavoriteStore = create<FavoriteStore>()(
  persist(
    (set, get) => ({
      favorites: new Set<string>(),
      addFavorite: (repoName) =>
        set((state) => ({
          favorites: new Set([...state.favorites, repoName]),
        })),
      removeFavorite: (repoName) =>
        set((state) => {
          const newFavorites = new Set(state.favorites);
          newFavorites.delete(repoName);
          return { favorites: newFavorites };
        }),
      isFavorite: (repoName) => get().favorites.has(repoName),
      toggleFavorite: (repoName) => {
        const { isFavorite, addFavorite, removeFavorite } = get();
        if (isFavorite(repoName)) {
          removeFavorite(repoName);
        } else {
          addFavorite(repoName);
        }
      },
    }),
    {
      name: "github-trending-favorites",
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              favorites: new Set(parsed.state.favorites || []),
            },
          };
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") return;
          const toStore = {
            ...value,
            state: {
              ...value.state,
              favorites: [...value.state.favorites],
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => {
          if (typeof window === "undefined") return;
          localStorage.removeItem(name);
        },
      },
    }
  )
);

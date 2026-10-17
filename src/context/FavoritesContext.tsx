"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface FavoritesContextValue {
  favoriteIds: string[];
  isLoaded: boolean;
  toggleFavorite: (productId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const STORAGE_KEY = "agatha-favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedFavorites: unknown = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "[]",
      );
      if (Array.isArray(savedFavorites)) {
        setFavoriteIds(
          Array.from(
            new Set(
              savedFavorites.filter(
                (id): id is string => typeof id === "string" && id.length > 0,
              ),
            ),
          ),
        );
      }
    } catch (error) {
      console.error("No se pudieron cargar los favoritos:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch (error) {
      console.error("No se pudieron guardar los favoritos:", error);
    }
  }, [favoriteIds, isLoaded]);

  useEffect(() => {
    const syncFavoritesFromAnotherTab = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      try {
        const value: unknown = JSON.parse(event.newValue ?? "[]");
        if (Array.isArray(value)) {
          setFavoriteIds(
            Array.from(
              new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0)),
            ),
          );
        }
      } catch {
        setFavoriteIds([]);
      }
    };

    window.addEventListener("storage", syncFavoritesFromAnotherTab);
    return () => window.removeEventListener("storage", syncFavoritesFromAnotherTab);
  }, []);

  const toggleFavorite = useCallback((productId: string) => {
    if (!productId) return;
    setFavoriteIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }, []);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isLoaded, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites requiere FavoritesProvider.");
  return context;
}

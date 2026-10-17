"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

interface FavoriteButtonProps {
  initialFavorite?: boolean;
  onChange?: (favorite: boolean) => void;
  size?: number;
}

export default function FavoriteButton({
  initialFavorite = false,
  onChange,
  size = 18,
}: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(initialFavorite);

  const toggleFavorite = () => {
    const newValue = !favorite;

    setFavorite(newValue);
    onChange?.(newValue);
  };

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-label={
        favorite
          ? "Quitar de favoritos"
          : "Agregar a favoritos"
      }
      aria-pressed={favorite}
      className={`
        group/favorite
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-full
        bg-white/95
        shadow-lg
        backdrop-blur-sm
        transition-all
        duration-300
        hover:scale-110
        active:scale-90
        ${
          favorite
            ? "text-pink-600"
            : "text-gray-700"
        }
      `}
    >
      <Heart
        size={size}
        className={`
          transition-all
          duration-300
          ${
            favorite
              ? "fill-pink-600 scale-110"
              : "fill-transparent"
          }
          group-hover/favorite:text-pink-600
        `}
      />
    </button>
  );
}
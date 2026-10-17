"use client";

import { Star } from "lucide-react";

interface RatingProps {
  value: number;
  size?: number;
  animated?: boolean;
}

export default function Rating({
  value,
  size = 18,
  animated = true,
}: RatingProps) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Calificación ${value} de 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;

        return (
          <Star
            key={star}
            size={size}
            className={`
              transition-all
              duration-300
              ${
                active
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }
              ${
                animated && active
                  ? "animate-star"
                  : ""
              }
            `}
            style={{
              animationDelay: animated && active
                ? `${(star - 1) * 0.12}s`
                : "0s",
            }}
          />
        );
      })}
    </div>
  );
}
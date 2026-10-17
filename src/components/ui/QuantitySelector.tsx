"use client";

import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
}: QuantitySelectorProps) {
  const decrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const increase = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-pink-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={decrease}
        disabled={value <= min}
        aria-label="Disminuir cantidad"
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          text-pink-600
          transition-all
          duration-200
          hover:bg-pink-50
          active:scale-90
          disabled:cursor-not-allowed
          disabled:opacity-30
        "
      >
        <Minus size={16} />
      </button>

      <span
        className="
          flex
          h-10
          min-w-10
          items-center
          justify-center
          px-2
          text-sm
          font-semibold
          text-gray-800
        "
      >
        {value}
      </span>

      <button
        type="button"
        onClick={increase}
        disabled={value >= max}
        aria-label="Aumentar cantidad"
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          text-pink-600
          transition-all
          duration-200
          hover:bg-pink-50
          active:scale-90
          disabled:cursor-not-allowed
          disabled:opacity-30
        "
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
"use client";

import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function LiquidButton({
  children,
  className = "",
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={`liquid-btn ${className}`}
    >
      {children}
    </button>
  );
}
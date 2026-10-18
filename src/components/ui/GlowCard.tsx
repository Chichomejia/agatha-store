"use client";

import { useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function GlowCard({
  children,
  className = "",
}: Props) {
  const [tilt, setTilt] = useState<CSSProperties>({
    "--x": "50%",
    "--y": "50%",
    transform: "perspective(1100px) rotateX(0deg) rotateY(0deg)",
  } as CSSProperties);

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    const rotateY = ((x - 50) / 50) * 8;
    const rotateX = -((y - 50) / 50) * 8;

    setTilt({
      "--x": `${x}%`,
      "--y": `${y}%`,
      transform: `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    } as CSSProperties);
  }

  function handleLeave() {
    setTilt({
      "--x": "50%",
      "--y": "50%",
      transform: "perspective(1100px) rotateX(0deg) rotateY(0deg)",
    } as CSSProperties);
  }

  return (
    <div className={`glow-card ${className}`} style={tilt} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <div className="glass-reflection" />
      {children}
    </div>
  );
}

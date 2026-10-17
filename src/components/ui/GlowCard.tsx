"use client";

import { ReactNode, useState } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function GlowCard({
  children,
  className = "",
}: Props) {

  const [style, setStyle] = useState({
    "--x": "50%",
    "--y": "50%",
    transform:
      "perspective(1000px) rotateX(0deg) rotateY(0deg)",
  } as React.CSSProperties);

  function handleMove(
    e: React.MouseEvent<HTMLDivElement>
  ) {

    const rect = e.currentTarget.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    const rotateY = ((px - 50) / 50) * 8;

    const rotateX = -((py - 50) / 50) * 8;

    setStyle({
      "--x": `${px}%`,
      "--y": `${py}%`,
      transform: `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
      `,
    } as React.CSSProperties);
  }

  function handleLeave() {

    setStyle({
      "--x": "50%",
      "--y": "50%",
      transform:
        "perspective(1000px) rotateX(0deg) rotateY(0deg)",
    } as React.CSSProperties);

  }

  return (
    <div
      className={`glow-card ${className}`}
      style={style}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="glass-reflection" />

      {children}
    </div>
  );
}
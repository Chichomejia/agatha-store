import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

export type FeedbackTone = "error" | "success" | "warning" | "info";

interface Props {
  tone: FeedbackTone;
  children: ReactNode;
  className?: string;
  role?: "alert" | "status";
  id?: string;
}

const toneIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

export default function FeedbackMessage({
  tone,
  children,
  className = "",
  role,
  id,
}: Props) {
  const Icon = toneIcons[tone];
  const isUrgent = tone === "error";

  return (
    <div
      id={id}
      role={role ?? (isUrgent ? "alert" : "status")}
      aria-live={isUrgent ? "assertive" : "polite"}
      className={`feedback-message feedback-message--${tone} ${className}`}
    >
      <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

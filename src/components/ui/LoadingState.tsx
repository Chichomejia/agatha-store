import { Loader2 } from "lucide-react";

interface Props {
  label: string;
  className?: string;
}

export default function LoadingState({ label, className = "" }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`loading-state ${className}`}
    >
      <Loader2
        size={30}
        aria-hidden="true"
        className="animate-spin text-pink-600 motion-reduce:animate-none"
      />
      <span>{label}</span>
    </div>
  );
}

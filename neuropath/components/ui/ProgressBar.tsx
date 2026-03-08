"use client";

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className = "", showLabel = false }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`flex items-center gap-2 ${className}`} data-progress-bar>
      <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
        <div
          className="progress-bar-fill h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-bar-label text-xs font-medium tabular-nums">
          {clamped}%
        </span>
      )}
    </div>
  );
}

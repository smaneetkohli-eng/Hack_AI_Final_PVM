"use client";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "cyan";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-lighter text-muted",
  primary: "bg-primary/20 text-primary-light",
  success: "bg-success/20 text-success-light",
  warning: "bg-yellow-500/20 text-yellow-400",
  cyan: "bg-secondary/20 text-secondary-light",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

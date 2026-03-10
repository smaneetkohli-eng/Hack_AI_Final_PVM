"use client";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "cyan";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-black/5 text-foreground/80",
  primary: "bg-primary/15 text-primary-dark",
  success: "bg-success/15 text-success",
  warning: "bg-amber-100 text-amber-700",
  cyan: "bg-secondary/15 text-secondary-dark",
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

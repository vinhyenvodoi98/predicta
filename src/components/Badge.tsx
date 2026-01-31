import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "info" | "warning" | "default";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variantStyles = {
    success:
      "bg-emerald-400 text-white border-3 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]",
    info: "bg-indigo-400 text-white border-3 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]",
    warning:
      "bg-amber-400 text-white border-3 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]",
    default: "bg-zinc-400 text-white border-3 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-[8px] font-bold uppercase tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

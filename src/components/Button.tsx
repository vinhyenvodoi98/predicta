import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "border-4 border-black font-bold transition-all duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none uppercase tracking-wide";

  const variantStyles = {
    primary:
      "bg-linear-to-b from-indigo-500 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-800 pixel-shadow-hover",
    secondary:
      "bg-linear-to-b from-white to-zinc-100 text-zinc-900 hover:from-zinc-50 hover:to-zinc-200 pixel-shadow-hover",
  };

  const sizeStyles = {
    sm: "px-3 py-2 text-[8px]",
    md: "px-4 py-2 text-[10px]",
    lg: "px-6 py-3 text-[12px]",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

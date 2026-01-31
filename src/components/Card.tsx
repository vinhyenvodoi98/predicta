import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white border-4 border-black pixel-shadow p-6 ${className}`}>
      {children}
    </div>
  );
}

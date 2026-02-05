import { ReactNode } from "react";

interface Feature {
  emoji: string;
  title: string;
  description: string;
}

interface PoolTypeCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  features: Feature[];
  badge: {
    text: string;
    color: string;
  };
  cost: {
    icon: ReactNode;
    text: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
  };
  disabled?: boolean;
  onClick: () => void;
}

export function PoolTypeCard({
  title,
  description,
  icon,
  features,
  badge,
  cost,
  disabled = false,
  onClick,
}: PoolTypeCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative bg-white border-8 border-black p-8 hover:shadow-[16px_16px_0_0_rgba(0,0,0,1)] hover:-translate-x-2 hover:-translate-y-2 transition-all duration-200 text-left ${
        disabled ? "opacity-75" : ""
      }`}
    >
      {/* Badge */}
      <div
        className={`absolute -top-4 -right-4 ${badge.color} border-4 border-black px-4 py-2 rotate-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)]`}
      >
        <span className="text-[10px] font-bold text-black uppercase">{badge.text}</span>
      </div>

      {/* Icon */}
      <div className="mb-6 inline-block bg-linear-to-br from-indigo-400 to-purple-500 border-4 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        {icon}
      </div>

      {/* Title */}
      <h2 className="text-[24px] font-bold text-zinc-900 uppercase mb-4">{title}</h2>

      {/* Description */}
      <p className="text-[12px] text-zinc-700 mb-6 leading-relaxed">{description}</p>

      {/* Features */}
      <div className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-[16px]">{feature.emoji}</span>
            <div>
              <div className="text-[10px] font-bold text-zinc-900 uppercase">{feature.title}</div>
              <div className="text-[9px] text-zinc-600">{feature.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Badge */}
      <div className={`${cost.bgColor} border-4 ${cost.borderColor} p-3`}>
        <div className="flex items-center gap-2">
          {cost.icon}
          <span className={`text-[10px] font-bold ${cost.textColor} uppercase`}>{cost.text}</span>
        </div>
      </div>

      {/* Hover Arrow */}
      {!disabled && (
        <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[32px]">→</span>
        </div>
      )}

      {/* Disabled Overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
          <div className="bg-black border-4 border-white px-6 py-3 rotate-[-5deg] shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <span className="text-[14px] font-bold text-white uppercase">Coming Soon</span>
          </div>
        </div>
      )}
    </button>
  );
}

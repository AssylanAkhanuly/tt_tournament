import { Zap } from "lucide-react";

interface Props {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}

export default function SpinCoachLogo({ variant = "dark", size = "md" }: Props) {
  const iconSize = size === "sm" ? 18 : size === "lg" ? 28 : 22;
  const textClass =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  const spinColor = variant === "light" ? "text-gray-900" : "text-white";
  const coachColor = variant === "light" ? "text-blue-600" : "text-blue-400";
  const iconBg = variant === "light" ? "bg-blue-600" : "bg-blue-600";

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`${iconBg} rounded-xl p-1.5 flex items-center justify-center`}>
        <Zap size={iconSize} className="text-white" fill="white" />
      </div>
      <span className={`font-black leading-none tracking-tight ${textClass}`}>
        <span className={spinColor}>Spin</span>
        <span className={coachColor}>Coach</span>
      </span>
    </div>
  );
}

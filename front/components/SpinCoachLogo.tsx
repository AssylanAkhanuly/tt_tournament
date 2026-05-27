import Image from "next/image";

interface Props {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}

export default function SpinCoachLogo({ variant = "dark", size = "md" }: Props) {
  const imgSize = size === "sm" ? 28 : size === "lg" ? 44 : 36;
  const textClass =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  const gradient =
    variant === "light"
      ? "bg-gradient-to-r from-blue-600 to-cyan-500"
      : "bg-gradient-to-r from-white to-blue-300";

  return (
    <div className="flex items-center gap-2 select-none">
      <Image
        src="/logo.png"
        alt="SpinCoach"
        width={imgSize}
        height={imgSize}
        className="object-contain"
      />
      <span
        className={`font-black leading-none tracking-tight ${textClass} ${gradient} bg-clip-text text-transparent`}
      >
        SpinCoach
      </span>
    </div>
  );
}

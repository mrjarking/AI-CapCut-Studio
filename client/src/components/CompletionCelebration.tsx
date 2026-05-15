import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompletionCelebrationProps {
  title: string;
  description?: string;
  className?: string;
  variant?: "green" | "purple";
}

export default function CompletionCelebration({
  title,
  description,
  className,
  variant = "green",
}: CompletionCelebrationProps) {
  const color =
    variant === "green"
      ? { text: "oklch(0.7 0.2 145)", bg: "oklch(0.7 0.2 145 / 0.08)", border: "oklch(0.7 0.2 145 / 0.25)" }
      : { text: "oklch(0.6 0.28 290)", bg: "oklch(0.6 0.28 290 / 0.08)", border: "oklch(0.6 0.28 290 / 0.25)" };

  return (
    <div
      className={cn("rounded-xl p-4 flex items-start gap-3 completion-pop", className)}
      style={{ background: color.bg, border: `1px solid ${color.border}` }}
    >
      {/* Animated check icon */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: color.bg, border: `1.5px solid ${color.border}` }}
      >
        <CheckCircle2 size={18} style={{ color: color.text }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold"
          style={{ color: color.text, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {title}
        </p>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Decorative sparkles */}
      <div className="flex-shrink-0 flex gap-0.5 pt-0.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full"
            style={{
              background: color.text,
              opacity: 0.4 + i * 0.2,
              animation: `completionPop 0.5s cubic-bezier(0.23,1,0.32,1) ${i * 80}ms forwards`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("glass-strong rounded-2xl p-6 transition-all duration-300", className)}
      {...props}
    />
  );
}

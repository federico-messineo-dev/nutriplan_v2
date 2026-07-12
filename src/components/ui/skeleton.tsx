import { cn } from "@/lib/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        {
          "h-4 w-full rounded-[var(--radius-sm)]": variant === "text",
          "rounded-full": variant === "circular",
          "rounded-[var(--radius-sm)]": variant === "rectangular",
        },
        className,
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

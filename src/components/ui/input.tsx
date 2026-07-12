import { cn } from "@/lib/cn";
import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-meta text-slate-400 text-xs"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50",
            "text-sm font-body text-slate-100 placeholder:text-slate-500",
            "focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50",
            "transition-all duration-200",
            error && "border-red-500 focus:ring-red-500/30",
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };

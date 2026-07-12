"use client";

import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface Toast {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
}

let toastListeners: ((toast: Toast) => void)[] = [];

export function showToast(message: string, type: Toast["type"] = "info") {
  const toast: Toast = {
    id: crypto.randomUUID(),
    message,
    type,
  };
  toastListeners.forEach((l) => l(toast));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={springSnappy}
            className={cn(
              "pointer-events-auto bg-slate-900/80 border border-slate-700/50 rounded-[var(--radius-md)] shadow-xl px-4 py-3 backdrop-blur-sm",
              "flex items-center gap-3 min-w-[280px] max-w-[420px]",
              {
                "border-l-4 border-l-green-500": toast.type === "success",
                "border-l-4 border-l-red-500": toast.type === "error",
                "border-l-4 border-l-cyan-500": toast.type === "info",
              },
            )}
          >
            <span className="text-sm text-slate-100 flex-1">{toast.message}</span>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export function Topbar() {
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    // noop — component kept for layout consistency
  }, []);

  const openCommandPalette = (prefilledQuery?: string) => {
    window.dispatchEvent(
      new CustomEvent("command-palette-open", { detail: prefilledQuery || "" }),
    );
  };

  return (
    <header className="h-14 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm flex items-center px-4 md:px-6 gap-4">
      {/* Search / Command palette trigger */}
      <button
        onClick={() => openCommandPalette()}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm hover:border-cyan-500/30 transition-colors flex-1 max-w-md focus-within:border-cyan-500/50 backdrop-blur-sm"
      >
        <Search size={14} className="shrink-0" />
        <span className="font-body text-sm">Cerca clienti, piani...</span>
      </button>
    </header>
  );
}

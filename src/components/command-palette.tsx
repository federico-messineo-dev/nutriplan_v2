"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springSnappy, springSoft } from "@/lib/motion";
import { Search, User, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  fullName: string;
  goal: string;
  diet: string;
}

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch clients for search
  useEffect(() => {
    if (open && clients.length === 0) {
      fetch("/api/clients")
        .then((r) => r.json())
        .then((data) => setClients(data.clients || []))
        .catch(() => {});
    }
  }, [open, clients.length]);

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Listen for custom event from topbar search
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setQuery(e.detail || "");
      setOpen(true);
    };
    window.addEventListener("command-palette-open" as string, handler as EventListener);
    return () => window.removeEventListener("command-palette-open" as string, handler as EventListener);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [open]);

  // Build command items from clients + static actions
  const items: CommandItem[] = [
    {
      id: "new-client",
      label: "Nuovo cliente",
      hint: "Crea un nuovo profilo cliente",
      icon: User,
      action: () => {
        setOpen(false);
        setShowNewClientDialog(true);
        setTimeout(() => firstNameRef.current?.focus(), 100);
      },
    },
    ...clients.map((c) => ({
      id: c.id,
      label: c.fullName,
      hint: `${c.goal} · ${c.diet}`,
      icon: User,
      action: () => {
        setOpen(false);
        router.push(`/dashboard/clients/${c.id}`);
      },
    })),
  ];

  const filteredItems = query
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.hint?.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    },
    [filteredItems, selectedIndex],
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleCreateClient = async () => {
    const fullName = `${newClientFirstName} ${newClientLastName}`.trim();
    if (!fullName) return;
    setCreating(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });
      const data = await res.json();
      if (data.client?.id) {
        setShowNewClientDialog(false);
        setNewClientFirstName("");
        setNewClientLastName("");
        router.push(`/dashboard/clients/${data.client.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={springSnappy}
            className="fixed top-[20vh] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
          >
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-[var(--radius-lg)] overflow-hidden shadow-xl backdrop-blur-sm">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Cerca clienti o comandi..."
                  className="flex-1 bg-transparent text-slate-100 text-sm font-body outline-none placeholder:text-slate-500"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-slate-400 hover:text-slate-100 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                {filteredItems.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="font-body text-sm text-slate-400">
                      Nessun risultato per &ldquo;{query}&rdquo;
                    </p>
                  </div>
                ) : (
                  filteredItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          i === selectedIndex
                            ? "bg-cyan-500/10"
                            : "hover:bg-slate-800/50"
                        }`}
                      >
                        <Icon
                          size={16}
                          className={
                            i === selectedIndex
                              ? "text-cyan-400"
                              : "text-slate-500"
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-slate-100 truncate">
                            {item.label}
                          </p>
                          {item.hint && (
                            <p className="font-body text-xs text-slate-400 truncate">
                              {item.hint}
                            </p>
                          )}
                        </div>
                        <ArrowRight
                          size={14}
                          className={`shrink-0 ${
                            i === selectedIndex
                              ? "text-cyan-400"
                              : "text-slate-600"
                          }`}
                        />
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-slate-700/50 flex items-center gap-4">
                <span className="font-mono text-[10px] text-slate-500">
                  ↑↓ naviga · ↵ apri · esc chiudi
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* New client dialog */}
      <AnimatePresence>
        {showNewClientDialog && (
          <>
            <motion.div
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => !creating && setShowNewClientDialog(false)}
            />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springSoft}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-[var(--radius-lg)] shadow-xl w-full max-w-sm p-6 backdrop-blur-sm">
                <h3 className="font-display text-lg text-slate-100 mb-4">Nuovo cliente</h3>
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="font-meta text-slate-500 text-xs">Nome</label>
                    <input
                      ref={firstNameRef}
                      type="text"
                      value={newClientFirstName}
                      onChange={(e) => setNewClientFirstName(e.target.value)}
                      placeholder="Nome"
                      onKeyDown={(e) => e.key === "Enter" && handleCreateClient()}
                      className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="font-meta text-slate-500 text-xs">Cognome</label>
                    <input
                      type="text"
                      value={newClientLastName}
                      onChange={(e) => setNewClientLastName(e.target.value)}
                      placeholder="Cognome"
                      onKeyDown={(e) => e.key === "Enter" && handleCreateClient()}
                      className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setShowNewClientDialog(false)}
                    disabled={creating}
                    className="h-9 px-4 rounded-[var(--radius-sm)] bg-slate-800/50 border border-slate-700/50 text-sm font-body text-slate-400 hover:text-slate-100 transition-colors disabled:opacity-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleCreateClient}
                    disabled={creating || !newClientFirstName.trim()}
                    className="h-9 px-4 rounded-[var(--radius-sm)] bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
                  >
                    {creating ? "Creazione..." : "Crea"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

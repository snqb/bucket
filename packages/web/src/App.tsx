import { Suspense, useState, useRef, useCallback, useEffect, use, type FC, type ReactNode } from "react";
import * as E from "@evolu/common";
import { useQuery } from "@evolu/react";
import type { ListId, TaskId } from "@bucket/core";
import { evolu, useEvolu, EvoluProvider, authResult } from "./evolu.ts";
import { t, getLang, setLang, onLangChange } from "./i18n.ts";
import { migrateFromV1 } from "./migrate.ts";

// ── Helpers ───────────────────────────────────────────────────

const isIOS = typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
const isStandalone = typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true);

const hash = (s: string) => { let h = 0; for (const c of s) h = ((h << 5) - h + c.charCodeAt(0)) | 0; return Math.abs(h); };
const NOTE_EMOJI = ["📝", "✏️", "💭", "🗒️", "💬", "🔖", "📌", "🏷️", "💡", "🪶", "📎", "🖊️"];
const taskEmoji = (id: string) => NOTE_EMOJI[hash(id) % NOTE_EMOJI.length];

// ── Queries ───────────────────────────────────────────────────

const listsQ = evolu.createQuery((db) =>
  db.selectFrom("list")
    .select(["id", "title", "emoji", "position", "createdAt"])
    .where("isDeleted", "is not", E.sqliteTrue)
    .where("title", "is not", null)
    .$narrowType<{ title: E.kysely.NotNull }>()
    .orderBy("position").orderBy("createdAt"),
);

const allTasksQ = evolu.createQuery((db) =>
  db.selectFrom("task")
    .select(["id", "listId", "title", "description", "progress", "dueDate", "createdAt"])
    .where("isDeleted", "is not", E.sqliteTrue)
    .where("title", "is not", null)
    .$narrowType<{ title: E.kysely.NotNull }>()
    .orderBy("createdAt"),
);

// ── Theme ─────────────────────────────────────────────────────

type Theme = "dark" | "light" | "auto";
const THEME_KEY = "bucket-theme";
const detectTheme = (): Theme => (localStorage.getItem(THEME_KEY) as Theme) || "auto";
const applyTheme = (theme: Theme) => {
  const isDark = theme === "dark" || (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.body.classList.toggle("light", !isDark);
};
if (typeof window !== "undefined") {
  applyTheme(detectTheme());
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (detectTheme() === "auto") applyTheme("auto");
  });
}

// ── PWA Install ───────────────────────────────────────────────

let deferredPrompt: any = null;
const installListeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; installListeners.forEach((fn) => fn()); });
}
function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);
  useEffect(() => { const u = () => setCanInstall(!!deferredPrompt); installListeners.add(u); return () => { installListeners.delete(u); }; }, []);
  const install = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; setCanInstall(false); };
  return { canInstall, install };
}

// ── Due date helpers ──────────────────────────────────────────

function dueLabel(dueDate: string | null): { text: string; color: string } | null {
  if (!dueDate) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { text: t("overdue"), color: "text-red-400" };
  if (diff === 0) return { text: t("dueToday"), color: "text-yellow-400" };
  if (diff === 1) return { text: t("dueTomorrow"), color: "text-blue-400" };
  return { text: `${t("dueIn")} ${diff}${t("days")}`, color: "text-text-dim" };
}

// ── i18n hook ─────────────────────────────────────────────────

function useLang() {
  const [, force] = useState(0);
  useEffect(() => onLangChange(() => force((n) => n + 1)), []);
  return getLang();
}

// ── Undo system ───────────────────────────────────────────────

type UndoEntry = { id: string; message: string; onUndo: () => void; timer: ReturnType<typeof setTimeout> };
let undoEntry: UndoEntry | null = null;
const undoListeners = new Set<() => void>();
const notifyUndo = () => undoListeners.forEach((fn) => fn());

function showUndo(message: string, onUndo: () => void, timeout = 5000) {
  if (undoEntry) clearTimeout(undoEntry.timer);
  const id = Math.random().toString(36).slice(2);
  const timer = setTimeout(() => { if (undoEntry?.id === id) { undoEntry = null; notifyUndo(); } }, timeout);
  undoEntry = { id, message, onUndo, timer };
  notifyUndo();
}
function doUndo() { if (!undoEntry) return; clearTimeout(undoEntry.timer); undoEntry.onUndo(); undoEntry = null; notifyUndo(); }
function dismissUndo() { if (!undoEntry) return; clearTimeout(undoEntry.timer); undoEntry = null; notifyUndo(); }
function useUndo() {
  const [entry, setEntry] = useState(undoEntry);
  useEffect(() => { const u = () => setEntry(undoEntry); undoListeners.add(u); return () => { undoListeners.delete(u); }; }, []);
  return entry;
}

// ── Components ────────────────────────────────────────────────

const UndoToast: FC = () => {
  const entry = useUndo();
  useLang();
  if (!entry) return null;
  return (
    <div className="undo-toast fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3 text-sm shadow-lg safe-bottom">
      <span className="text-text-dim">{entry.message}</span>
      <button className="px-3 py-1.5 bg-accent text-white text-xs rounded font-medium" onClick={doUndo}>{t("undo")}</button>
      <button className="text-text-dim hover:text-text" onClick={dismissUndo}>✕</button>
    </div>
  );
};

const SyncDot: FC = () => {
  // Evolu sync state
  const evoluInstance = useEvolu();
  // For now just show green — Evolu handles sync automatically
  return <div className="w-2.5 h-2.5 rounded-full bg-green-500" title="synced" />;
};

const LangToggle: FC = () => {
  const lang = useLang();
  return (
    <button className="text-xs text-text-dim hover:text-text font-mono px-2 py-1.5 rounded hover:bg-surface transition-colors"
      onClick={() => setLang(lang === "en" ? "ru" : "en")}>{lang === "en" ? "RU" : "EN"}</button>
  );
};

const ThemeToggle: FC = () => {
  const [theme, setT] = useState(detectTheme);
  const cycle = () => {
    const next: Theme = theme === "dark" ? "light" : theme === "light" ? "auto" : "dark";
    localStorage.setItem(THEME_KEY, next); applyTheme(next); setT(next);
  };
  const icon = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "🌗";
  return <button className="text-xs text-text-dim hover:text-text px-2 py-1.5 rounded hover:bg-surface transition-colors" onClick={cycle} title={`Theme: ${theme}`}>{icon}</button>;
};

const Adder: FC<{ listId: string }> = ({ listId }) => {
  useLang();
  const { insert } = useEvolu();
  const [value, setValue] = useState("");
  const submit = () => {
    const v = value.trim();
    if (!v) return;
    insert("task", { title: v, listId: listId as ListId, progress: 0 as any });
    setValue("");
  };
  return (
    <input
      className="w-full bg-[color:var(--color-bg)] border border-border rounded px-3 py-2.5 text-sm placeholder:text-text-dim outline-none focus:border-text-dim"
      placeholder={t("addTask")} value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && submit()}
    />
  );
};

// ── TaskBar ───────────────────────────────────────────────────

type TaskRow = (typeof allTasksQ)["Row"];

const TaskBar: FC<{ task: TaskRow }> = ({ task }) => {
  useLang();
  const { update } = useEvolu();
  const progress = task.progress ?? 0;
  const [localProgress, setLocalProgress] = useState(progress);
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState(task.description ?? "");
  const [title, setTitle] = useState<string>(task.title);
  const [due, setDue] = useState<string>(task.dueDate ?? "");
  const barRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dragging = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const didDragRef = useRef(false);
  const directionRef = useRef<"none" | "h" | "v">("none"); // lock scroll vs drag direction

  // Sync from external
  if (progress !== localProgress && !saveRef.current) setLocalProgress(progress);
  if ((task.description ?? "") !== desc && !open) setDesc(task.description ?? "");
  if (task.title !== title && !open) setTitle(task.title);
  if ((task.dueDate ?? "") !== due && !open) setDue(task.dueDate ?? "");

  const setP = useCallback((p: number) => {
    const clamped = Math.min(100, Math.max(0, p));
    setLocalProgress(clamped);
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      saveRef.current = undefined;
      if (clamped >= 100) {
        if (navigator.vibrate) navigator.vibrate(50);
        update("task", { id: task.id as TaskId, isDeleted: E.sqliteTrue });
        showUndo(`✅ ${task.title}`, () => update("task", { id: task.id as TaskId, isDeleted: E.sqliteFalse }));
      } else {
        update("task", { id: task.id as TaskId, progress: clamped as any });
      }
    }, 300);
  }, [task.id, task.title, update]);

  const pctFromX = useCallback((clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true; didDragRef.current = false; directionRef.current = "none";
    startXRef.current = e.touches[0].clientX; startYRef.current = e.touches[0].clientY;
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dx = Math.abs(e.touches[0].clientX - startXRef.current);
    const dy = Math.abs(e.touches[0].clientY - startYRef.current);
    // Lock direction on first significant move
    if (directionRef.current === "none" && (dx > 8 || dy > 8)) {
      directionRef.current = dx > dy ? "h" : "v";
    }
    // Vertical = let browser scroll
    if (directionRef.current !== "h") return;
    e.preventDefault();
    if (dx > 5) { didDragRef.current = true; setP(pctFromX(e.touches[0].clientX)); }
  }, [pctFromX, setP]);
  const onTouchEnd = useCallback(() => {
    if (!dragging.current) return;
    const wasDrag = didDragRef.current; dragging.current = false; directionRef.current = "none";
    if (!wasDrag) setOpen((o) => !o);
  }, []);

  // Mouse drag
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return; // handled by touch events
    dragging.current = true; didDragRef.current = false; startXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || e.pointerType === "touch") return;
    if (Math.abs(e.clientX - startXRef.current) > 5) { didDragRef.current = true; setP(pctFromX(e.clientX)); }
  }, [pctFromX, setP]);
  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    const wasDrag = didDragRef.current; dragging.current = false;
    if (!wasDrag) setOpen((o) => !o);
  }, []);

  const opacity = 1 - localProgress / 150;
  const lastLine = (task.description ?? "").split("\n").filter(Boolean).pop();
  const dueBadge = dueLabel(task.dueDate);

  return (
    <div style={{ opacity }}>
      <div
        ref={barRef}
        className={`relative h-11 cursor-pointer select-none border border-border overflow-hidden touch-raw ${lastLine || open ? "rounded-t" : "rounded"}`}
        role="slider" aria-label={`${task.title} — ${localProgress}%`} aria-valuenow={localProgress} tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setP(Math.min(100, localProgress + 5));
          else if (e.key === "ArrowLeft") setP(Math.max(0, localProgress - 5));
          else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); }
        }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      >
        <div className="absolute inset-0" style={{ background: "var(--color-bar-bg)" }} />
        <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${localProgress}%`, transition: "width 50ms linear" }} />
        <div className="absolute inset-0 pointer-events-none segment-lines" />
        <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
          <div className="flex items-center gap-1.5 truncate max-w-[70%]">
            <span className="text-xs shrink-0">{taskEmoji(task.id)}</span>
            <span className="text-sm font-bold truncate bar-text">{task.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {dueBadge && <span className={`text-[10px] font-medium bar-text ${dueBadge.color}`}>{dueBadge.text}</span>}
            <span className="text-xs font-bold text-gray-300 tabular-nums bar-text">{localProgress}%</span>
          </div>
        </div>
      </div>

      {lastLine && !open && (
        <div className="px-3 py-1.5 text-xs text-text-dim truncate border-x border-b border-border rounded-b cursor-pointer hover:text-text" onClick={() => setOpen(true)}>
          {lastLine}
        </div>
      )}

      {open && (
        <div className="border-x border-b border-border rounded-b p-3 space-y-2 bg-surface">
          <input className="w-full bg-[color:var(--color-bg)] border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-text-dim"
            placeholder={t("taskTitle")} value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && update("task", { id: task.id as TaskId, title: title.trim() })} />
          <div className="flex gap-2 items-center">
            <label className="text-xs text-text-dim shrink-0">{t("dueDate")}</label>
            <input type="date" className="flex-1 bg-[color:var(--color-bg)] border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-text-dim"
              value={due} onChange={(e) => { setDue(e.target.value); update("task", { id: task.id as TaskId, dueDate: e.target.value || null }); }} />
            {due && <button className="text-xs text-text-dim hover:text-text"
              onClick={() => { setDue(""); update("task", { id: task.id as TaskId, dueDate: null }); }}>✕</button>}
          </div>
          <textarea className="w-full bg-[color:var(--color-bg)] border border-border rounded p-2 text-sm resize-none outline-none focus:border-text-dim"
            rows={3} placeholder={t("notes")} value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={() => update("task", { id: task.id as TaskId, description: desc })} />
          <div className="flex gap-3">
            <button className="text-xs text-red-400 hover:text-red-300 py-1"
              onClick={() => {
                update("task", { id: task.id as TaskId, isDeleted: E.sqliteTrue });
                setOpen(false);
                showUndo(t("completed"), () => update("task", { id: task.id as TaskId, isDeleted: E.sqliteFalse }));
              }}>{t("del")}</button>
            <button className="text-xs text-text-dim hover:text-text ml-auto py-1" onClick={() => setOpen(false)}>{t("close")}</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── ListPanel ─────────────────────────────────────────────────

type ListRow = (typeof listsQ)["Row"];

const ListPanel: FC<{ list: ListRow; tasks: TaskRow[] }> = ({ list, tasks }) => {
  useLang();
  const { update } = useEvolu();
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const avg = tasks.length > 0 ? Math.round(tasks.reduce((s, t) => s + (t.progress ?? 0), 0) / tasks.length) : 0;

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      confirmTimer.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    clearTimeout(confirmTimer.current);
    // Soft-delete list + tasks, undo restores
    update("list", { id: list.id as ListId, isDeleted: E.sqliteTrue });
    tasks.forEach((t) => update("task", { id: t.id as TaskId, isDeleted: E.sqliteTrue }));
    showUndo(`${list.emoji ?? "📋"} ${list.title}`, () => {
      update("list", { id: list.id as ListId, isDeleted: E.sqliteFalse });
      tasks.forEach((t) => update("task", { id: t.id as TaskId, isDeleted: E.sqliteFalse }));
    });
  };

  return (
    <div className="p-5 space-y-2 rounded-lg list-panel" style={{ "--list-hue": hash(list.title) % 360 } as any}>
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <span className="text-lg">{list.emoji ?? "📋"}</span>
        <h2 className="font-bold text-sm truncate flex-1">{list.title}</h2>
        {tasks.length > 0 && <span className="text-xs text-text-dim tabular-nums">{t("avg")} {avg}%</span>}
        <button className={`text-xs py-1 px-1.5 rounded transition-colors ${confirming ? "text-red-400 bg-red-900/30 font-medium" : "text-text-dim hover:text-red-400"}`}
          onClick={handleDelete}>{confirming ? t("confirmDelete") : "✕"}</button>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => <TaskBar key={t.id} task={t} />)}
      </div>
      <Adder listId={list.id} />
    </div>
  );
};

// ── NewListButton ─────────────────────────────────────────────

const NewListButton: FC = () => {
  useLang();
  const { insert } = useEvolu();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = () => { const v = name.trim(); if (!v) return; insert("list", { title: v }); setName(""); setOpen(false); };

  if (!open) return (
    <button className="w-full p-4 border border-dashed border-border text-text-dim hover:text-text hover:border-text-dim text-sm rounded-lg"
      onClick={() => setOpen(true)}>{t("newList")}</button>
  );
  return (
    <div className="p-4 border border-border rounded-lg space-y-2">
      <input className="w-full bg-[color:var(--color-bg)] border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-accent"
        placeholder={t("listName")} value={name} autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") setOpen(false); }} />
      <div className="flex gap-2">
        <button className="px-3 py-2 bg-accent text-white text-xs rounded" onClick={create}>{t("create")}</button>
        <button className="px-3 py-2 text-text-dim text-xs hover:text-text" onClick={() => setOpen(false)}>{t("cancel")}</button>
      </div>
    </div>
  );
};

// ── Settings (replaces RoomSetup QR) ──────────────────────────

const Settings: FC<{ onClose: () => void }> = ({ onClose }) => {
  useLang();
  const evoluInstance = useEvolu();
  const appOwner = use(evoluInstance.appOwner);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState("");

  const handleRestore = () => {
    const mnemonic = window.prompt(t("restoreFromMnemonic"));
    if (!mnemonic) return;
    const result = E.Mnemonic.from(mnemonic.trim());
    if (!result.ok) { alert("Invalid mnemonic"); return; }
    void evoluInstance.restoreAppOwner(result.value);
  };

  const handleReset = () => {
    if (confirm(t("resetConfirm"))) void evoluInstance.resetAppOwner();
  };

  const handleMigrate = async () => {
    const roomId = window.prompt("v1 Room ID:");
    if (!roomId?.trim()) return;
    setMigrating(true);
    setMigrateResult("");
    try {
      const result = await migrateFromV1(
        evoluInstance as any,
        "https://bucket-sync.esen.works",
        roomId.trim(),
      );
      setMigrateResult(`✅ ${result.lists} lists, ${result.tasks} tasks`);
    } catch (e: any) {
      setMigrateResult(`❌ ${e.message}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 safe-top safe-bottom" onClick={onClose}>
      <div className="bg-surface border border-border rounded-lg p-6 space-y-4 max-w-xs w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-center text-sm font-bold">{t("sync")}</div>
        <p className="text-xs text-text-dim text-center">{t("mnemonicHint")}</p>

        <button className="w-full py-2.5 bg-surface-2 text-sm rounded border border-border"
          onClick={() => setShowMnemonic(!showMnemonic)}>
          {showMnemonic ? t("hideMnemonic") : t("showMnemonic")}
        </button>

        {showMnemonic && appOwner?.mnemonic && (
          <textarea readOnly rows={3} value={appOwner.mnemonic}
            className="w-full bg-[color:var(--color-bg)] border border-border rounded px-2 py-1.5 font-mono text-xs select-all" />
        )}

        <button className="w-full py-2.5 bg-accent text-white text-sm rounded font-medium" onClick={handleRestore}>
          {t("restoreFromMnemonic")}
        </button>

        {/* v1 Migration */}
        <div className="border-t border-border pt-3">
          <button className="w-full py-2.5 bg-surface-2 text-sm rounded border border-border"
            onClick={handleMigrate} disabled={migrating}>
            {migrating ? "Importing..." : "📦 Import from v1"}
          </button>
          {migrateResult && <p className="text-xs text-center mt-2">{migrateResult}</p>}
        </div>

        <button className="w-full text-xs text-red-400/70 hover:text-red-400 py-1" onClick={handleReset}>
          {t("resetAll")}
        </button>
        <button className="w-full text-xs text-text-dim hover:text-text" onClick={onClose}>{t("close")}</button>
      </div>
    </div>
  );
};

// ── Welcome Screen ────────────────────────────────────────────

const ONBOARDED_KEY = "bucket-onboarded";

const Welcome: FC = () => {
  useLang();
  const evoluInstance = useEvolu();
  const { canInstall, install } = useInstallPrompt();
  const showIOSHint = isIOS && !isStandalone && !canInstall;

  const handleStart = () => {
    localStorage.setItem(ONBOARDED_KEY, "1");
    window.dispatchEvent(new Event("storage"));
  };

  const handleRestore = () => {
    const mnemonic = window.prompt(t("restoreFromMnemonic"));
    if (!mnemonic) return;
    const result = E.Mnemonic.from(mnemonic.trim());
    if (!result.ok) { alert("Invalid mnemonic"); return; }
    void evoluInstance.restoreAppOwner(result.value);
    localStorage.setItem(ONBOARDED_KEY, "1");
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="flex h-dvh items-center justify-center safe-top safe-bottom safe-x">
      <div className="max-w-sm w-full px-6 space-y-6 text-center">
        <div className="text-7xl">🪣</div>
        <h1 className="text-2xl font-bold">Bucket</h1>
        <p className="text-sm text-text-dim">{t("tagline")}</p>

        <button
          className="w-full py-3.5 bg-accent text-white rounded-lg text-sm font-bold active:scale-[0.98] transition-transform"
          onClick={handleStart}
        >
          {t("startFresh")}
        </button>

        <div className="text-xs text-text-dim">— {t("orSync")} —</div>

        <button
          className="w-full py-3.5 bg-surface border border-border rounded-lg text-sm active:scale-[0.98] transition-transform"
          onClick={handleRestore}
        >
          {t("restoreFromMnemonic")}
        </button>

        <div className="flex items-center justify-center gap-4 pt-2">
          {canInstall && (
            <button className="text-xs text-text-dim border border-dashed border-border rounded px-3 py-2 hover:border-text-dim"
              onClick={install}>{t("install")}</button>
          )}
          {showIOSHint && <div className="text-xs text-text-dim">{t("iosHint")}</div>}
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

// ── App Shell ─────────────────────────────────────────────────

export const App: FC = () => {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === "1");

  useEffect(() => {
    const handler = () => setOnboarded(localStorage.getItem(ONBOARDED_KEY) === "1");
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <EvoluProvider value={evolu}>
      <Suspense fallback={<div className="flex items-center justify-center h-screen text-text-dim">Loading…</div>}>
        {onboarded ? <Bucket /> : <Welcome />}
      </Suspense>
    </EvoluProvider>
  );
};

// ── Main ──────────────────────────────────────────────────────

const Bucket: FC = () => {
  useLang();
  const lists = useQuery(listsQ);
  const tasks = useQuery(allTasksQ);
  const [showSettings, setShowSettings] = useState(false);
  const { canInstall, install } = useInstallPrompt();

  const tasksByList = (listId: string) => tasks.filter((t) => t.listId === listId);

  return (
    <div className="min-h-dvh flex flex-col">
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      <UndoToast />

      <header className="flex items-center justify-between px-4 py-3 border-b border-border safe-top safe-x">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🪣</span>
          <span className="font-semibold text-sm tracking-tight">Bucket</span>
          <SyncDot />
        </div>
        <div className="flex items-center gap-1">
          <LangToggle />
          <ThemeToggle />
          {canInstall && (
            <button className="text-xs text-text-dim hover:text-text px-2 py-1.5 rounded hover:bg-surface" onClick={install}>📲</button>
          )}
          {isIOS && !isStandalone && !canInstall && (
            <span className="text-[10px] text-text-dim">{t("iosHint")}</span>
          )}
          <button
            className="flex items-center gap-1.5 text-xs text-text-dim hover:text-text px-2 py-1.5 rounded hover:bg-surface transition-colors"
            onClick={() => setShowSettings(true)}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 safe-x safe-bottom">
        {lists.length === 0 && (
          <div className="text-center text-text-dim mt-16 mb-8 space-y-2">
            <div className="text-4xl">📋</div>
            <p className="text-sm">{t("emptyHint")}</p>
          </div>
        )}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lists.map((list) => <ListPanel key={list.id} list={list} tasks={tasksByList(list.id)} />)}
          <NewListButton />
        </div>
      </main>
    </div>
  );
};

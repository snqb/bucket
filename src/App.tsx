import { useState, useRef, useCallback, useMemo, useEffect } from "preact/hooks";
import {
  getLists,
  getTasksForList,
  createList,
  createTask,
  updateTask,
  deleteTask,
  deleteList,
  getSyncStatus,
  getRoomId,
  setRoomId,
  generateRoomId,
  generateEncKey,
  getEncKeyStr,
  leaveRoom,
  restoreTask,
  restoreList,
  type Task,
  type List,
} from "./store";
import { useStore } from "./hooks";
import { t, getLang, setLang, onLangChange } from "./i18n";
import { encode } from "uqr";

// --- Helpers ---

const isIOS =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const isStandalone =
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true);

const hash = (s: string) => {
  let h = 0;
  for (const c of s) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  return Math.abs(h);
};

const listBg = (title: string) =>
  `hsla(${hash(title) % 360}, 40%, 25%, 0.12)`;

const NOTE_EMOJI = ["📝", "✏️", "💭", "🗒️", "💬", "🔖", "📌", "🏷️", "💡", "🪶", "📎", "🖊️"];
const taskEmoji = (id: string) => NOTE_EMOJI[hash(id) % NOTE_EMOJI.length];

// --- PWA Install Prompt ---

let deferredPrompt: any = null;
const installListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installListeners.forEach((fn) => fn());
  });
}

function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);
  useEffect(() => {
    const update = () => setCanInstall(!!deferredPrompt);
    installListeners.add(update);
    return () => { installListeners.delete(update); };
  }, []);
  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
  };
  return { canInstall, install };
}

// --- Theme ---

const THEME_KEY = "bucket-theme";
type Theme = "dark" | "light" | "auto";

function detectTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme) || "auto";
}

function applyTheme(theme: Theme) {
  const isDark = theme === "dark" || (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.body.classList.toggle("light", !isDark);
}

function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

// Apply on load
if (typeof window !== "undefined") {
  applyTheme(detectTheme());
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (detectTheme() === "auto") applyTheme("auto");
  });
}

// --- Due date helpers ---

function dueLabel(dueDate: string): { text: string; color: string } | null {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { text: t("overdue"), color: "text-red-400" };
  if (diff === 0) return { text: t("dueToday"), color: "text-yellow-400" };
  if (diff === 1) return { text: t("dueTomorrow"), color: "text-blue-400" };
  return { text: `${t("dueIn")} ${diff}${t("days")}`, color: "text-gray-400" };
}

// --- i18n reactivity ---

function useLang() {
  const [, force] = useState(0);
  useEffect(() => onLangChange(() => force((n) => n + 1)), []);
  return getLang();
}

// --- Undo toast system ---

type UndoEntry = {
  id: string;
  message: string;
  onUndo: () => void;
  timer: ReturnType<typeof setTimeout>;
};

let undoEntry: UndoEntry | null = null;
const undoListeners = new Set<() => void>();
const notifyUndo = () => undoListeners.forEach((fn) => fn());

function showUndo(message: string, onUndo: () => void, timeout = 5000) {
  if (undoEntry) clearTimeout(undoEntry.timer);
  const id = Math.random().toString(36).slice(2);
  const timer = setTimeout(() => {
    if (undoEntry?.id === id) { undoEntry = null; notifyUndo(); }
  }, timeout);
  undoEntry = { id, message, onUndo, timer };
  notifyUndo();
}

function doUndo() {
  if (!undoEntry) return;
  clearTimeout(undoEntry.timer);
  undoEntry.onUndo();
  undoEntry = null;
  notifyUndo();
}

function dismissUndo() {
  if (!undoEntry) return;
  clearTimeout(undoEntry.timer);
  undoEntry = null;
  notifyUndo();
}

function useUndo() {
  const [entry, setEntry] = useState(undoEntry);
  useEffect(() => {
    const update = () => setEntry(undoEntry);
    undoListeners.add(update);
    return () => { undoListeners.delete(update); };
  }, []);
  return entry;
}

function UndoToast() {
  const entry = useUndo();
  if (!entry) return null;
  return (
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm shadow-lg safe-bottom">
      <span class="text-gray-300">{entry.message}</span>
      <button
        class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded font-medium hover:bg-blue-700"
        onClick={doUndo}
      >
        {t("undo")}
      </button>
      <button class="text-gray-500 hover:text-white" onClick={dismissUndo}>✕</button>
    </div>
  );
}

// --- Components ---

function SyncDot() {
  const status = useStore(getSyncStatus);
  const color =
    status === "connected"
      ? "bg-green-500"
      : status === "connecting"
        ? "bg-yellow-500 animate-pulse"
        : "bg-gray-600";
  return <div class={`w-2.5 h-2.5 rounded-full ${color}`} title={status} />;
}

function LangToggle() {
  const lang = useLang();
  return (
    <button
      class="text-xs text-gray-500 hover:text-gray-300 font-mono"
      onClick={() => setLang(lang === "en" ? "ru" : "en")}
      title="Switch language"
    >
      {lang === "en" ? "RU" : "EN"}
    </button>
  );
}

function ThemeToggle() {
  const [theme, setT] = useState(detectTheme);
  const cycle = () => {
    const next: Theme = theme === "dark" ? "light" : theme === "light" ? "auto" : "dark";
    setTheme(next);
    setT(next);
  };
  const icon = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "🌗";
  return (
    <button
      class="text-xs text-gray-500 hover:text-gray-300"
      onClick={cycle}
      title={`Theme: ${theme}`}
    >
      {icon}
    </button>
  );
}

function Adder({ onAdd }: { onAdd: (text: string) => void }) {
  useLang();
  const [value, setValue] = useState("");
  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  };
  return (
    <input
      class="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2.5 text-sm placeholder:text-gray-500 outline-none focus:border-gray-500"
      placeholder={t("addTask")}
      value={value}
      onInput={(e) => setValue((e.target as HTMLInputElement).value)}
      onKeyDown={(e) => e.key === "Enter" && submit()}
    />
  );
}

function TaskBar({ task }: { task: Task }) {
  useLang();
  const [progress, setProgress] = useState(task.progress);
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState(task.description);
  const [title, setTitle] = useState(task.title);
  const [due, setDue] = useState(task.dueDate || "");
  const barRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<ReturnType<typeof setTimeout>>();
  const dragging = useRef(false);

  // Sync from external changes
  if (task.progress !== progress && !saveRef.current) setProgress(task.progress);
  if (task.description !== desc && !open) setDesc(task.description);
  if (task.title !== title && !open) setTitle(task.title);
  if ((task.dueDate || "") !== due && !open) setDue(task.dueDate || "");

  const setP = useCallback(
    (p: number) => {
      const clamped = Math.min(100, Math.max(0, p));
      setProgress(clamped);
      clearTimeout(saveRef.current);
      saveRef.current = setTimeout(() => {
        saveRef.current = undefined;
        if (clamped >= 100) {
          // Haptic feedback
          if (navigator.vibrate) navigator.vibrate(50);
          // Undo-able delete
          const snapshot = { ...task, progress: clamped };
          deleteTask(task.id);
          showUndo(`✅ ${task.title}`, () => restoreTask(snapshot));
        } else {
          updateTask(task.id, { progress: clamped });
        }
      }, 300);
    },
    [task],
  );

  const pctFromX = useCallback((clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const onTouchStart = useCallback((e: TouchEvent) => {
    dragging.current = true;
    setP(pctFromX(e.touches[0].clientX));
  }, [pctFromX, setP]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    setP(pctFromX(e.touches[0].clientX));
  }, [pctFromX, setP]);

  const onTouchEnd = useCallback(() => { dragging.current = false; }, []);

  const onMouseDown = useCallback((e: MouseEvent) => {
    dragging.current = true;
    setP(pctFromX(e.clientX));
  }, [pctFromX, setP]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    setP(pctFromX(e.clientX));
  }, [pctFromX, setP]);

  useEffect(() => {
    const up = () => { dragging.current = false; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const opacity = 1 - progress / 150;
  const lastLine = task.description?.split("\n").filter(Boolean).pop();
  const dueBadge = dueLabel(task.dueDate || "");

  return (
    <div style={{ opacity }}>
      {/* Progress bar — h-11 = 44px for iOS HIG touch targets */}
      <div
        ref={barRef}
        class={`relative h-11 cursor-pointer select-none border border-gray-700 overflow-hidden touch-raw ${lastLine || open ? "rounded-t" : "rounded"}`}
        role="slider"
        aria-label={`${task.title} — ${progress}%`}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setP(Math.min(100, progress + 5));
          else if (e.key === "ArrowLeft") setP(Math.max(0, progress - 5));
          else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); }
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
      >
        {/* Segments via CSS gradient — 3 divs instead of 50 */}
        <div class="absolute inset-0 bg-gray-700/40" />
        <div
          class="absolute inset-y-0 left-0 bg-blue-500"
          style={`width:${progress}%;transition:width 50ms linear`}
        />
        <div
          class="absolute inset-0 pointer-events-none"
          style="background:repeating-linear-gradient(90deg,transparent 0,transparent calc(2% - 1px),rgba(0,0,0,0.35) calc(2% - 1px),rgba(0,0,0,0.35) 2%)"
        />

        <div class="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
          <div class="flex items-center gap-1.5 truncate max-w-[70%]">
            {!lastLine && (
              <span
                class="text-xs pointer-events-auto cursor-pointer hover:scale-125 transition-transform"
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                title={t("notes")}
              >
                {taskEmoji(task.id)}
              </span>
            )}
            <span
              class="text-sm font-bold truncate"
              style="text-shadow:0 1px 3px rgba(0,0,0,.9)"
            >
              {task.title}
            </span>
          </div>
          <div class="flex items-center gap-2">
            {dueBadge && (
              <span
                class={`text-[10px] font-medium ${dueBadge.color}`}
                style="text-shadow:0 1px 3px rgba(0,0,0,.9)"
              >
                {dueBadge.text}
              </span>
            )}
            <span
              class="text-xs font-bold text-gray-300 tabular-nums"
              style="text-shadow:0 1px 3px rgba(0,0,0,.9)"
            >
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Note preview */}
      {lastLine && !open && (
        <div
          class="px-3 py-1.5 text-xs text-gray-500 truncate border-x border-b border-gray-700 rounded-b cursor-pointer hover:text-gray-400"
          onClick={() => setOpen(true)}
        >
          {lastLine}
        </div>
      )}

      {/* Detail panel — title editing + notes + delete */}
      {open && (
        <div class="border-x border-b border-gray-700 rounded-b p-3 space-y-2 bg-gray-900/50">
          <input
            class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-gray-500"
            placeholder={t("taskTitle")}
            value={title}
            onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
            onBlur={() => title.trim() && updateTask(task.id, { title: title.trim() })}
          />
          <div class="flex gap-2 items-center">
            <label class="text-xs text-gray-400 shrink-0">{t("dueDate")}</label>
            <input
              type="date"
              class="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-300 outline-none focus:border-gray-500"
              value={due}
              onInput={(e) => {
                const v = (e.target as HTMLInputElement).value;
                setDue(v);
                updateTask(task.id, { dueDate: v });
              }}
            />
            {due && (
              <button
                class="text-xs text-gray-500 hover:text-gray-300"
                onClick={() => { setDue(""); updateTask(task.id, { dueDate: "" }); }}
              >✕</button>
            )}
          </div>
          <textarea
            class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-gray-300 resize-none outline-none focus:border-gray-500"
            rows={3}
            placeholder={t("notes")}
            value={desc}
            onInput={(e) => setDesc((e.target as HTMLTextAreaElement).value)}
            onBlur={() => updateTask(task.id, { description: desc })}
          />
          <div class="flex gap-3">
            <button
              class="text-xs text-red-400 hover:text-red-300 py-1"
              onClick={() => {
                const snapshot = { ...task };
                deleteTask(task.id);
                setOpen(false);
                showUndo(t("completed"), () => restoreTask(snapshot));
              }}
            >
              {t("del")}
            </button>
            <button class="text-xs text-gray-400 hover:text-gray-300 ml-auto py-1" onClick={() => setOpen(false)}>
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ListPanel({ list }: { list: List }) {
  useLang();
  const tasks = useStore(() => getTasksForList(list.id));
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>();

  const avg = tasks.length > 0
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
    : 0;

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      confirmTimer.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    clearTimeout(confirmTimer.current);
    // Undo-able list delete
    const listSnapshot = { ...list };
    const taskSnapshots = tasks.map((t) => ({ ...t }));
    deleteList(list.id);
    showUndo(`${list.emoji} ${list.title}`, () => {
      restoreList(listSnapshot);
      taskSnapshots.forEach((t) => restoreTask(t));
    });
  };

  return (
    <div class="p-5 space-y-2 rounded-lg" style={{ background: listBg(list.title) }}>
      <div class="flex items-center gap-2 pb-2 border-b border-gray-700/50">
        <span class="text-lg">{list.emoji}</span>
        <h2 class="font-bold text-sm truncate flex-1">{list.title}</h2>
        {tasks.length > 0 && (
          <span class="text-xs text-gray-500 tabular-nums">{t("avg")} {avg}%</span>
        )}
        <button
          class={`text-xs py-1 px-1.5 rounded transition-colors ${
            confirming
              ? "text-red-400 bg-red-900/30 font-medium"
              : "text-gray-500 hover:text-red-400"
          }`}
          onClick={handleDelete}
        >
          {confirming ? t("confirmDelete") : "✕"}
        </button>
      </div>
      <div class="space-y-2">
        {tasks.map((t) => <TaskBar key={t.id} task={t} />)}
      </div>
      <Adder onAdd={(title) => createTask(list.id, title)} />
    </div>
  );
}

function NewListButton() {
  useLang();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = () => {
    const v = name.trim();
    if (!v) return;
    createList(v);
    setName("");
    setOpen(false);
  };
  if (!open)
    return (
      <button
        class="w-full p-4 border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 text-sm rounded-lg"
        onClick={() => setOpen(true)}
      >
        {t("newList")}
      </button>
    );
  return (
    <div class="p-4 border border-gray-700 rounded-lg space-y-2">
      <input
        class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        placeholder={t("listName")}
        value={name}
        autoFocus
        onInput={(e) => setName((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") create();
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <div class="flex gap-2">
        <button class="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700" onClick={create}>{t("create")}</button>
        <button class="px-3 py-2 text-gray-400 text-xs hover:text-white" onClick={() => setOpen(false)}>{t("cancel")}</button>
      </div>
    </div>
  );
}

// --- QR Scanner ---

function QrScanner({ onScan, onClose }: { onScan: (data: string) => void; onClose: () => void }) {
  useLang();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // iOS doesn't support BarcodeDetector — show instructions instead
    if (isIOS) {
      setError(t("qrIOS"));
      return;
    }

    let stopped = false;
    const hasBarcodeDetector = "BarcodeDetector" in window;

    if (!hasBarcodeDetector) {
      setError(t("qrUnsupported"));
      return;
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        const scan = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const raw = barcodes[0].rawValue;
              const match = raw.match(/[?&]join=([a-z0-9]+)/i);
              onScan(match ? match[1] : raw);
              return;
            }
          } catch {}
          requestAnimationFrame(scan);
        };
        scan();
      } catch (e: any) {
        setError(e.message || "Camera access denied");
      }
    })();

    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div class="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 safe-top safe-bottom">
      <div class="max-w-sm w-full mx-4 space-y-4">
        <div class="text-center text-sm font-bold">{t("scanQR")}</div>
        {error ? (
          <div class="text-center text-sm text-gray-300 p-4 border border-gray-700 rounded">{error}</div>
        ) : (
          <div class="relative rounded-lg overflow-hidden border border-gray-700">
            <video
              ref={videoRef}
              class="w-full aspect-square object-cover"
              playsInline
              muted
            />
            <div class="absolute inset-0 border-2 border-blue-500/50 rounded-lg pointer-events-none" />
            <div class="absolute inset-[25%] border-2 border-white/30 rounded pointer-events-none" />
          </div>
        )}
        <button
          class="w-full py-3 text-sm text-gray-400 hover:text-white"
          onClick={() => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            onClose();
          }}
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

// --- Room Setup ---

function RoomSetup() {
  useLang();

  // Auto-join from ?join=ROOMID or ?join=ROOMID#k=ENCKEY
  const joinParam = new URLSearchParams(location.search).get("join");
  if (joinParam?.trim()) {
    const keyMatch = location.hash.match(/k=([A-Za-z0-9_-]+)/);
    history.replaceState(null, "", location.pathname);
    setRoomId(joinParam.trim(), keyMatch?.[1]);
    return null;
  }

  const [input, setInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const { canInstall, install } = useInstallPrompt();

  const handleJoin = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const colon = trimmed.indexOf(":");
    if (colon > 0) {
      setRoomId(trimmed.slice(0, colon), trimmed.slice(colon + 1));
    } else {
      setRoomId(trimmed);
    }
  };

  const handleScan = (data: string) => {
    setScanning(false);
    handleJoin(data);
  };

  const showIOSHint = isIOS && !isStandalone && !canInstall;

  return (
    <div class="flex h-dvh items-center justify-center safe-top safe-bottom safe-x">
      {scanning && <QrScanner onScan={handleScan} onClose={() => setScanning(false)} />}
      <div class="max-w-sm w-full px-6 space-y-6 text-center">
        <div class="text-7xl">🪣</div>
        <h1 class="text-2xl font-bold">Bucket</h1>
        <p class="text-sm text-gray-400">{t("tagline")}</p>

        <button
          class="w-full py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold active:scale-[0.98] transition-transform"
          onClick={() => setRoomId(generateRoomId(), generateEncKey())}
        >
          {t("startFresh")}
        </button>

        <div class="text-xs text-gray-500">{t("orSync")}</div>

        <button
          class="w-full py-3.5 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 text-sm active:scale-[0.98] transition-transform"
          onClick={() => setScanning(true)}
        >
          {t("scanQR")}
        </button>

        <div class="flex gap-2">
          <input
            class="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            placeholder={t("pasteRoom")}
            value={input}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin(input)}
          />
          <button
            class="px-4 py-2.5 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600"
            onClick={() => handleJoin(input)}
          >
            {t("join")}
          </button>
        </div>

        <div class="flex items-center justify-center gap-4 pt-2">
          {canInstall && (
            <button
              class="text-xs text-gray-500 hover:text-white border border-dashed border-gray-700 rounded px-3 py-2 hover:border-gray-500"
              onClick={install}
            >
              {t("install")}
            </button>
          )}
          {showIOSHint && (
            <div class="text-xs text-gray-600">{t("iosHint")}</div>
          )}
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

// --- QR SVG ---

function QrSvg({ data, size = 200 }: { data: string; size?: number }) {
  const { data: grid, size: qrSize } = useMemo(() => encode(data), [data]);
  const cellSize = size / qrSize;
  const rects: string[] = [];
  for (let y = 0; y < qrSize; y++) {
    for (let x = 0; x < qrSize; x++) {
      if ((grid as unknown as boolean[][])[y][x]) {
        rects.push(`<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}"/>`);
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="white"/><g fill="black">${rects.join("")}</g></svg>`;
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}

// --- Room QR / Share ---

function RoomQr({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  useLang();
  const svgRef = useRef<HTMLDivElement>(null);
  const encKey = getEncKeyStr();
  const shareUrl = `${location.origin}?join=${roomId}${encKey ? "#k=" + encKey : ""}`;
  const copyStr = encKey ? `${roomId}:${encKey}` : roomId;

  const [copied, setCopied] = useState("");

  const save = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bucket-${roomId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = () => {
    navigator.clipboard.writeText(copyStr);
    setCopied("id");
    setTimeout(() => setCopied(""), 1500);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied("link");
    setTimeout(() => setCopied(""), 1500);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Bucket", url: shareUrl });
      } catch {}
    } else {
      copyLink();
    }
  };

  const handleLeave = () => {
    if (confirm(t("leaveConfirm"))) {
      onClose();
      leaveRoom();
    }
  };

  return (
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 safe-top safe-bottom" onClick={onClose}>
      <div class="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4 max-w-xs w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div class="text-center text-sm font-bold">{t("sync")}</div>
        <div class="flex justify-center" ref={svgRef}>
          <QrSvg data={shareUrl} size={200} />
        </div>
        <div
          class="text-center font-mono text-xs text-gray-400 bg-gray-800 rounded px-3 py-2 cursor-pointer hover:text-white select-all break-all"
          onClick={copy}
          title="Click to copy"
        >
          {roomId}
          {encKey && <span class="text-green-500/70 ml-1">🔒</span>}
        </div>
        <button
          class="w-full py-2.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium"
          onClick={share}
        >
          {copied === "link" ? "✓ " : "🔗 "}{t("shareLink")}
        </button>
        <div class="flex gap-2">
          <button class="flex-1 py-2.5 bg-gray-700 text-white text-xs rounded hover:bg-gray-600" onClick={save}>
            {t("saveQR")}
          </button>
          <button class="flex-1 py-2.5 bg-gray-700 text-white text-xs rounded hover:bg-gray-600" onClick={copy}>
            {copied === "id" ? "✓" : ""} {t("copyID")}
          </button>
        </div>
        <button
          class="w-full text-xs text-red-400/70 hover:text-red-400 py-1"
          onClick={handleLeave}
        >
          {t("leave")}
        </button>
        <button class="w-full text-xs text-gray-500 hover:text-gray-300" onClick={onClose}>{t("close")}</button>
      </div>
    </div>
  );
}

// --- Main App ---

export function App() {
  const roomId = useStore(getRoomId);
  if (!roomId) return <RoomSetup />;
  return <Bucket roomId={roomId} />;
}

function Bucket({ roomId }: { roomId: string }) {
  useLang();
  const lists = useStore(getLists);
  const [showQr, setShowQr] = useState(false);
  const { canInstall, install } = useInstallPrompt();

  return (
    <div class="min-h-dvh flex flex-col">
      {showQr && <RoomQr roomId={roomId} onClose={() => setShowQr(false)} />}
      <UndoToast />

      <header class="flex items-center justify-between p-3 border-b border-gray-800 safe-top safe-x">
        <div class="flex items-center gap-2">
          <span class="text-lg">🪣</span>
          <SyncDot />
        </div>
        <div class="flex items-center gap-3">
          <LangToggle />
          <ThemeToggle />
          {canInstall && (
            <button
              class="text-xs text-gray-500 hover:text-gray-300"
              onClick={install}
              title={t("install")}
            >
              📲
            </button>
          )}
          <button
            class="text-sm text-gray-500 hover:text-gray-300 px-1"
            onClick={() => setShowQr(true)}
            title={t("sync")}
          >
            ⚙
          </button>
        </div>
      </header>

      <main class="flex-1 p-4 safe-x safe-bottom">
        {lists.length === 0 && (
          <div class="text-center text-gray-600 mt-16 mb-8 space-y-2">
            <div class="text-4xl">📋</div>
            <p class="text-sm">{t("emptyHint")}</p>
          </div>
        )}
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lists.map((list) => <ListPanel key={list.id} list={list} />)}
          <NewListButton />
        </div>
      </main>
    </div>
  );
}

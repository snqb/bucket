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
  type Task,
  type List,
} from "./store";
import { useStore } from "./hooks";
import { encode } from "uqr";

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

// --- Helpers ---

const hash = (s: string) => {
  let h = 0;
  for (const c of s) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  return Math.abs(h);
};

const listBg = (title: string) =>
  `hsla(${hash(title) % 360}, 40%, 25%, 0.1)`;

const NOTE_EMOJI = ["📝", "✏️", "💭", "🗒️", "💬", "🔖", "📌", "🏷️", "💡", "🪶", "📎", "🖊️"];
const taskEmoji = (id: string) => NOTE_EMOJI[hash(id) % NOTE_EMOJI.length];

// --- Components ---

function SyncDot() {
  const status = useStore(getSyncStatus);
  const color =
    status === "connected"
      ? "bg-green-500"
      : status === "connecting"
        ? "bg-yellow-500 animate-pulse"
        : "bg-gray-600";
  return <div class={`w-2 h-2 rounded-full ${color}`} title={status} />;
}

function Adder({ onAdd }: { onAdd: (text: string) => void }) {
  const [value, setValue] = useState("");
  const submit = () => {
    const t = value.trim();
    if (!t) return;
    onAdd(t);
    setValue("");
  };
  return (
    <input
      class="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-sm placeholder:text-gray-500 outline-none focus:border-gray-500"
      placeholder="Add a task..."
      value={value}
      onInput={(e) => setValue((e.target as HTMLInputElement).value)}
      onKeyDown={(e) => e.key === "Enter" && submit()}
    />
  );
}

function TaskBar({ task }: { task: Task }) {
  const [progress, setProgress] = useState(task.progress);
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState(task.description);
  const saveRef = useRef<ReturnType<typeof setTimeout>>();

  if (task.progress !== progress && !saveRef.current) setProgress(task.progress);

  const setP = useCallback(
    (p: number) => {
      setProgress(p);
      clearTimeout(saveRef.current);
      saveRef.current = setTimeout(() => {
        saveRef.current = undefined;
        if (p >= 100) {
          deleteTask(task.id);
        } else {
          updateTask(task.id, { progress: p });
        }
      }, 300);
    },
    [task.id],
  );

  const handleBarClick = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    setP(pct);
  };

  const handleBarDrag = (e: MouseEvent) => {
    if (e.buttons !== 1) return;
    handleBarClick(e);
  };

  const opacity = 1 - progress / 150;
  const lastLine = task.description?.split("\n").filter(Boolean).pop();

  return (
    <div style={{ opacity }}>
      <div
        class={`relative h-7 cursor-pointer select-none border border-gray-700 overflow-hidden ${lastLine || open ? "rounded-t" : "rounded"}`}
        onClick={handleBarClick}
        onMouseMove={handleBarDrag}
      >
        <div class="absolute inset-0 flex gap-px pointer-events-none">
          {Array.from({ length: 50 }, (_, i) => {
            const filled = progress >= Math.round(((i + 1) / 50) * 100);
            return (
              <div
                key={i}
                class={`flex-1 transition-colors ${filled ? "bg-blue-500" : "bg-gray-700/40"}`}
                style="min-width:2px"
              />
            );
          })}
        </div>
        <div class="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
          <div class="flex items-center gap-1.5 truncate max-w-[70%]">
            {!lastLine && (
              <span
                class="text-xs pointer-events-auto cursor-pointer hover:scale-125 transition-transform"
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                title="Add notes"
              >
                {taskEmoji(task.id)}
              </span>
            )}
            <span
              class="text-xs font-bold truncate pointer-events-auto cursor-pointer hover:text-blue-400"
              style="text-shadow:0 1px 3px rgba(0,0,0,.9)"
              onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
            >
              {task.title}
            </span>
          </div>
          <span
            class="text-xs font-bold text-gray-300 tabular-nums"
            style="text-shadow:0 1px 3px rgba(0,0,0,.9)"
          >
            {progress}%
          </span>
        </div>
      </div>

      {lastLine && !open && (
        <div
          class="px-3 py-1 text-xs text-gray-500 truncate border-x border-b border-gray-700 rounded-b cursor-pointer hover:text-gray-400"
          onClick={() => setOpen(true)}
        >
          {lastLine}
        </div>
      )}

      {open && (
        <div class="border-x border-b border-gray-700 rounded-b p-3 space-y-2 bg-gray-900/50">
          <textarea
            class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-gray-300 resize-none outline-none focus:border-gray-500"
            rows={3}
            placeholder="Notes..."
            value={desc}
            onInput={(e) => setDesc((e.target as HTMLTextAreaElement).value)}
            onBlur={() => updateTask(task.id, { description: desc })}
          />
          <div class="flex gap-2">
            <button class="text-xs text-red-400 hover:text-red-300" onClick={() => deleteTask(task.id)}>Delete</button>
            <button class="text-xs text-gray-400 hover:text-gray-300 ml-auto" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ListPanel({ list }: { list: List }) {
  const tasks = useStore(() => getTasksForList(list.id));
  return (
    <div class="p-5 space-y-2" style={{ background: listBg(list.title) }}>
      <div class="flex items-center gap-2 pb-2 border-b border-gray-700/50">
        <span class="text-lg">{list.emoji}</span>
        <h2 class="font-bold text-sm truncate flex-1">{list.title}</h2>
        <button
          class="text-gray-500 hover:text-red-400 text-xs"
          onClick={() => { if (confirm(`Delete "${list.title}"?`)) deleteList(list.id); }}
        >
          ✕
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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = () => {
    const t = name.trim();
    if (!t) return;
    createList(t);
    setName("");
    setOpen(false);
  };
  if (!open)
    return (
      <button
        class="w-full p-4 border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 text-sm"
        onClick={() => setOpen(true)}
      >
        + New List
      </button>
    );
  return (
    <div class="p-4 border border-gray-700 space-y-2">
      <input
        class="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
        placeholder="List name..."
        value={name}
        autoFocus
        onInput={(e) => setName((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") create();
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <div class="flex gap-2">
        <button class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700" onClick={create}>Create</button>
        <button class="px-3 py-1 text-gray-400 text-xs hover:text-white" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

// --- QR Scanner ---

function QrScanner({ onScan, onClose }: { onScan: (data: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let stopped = false;
    const hasBarcodeDetector = "BarcodeDetector" in window;

    if (!hasBarcodeDetector) {
      setError("QR scanning not supported in this browser. Paste the room ID instead.");
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
              // Extract room ID from URL or raw string
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
    <div class="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
      <div class="max-w-sm w-full mx-4 space-y-4">
        <div class="text-center text-sm font-bold">Scan QR to join</div>
        {error ? (
          <div class="text-center text-sm text-red-400 p-4 border border-red-800 rounded">{error}</div>
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
          class="w-full py-2 text-sm text-gray-400 hover:text-white"
          onClick={() => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            onClose();
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function RoomSetup() {
  // Auto-join from ?join=ROOMID (QR code link)
  const joinParam = new URLSearchParams(location.search).get("join");
  if (joinParam?.trim()) {
    history.replaceState(null, "", location.pathname);
    setRoomId(joinParam.trim());
    return null;
  }

  const [input, setInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const { canInstall, install } = useInstallPrompt();

  const handleScan = (data: string) => {
    setScanning(false);
    if (data.trim()) setRoomId(data.trim());
  };

  return (
    <div class="flex h-screen items-center justify-center">
      {scanning && <QrScanner onScan={handleScan} onClose={() => setScanning(false)} />}
      <div class="max-w-sm w-full px-6 space-y-6 text-center">
        <div class="text-7xl">🪣</div>
        <h1 class="text-2xl font-bold">Bucket</h1>
        <p class="text-sm text-gray-400">Track progress with bars, not checkboxes.</p>

        <button
          class="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold"
          onClick={() => setRoomId(generateRoomId())}
        >
          Start Fresh
        </button>

        <div class="text-xs text-gray-500">— or sync with another device —</div>

        <button
          class="w-full py-3 bg-gray-800 border border-gray-700 text-white rounded hover:bg-gray-700 text-sm"
          onClick={() => setScanning(true)}
        >
          📷 Scan QR Code
        </button>

        <div class="flex gap-2">
          <input
            class="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Paste room ID..."
            value={input}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => e.key === "Enter" && input.trim() && setRoomId(input.trim())}
          />
          <button
            class="px-4 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
            onClick={() => input.trim() && setRoomId(input.trim())}
          >
            Join
          </button>
        </div>

        {canInstall && (
          <button
            class="w-full py-2 text-xs text-gray-500 hover:text-white border border-dashed border-gray-700 rounded hover:border-gray-500"
            onClick={install}
          >
            📲 Install App
          </button>
        )}
      </div>
    </div>
  );
}

export function App() {
  const roomId = useStore(getRoomId);
  if (!roomId) return <RoomSetup />;
  return <Bucket roomId={roomId} />;
}

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

function RoomQr({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const svgRef = useRef<HTMLDivElement>(null);

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
    navigator.clipboard.writeText(roomId);
  };

  return (
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div class="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4 max-w-xs w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div class="text-center text-sm font-bold">Sync another device</div>
        <div class="flex justify-center" ref={svgRef}>
          <QrSvg data={`${location.origin}?join=${roomId}`} size={200} />
        </div>
        <div
          class="text-center font-mono text-xs text-gray-400 bg-gray-800 rounded px-3 py-2 cursor-pointer hover:text-white select-all"
          onClick={copy}
          title="Click to copy"
        >
          {roomId}
        </div>
        <div class="flex gap-2">
          <button class="flex-1 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700" onClick={save}>
            💾 Save QR
          </button>
          <button class="flex-1 py-2 bg-gray-700 text-white text-xs rounded hover:bg-gray-600" onClick={copy}>
            📋 Copy ID
          </button>
        </div>
        <button class="w-full text-xs text-gray-500 hover:text-gray-300" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function Bucket({ roomId }: { roomId: string }) {
  const lists = useStore(getLists);
  const [showQr, setShowQr] = useState(false);
  const { canInstall, install } = useInstallPrompt();

  return (
    <div class="min-h-screen flex flex-col">
      {showQr && <RoomQr roomId={roomId} onClose={() => setShowQr(false)} />}
      <header class="flex items-center justify-between p-3 border-b border-gray-800">
        <div class="flex items-center gap-2">
          <span class="text-lg">🪣</span>
          <SyncDot />
        </div>
        <div class="flex items-center gap-3">
          {canInstall && (
            <button
              class="text-xs text-gray-500 hover:text-gray-300"
              onClick={install}
              title="Install app"
            >
              📲
            </button>
          )}
          <button
            class="text-xs text-gray-500 hover:text-gray-300"
            onClick={() => setShowQr(true)}
            title="Sync / share"
          >
            ⊞
          </button>
        </div>
      </header>
      <main class="flex-1 p-4">
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lists.map((list) => <ListPanel key={list.id} list={list} />)}
          <NewListButton />
        </div>
      </main>
    </div>
  );
}

import { Suspense, useState, useCallback, useRef, type FC } from "react";
import * as E from "@evolu/common";
import { useQuery } from "@evolu/react";
import { Schema, type ListId, type TaskId } from "@bucket/core";
import { evolu, useEvolu, EvoluProvider } from "./evolu.ts";

// ── Queries (inline for now, move to core later) ──────────────
const listsQ = evolu.createQuery((db) =>
  db
    .selectFrom("list")
    .select(["id", "title", "emoji", "position", "createdAt"])
    .where("isDeleted", "is not", E.sqliteTrue)
    .where("title", "is not", null)
    .$narrowType<{ title: E.kysely.NotNull }>()
    .orderBy("position")
    .orderBy("createdAt"),
);

const allTasksQ = evolu.createQuery((db) =>
  db
    .selectFrom("task")
    .select(["id", "listId", "title", "description", "progress", "dueDate", "createdAt"])
    .where("isDeleted", "is not", E.sqliteTrue)
    .where("title", "is not", null)
    .$narrowType<{ title: E.kysely.NotNull }>()
    .orderBy("createdAt"),
);

// ── App Shell ─────────────────────────────────────────────────
export const App: FC = () => (
  <EvoluProvider value={evolu}>
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-text-dim">Loading…</div>}>
      <Main />
    </Suspense>
  </EvoluProvider>
);

// ── Main ──────────────────────────────────────────────────────
const Main: FC = () => {
  const lists = useQuery(listsQ);
  const tasks = useQuery(allTasksQ);
  const { insert, update } = useEvolu();
  const [activeList, setActiveList] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTasks = activeList
    ? tasks.filter((t) => t.listId === activeList)
    : tasks;

  const addTask = useCallback(() => {
    const title = inputRef.current?.value.trim();
    if (!title || !activeList) return;
    const result = insert("task", {
      title,
      listId: activeList as ListId,
      progress: 0 as any,
    });
    if (result.ok) {
      inputRef.current!.value = "";
      setAdding(false);
    }
  }, [activeList, insert]);

  const addList = useCallback(() => {
    const title = window.prompt("List name");
    if (!title?.trim()) return;
    insert("list", { title: title.trim() });
  }, [insert]);

  return (
    <div className="h-full flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] h-14 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">bucket</h1>
        <button onClick={addList} className="text-text-dim hover:text-text text-2xl leading-none">+</button>
      </header>

      {/* List tabs */}
      <nav className="flex gap-1 px-4 py-2 overflow-x-auto shrink-0 scrollbar-none">
        <Pill active={!activeList} onClick={() => setActiveList(null)}>All</Pill>
        {lists.map((l) => (
          <Pill key={l.id} active={activeList === l.id} onClick={() => setActiveList(l.id)}>
            {l.emoji ?? "📋"} {l.title}
          </Pill>
        ))}
      </nav>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
        {filteredTasks.map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}

        {filteredTasks.length === 0 && (
          <p className="text-text-dim text-sm text-center pt-12">No tasks yet</p>
        )}
      </div>

      {/* Add bar */}
      {activeList && (
        <div className="shrink-0 px-4 pb-[env(safe-area-inset-bottom)] pb-4">
          {adding ? (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                autoFocus
                placeholder="Task name…"
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className="flex-1 bg-surface rounded-lg px-3 py-2.5 text-sm outline-none placeholder:text-text-dim"
              />
              <button onClick={addTask} className="bg-accent text-white rounded-lg px-4 text-sm font-medium">Add</button>
              <button onClick={() => setAdding(false)} className="text-text-dim text-sm">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full bg-surface hover:bg-surface-2 rounded-lg py-2.5 text-sm text-text-dim transition-colors"
            >
              + Add task
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Pill ──────────────────────────────────────────────────────
const Pill: FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className={`shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
      active ? "bg-accent text-white" : "bg-surface text-text-dim hover:text-text"
    }`}
  >
    {children}
  </button>
);

// ── Task Row with Progress Bar ────────────────────────────────
type TaskRowProps = {
  task: (typeof allTasksQ)["Row"];
};

const TaskRow: FC<TaskRowProps> = ({ task }) => {
  const { update } = useEvolu();
  const progress = task.progress ?? 0;
  const barRef = useRef<HTMLDivElement>(null);

  const setProgress = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.round(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
      update("task", { id: task.id as TaskId, progress: pct as any });
    },
    [task.id, update],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setProgress(e.clientX);
    },
    [setProgress],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.buttons === 0) return;
      setProgress(e.clientX);
    },
    [setProgress],
  );

  const handleDelete = useCallback(() => {
    update("task", { id: task.id as TaskId, isDeleted: E.sqliteTrue });
  }, [task.id, update]);

  return (
    <div className="group flex items-center gap-3 py-1.5">
      {/* Progress bar */}
      <div
        ref={barRef}
        className="progress-bar flex-1 h-8 bg-bar-bg rounded-md relative cursor-pointer overflow-hidden select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <div
          className="absolute inset-y-0 left-0 bg-bar/30 rounded-md transition-[width] duration-75"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 flex items-center px-3 text-sm">
          <span className={`flex-1 truncate ${progress === 100 ? "line-through text-text-dim" : ""}`}>
            {task.title}
          </span>
          <span className="text-text-dim text-xs tabular-nums ml-2">{progress}%</span>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-red-400 text-xs transition-opacity"
      >
        ✕
      </button>
    </div>
  );
};

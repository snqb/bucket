import { HTMLMotionProps, motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPortal,
  DialogTrigger,
} from "./components/ui/dialog";
import { Slider } from "./components/ui/slider";
import { Textarea } from "./components/ui/textarea";
import { Button } from "./components/ui/button";
import { Minus, Plus, Check } from "lucide-react";
import Confetti from "react-confetti";

import { useActions, useLists } from "@bucket/core";
import type { Task as TaskType } from "@bucket/core";

type Props = HTMLMotionProps<"div"> & {
  task: TaskType;
};

export const Task = (props: Props) => {
  const { task } = props;
  const actions = useActions();
  const lists = useLists();

  const [localProgress, setLocalProgress] = useState(task.progress);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [editingDialogTitle, setEditingDialogTitle] = useState(false);
  const [dialogTitleValue, setDialogTitleValue] = useState(task.title);
  const [showCelebration, setShowCelebration] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Memoize opacity calculation for performance
  const opacity = useMemo(() => 1 - localProgress / 150, [localProgress]);

  const deleteTask = useCallback(() => {
    actions.deleteTask(task.id);
  }, [task, actions]);

  const updateTaskDescription = (text: string) => {
    actions.updateTask(task.id, { description: text });
  };

  // Save progress to backend with debounce
  const saveProgress = useCallback(
    (progress: number) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (progress >= 100) {
          // Show celebration before deleting
          setShowCelebration(true);
          setTimeout(() => {
            setShowCelebration(false);
            deleteTask();
          }, 2000); // 2 seconds of confetti
        } else {
          actions.updateTask(task.id, { progress });
        }
      }, 300);
    },
    [actions, task.id, deleteTask],
  );

  // Sync local state when task progress changes from outside
  useEffect(() => {
    setLocalProgress(task.progress);
  }, [task.progress]);

  const handleEditSave = () => {
    if (editTitle.trim()) {
      actions.updateTask(task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setIsEditing(true);
    }, 300); // Reduced from 500ms to 300ms for better responsiveness
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const lastDescriptionLine = task.description
    ?.split("\n")
    .filter(Boolean)
    .pop();

  return (
    <>
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
          />
        </div>
      )}
      <Dialog modal={false}>
        <motion.div
          className="w-full select-none rounded-lg border border-gray-700 bg-gray-900/50 p-4 hover:border-gray-600 transition-colors"
          style={{ opacity }}
        >
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSave();
                  if (e.key === "Escape") handleEditCancel();
                }}
                className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-base text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleEditSave}
                className="h-8 w-8 bg-green-600 p-0 hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={handleEditCancel}
                className="h-8 w-8 bg-red-600 p-0 hover:bg-red-700"
              >
                ✕
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Title and description */}
              <div className="flex flex-col gap-1.5">
                <DialogTrigger asChild>
                  <p
                    className="cursor-pointer text-base font-medium text-white hover:text-blue-400 transition-colors"
                    onDoubleClick={() => setIsEditing(true)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    title="Double-click to edit (desktop) or long-press (mobile)"
                  >
                    {task.title}
                  </p>
                </DialogTrigger>
                {lastDescriptionLine && (
                  <DialogTrigger asChild>
                    <p className="cursor-pointer truncate text-sm text-gray-400 hover:text-blue-400 transition-colors">
                      {lastDescriptionLine}
                    </p>
                  </DialogTrigger>
                )}
              </div>

              {/* Progress bar - much larger and more visible */}
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => {
                    const newProgress = Math.max(0, localProgress - 10);
                    setLocalProgress(newProgress);
                    saveProgress(newProgress);
                  }}
                  className="h-8 w-8 bg-gray-700 p-0 hover:bg-gray-600 transition-colors"
                  aria-label="Decrease progress"
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <div className="flex-1">
                  <Slider
                    value={[localProgress]}
                    onValueChange={(value) => {
                      setLocalProgress(value[0]);
                      saveProgress(value[0]);
                    }}
                    max={100}
                    step={1}
                    className="flex-1"
                    aria-label={`Progress: ${localProgress}%`}
                  />
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    const newProgress = Math.min(100, localProgress + 10);
                    setLocalProgress(newProgress);
                    saveProgress(newProgress);
                  }}
                  className="h-8 w-8 bg-gray-700 p-0 hover:bg-gray-600 transition-colors"
                  aria-label="Increase progress"
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <span className="w-12 text-right text-sm font-medium text-gray-300">
                  {localProgress}%
                </span>
              </div>
            </div>
          )}
        </motion.div>

      <DialogPortal>
        <DialogContent className="bg-black">
          <DialogHeader className="text-left">
            {editingDialogTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={dialogTitleValue}
                  onChange={(e) => setDialogTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (dialogTitleValue.trim()) {
                        actions.updateTask(task.id, { title: dialogTitleValue.trim() });
                      }
                      setEditingDialogTitle(false);
                    }
                    if (e.key === "Escape") {
                      setDialogTitleValue(task.title);
                      setEditingDialogTitle(false);
                    }
                  }}
                  className="flex-1 rounded px-2 py-1 text-white bg-gray-800 border border-gray-600"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (dialogTitleValue.trim()) {
                      actions.updateTask(task.id, { title: dialogTitleValue.trim() });
                    }
                    setEditingDialogTitle(false);
                  }}
                  className="h-6 w-6 bg-green-600 p-0 text-white"
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setDialogTitleValue(task.title);
                  setEditingDialogTitle(true);
                }}
                className="cursor-pointer rounded px-1 hover:bg-gray-800"
              >
                {task.title}
              </div>
            )}
          </DialogHeader>
          <div
            data-task={task.id}
            className="flex flex-col items-stretch gap-4"
          >
            <div>
              <h4 className="text-md mb-2 text-left">Move to: </h4>
              <div className="flex flex-wrap gap-2">
                {lists
                  ?.filter((list) => list.id !== task.listId)
                  .map((list) => (
                    <Button
                      key={String(list.id)}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        actions.deleteTask(task.id);
                        actions.createTask(
                          String(list.id),
                          task.title,
                          task.description,
                        );
                      }}
                      className="flex items-center gap-2 border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                    >
                      <span>{list.emoji}</span>
                      <span>{list.title}</span>
                    </Button>
                  ))}
              </div>
            </div>
            <div>
              <h4 className="text-md mb-2 text-left">Description:</h4>
              <Textarea
                className="border-0 bg-gray-800 text-white"
                defaultValue={task.description}
                onBlur={(e) => updateTaskDescription(e.currentTarget.value)}
                rows={10}
                placeholder="Longer text"
              />
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
    </>
  );
};

import {
  HTMLMotionProps,
  motion,
  useMotionValue,
  animate,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
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

import { useActions } from "./tinybase-hooks";

type Props = HTMLMotionProps<"div"> & {
  task: any;
};

export const Task = (props: Props) => {
  const { task } = props;
  const actions = useActions();

  const [localProgress, setLocalProgress] = useState(task.progress);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const scale = useMotionValue(1);

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
          deleteTask();
        } else {
          actions.updateTask(task.id, { progress });
        }
      }, 300);
    },
    [actions, task.id, deleteTask],
  );

  // Handle slider drag
  const handleSliderChange = useCallback(
    (value: number[]) => {
      setLocalProgress(value[0]);
      if (!isInteracting) {
        setIsInteracting(true);
        animate(scale, 1.2, { type: "spring", stiffness: 400 });
      }
    },
    [isInteracting, scale],
  );

  // Handle slider release - save to backend
  const handleSliderRelease = useCallback(
    (value: number[]) => {
      saveProgress(value[0]);
      setIsInteracting(false);
      animate(scale, 1, { type: "spring", stiffness: 400 });
    },
    [saveProgress, scale],
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
    }, 500);
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

  return (
    <Dialog modal={false}>
      <div className="flex w-full select-none items-center gap-3 py-2">
        <motion.div
          className="flex flex-1 items-center gap-3"
          style={{
            opacity: 1 - localProgress / 150,
          }}
        >
          {isEditing ? (
            <div className="flex flex-1 items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSave();
                  if (e.key === "Escape") handleEditCancel();
                }}
                className="flex-1 rounded bg-gray-700 p-1 text-sm text-white"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleEditSave}
                className="h-6 w-6 bg-green-600 p-0 text-xs text-white"
              >
                ✓
              </Button>
              <Button
                size="sm"
                onClick={handleEditCancel}
                className="h-6 w-6 bg-red-600 p-0 text-xs text-white"
              >
                ✕
              </Button>
            </div>
          ) : (
            <>
              <DialogTrigger asChild>
                <p
                  className="max-w-[21ch] cursor-pointer break-words text-left text-lg hover:text-blue-400 md:rounded md:px-1 md:hover:bg-gray-700 md:hover:bg-opacity-50"
                  onDoubleClick={() => setIsEditing(true)}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  title="Double-click to edit (desktop) or long-press (mobile)"
                >
                  {task.title}
                </p>
              </DialogTrigger>
              <motion.div style={{ scale }} className="flex-1">
                <Slider
                  value={[localProgress]}
                  onValueChange={handleSliderChange}
                  onValueCommit={handleSliderRelease}
                  max={100}
                  step={1}
                  className="flex-1"
                />
              </motion.div>
            </>
          )}
        </motion.div>
      </div>

      <DialogPortal>
        <DialogContent className="bg-black">
          <DialogHeader className="text-left">{task.title}</DialogHeader>
          <div
            data-task={task.id}
            className="flex flex-col items-stretch gap-4"
          >
            <h4 className="text-md text-left">Move to: </h4>
            <Textarea
              className="border-0 bg-gray-800 text-white"
              defaultValue={task.description}
              onBlur={(e) => updateTaskDescription(e.currentTarget.value)}
              rows={10}
              placeholder="Longer text"
            />
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

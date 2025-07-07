import { HTMLMotionProps, motion } from "framer-motion";
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

import { useActions } from "./tinybase-hooks";

type Props = HTMLMotionProps<"div"> & {
  task: any;
};

export const Task = (props: Props) => {
  const { task } = props;
  const actions = useActions();

  const [localProgress, setLocalProgress] = useState(task.progress);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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
  const handleSliderChange = useCallback((value: number[]) => {
    setLocalProgress(value[0]);
  }, []);

  // Handle slider release - save to backend
  const handleSliderRelease = useCallback(
    (value: number[]) => {
      saveProgress(value[0]);
    },
    [saveProgress],
  );

  // Sync local state when task progress changes from outside
  useEffect(() => {
    setLocalProgress(task.progress);
  }, [task.progress]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Dialog modal={false}>
      <div className="flex w-full select-none items-center gap-3 py-2">
        <motion.div
          className="flex flex-1 items-center gap-3"
          style={{
            opacity: 1 - localProgress / 150,
          }}
        >
          <Slider
            value={[localProgress]}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderRelease}
            max={100}
            step={1}
            className="flex-1"
          />
          <DialogTrigger asChild>
            <p className="max-w-[21ch] cursor-pointer break-words text-left text-lg hover:text-blue-400">
              {task.title}
            </p>
          </DialogTrigger>
        </motion.div>
      </div>

      <DialogPortal>
        <DialogContent className="bg-black">
          <DialogHeader>{task.title}</DialogHeader>
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

import {
  AnimationPlaybackControls,
  HTMLMotionProps,
  animate,
  motion,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPortal,
  DialogTrigger,
} from "./components/ui/dialog";
import { Progress } from "./components/ui/progress";
import { Textarea } from "./components/ui/textarea";

import { useLongPress } from "@uidotdev/usehooks";
import { useActions } from "./tinybase-hooks";

type Props = HTMLMotionProps<"div"> & {
  task: any;
};

const MotionProgress = motion(Progress);

export const Task = (props: Props) => {
  const { task } = props;

  const ref = useRef<any>(null);
  let timeoutRef = useRef<AnimationPlaybackControls | undefined>(undefined);
  const actions = useActions();

  const [localProgress, setLocalProgress] = useState(task.progress);
  const commitTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const deleteTask = useCallback(() => {
    actions.deleteTask(task.id);
  }, [task, actions]);

  const updateTaskDescription = (text: string) => {
    actions.updateTask(task.id, { description: text });
  };

  // Throttled commit to tinybase
  const commitProgress = useCallback(
    (progress: number) => {
      if (commitTimeoutRef.current) {
        clearTimeout(commitTimeoutRef.current);
      }

      commitTimeoutRef.current = setTimeout(() => {
        if (progress >= 100) {
          deleteTask();
        } else {
          actions.updateTask(task.id, { progress });
        }
      }, 350);
    },
    [actions, task.id, deleteTask],
  );

  // Update local state and schedule commit
  const updateProgress = useCallback(
    (newProgress: number) => {
      setLocalProgress(newProgress);
      commitProgress(newProgress);
    },
    [commitProgress],
  );

  // Sync local state when task progress changes from outside
  useEffect(() => {
    if (Math.abs(task.progress - localProgress) > 1) {
      setLocalProgress(task.progress);
    }
  }, [task.progress, localProgress]);

  useEffect(() => {
    return () => {
      timeoutRef.current?.stop();
      if (commitTimeoutRef.current) {
        clearTimeout(commitTimeoutRef.current);
      }
    };
  }, []);

  const longPressProps = useLongPress(
    () => {
      const setTimer = (to: number) => {
        timeoutRef.current?.stop();

        timeoutRef.current = animate(localProgress, to, {
          duration: 0.08,

          onUpdate: (now) => {
            setLocalProgress(now);
            commitProgress(now);
          },

          onComplete: () => {
            if (to >= 100) {
              deleteTask();
            } else {
              const left = (100 - to) * 0.0228;
              setTimer(to + 5 - left);
            }
          },

          type: "spring",
        });
      };

      setTimer(localProgress + 10);
    },
    {
      threshold: 10,
      onFinish: () => {
        timeoutRef.current?.stop();
      },
      onCancel: () => {
        timeoutRef.current?.stop();
      },
    },
  );

  return (
    <Dialog modal={false}>
      <div>
        <div
          className="flex w-full select-none items-center gap-2 py-1"
          ref={ref}
        >
          <motion.div
            className="flex w-full items-baseline gap-2 "
            style={{
              opacity: 1 - localProgress / 150,
            }}
          >
            <DialogTrigger>
              <div className="flex items-baseline gap-2">
                <MotionProgress
                  className="box-border h-3 w-[6ch] rounded-br-sm rounded-tl-sm border border-gray-700 p-0 text-center text-xs"
                  value={localProgress}
                />
                <p className="max-w-[21ch] break-words text-left text-lg">
                  {task.title}
                </p>
              </div>
            </DialogTrigger>
          </motion.div>
          <span
            className="font-bold group peer relative h-7 w-12 rounded-xl px-1 text-white lg:w-12 "
            {...longPressProps}
            onClick={() => updateProgress(Math.min(100, localProgress + 10))}
          >
            <button
              // {...sharedPressableProps}

              className="ease absolute inset-0 h-full w-full -translate-x-[0px] translate-y-[4px] transform rounded-full border bg-orange-900 opacity-80 mix-blend-screen transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0"
            />
            <button
              // {...sharedPressableProps}

              className="ease absolute inset-0 h-full w-full -translate-y-[3px] translate-x-[3px] transform rounded-xl border bg-indigo-900 opacity-80 transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0"
            />
          </span>
        </div>

        <div />
      </div>
      <DialogPortal>
        <DialogContent className="bg-black">
          <DialogHeader>{task.title}</DialogHeader>
          <div
            data-task={task.id}
            className="flex flex-col items-stretch gap-4"
          >
            <h4 className="text-md  text-left">Move to: </h4>
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

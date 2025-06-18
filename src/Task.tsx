import {
  AnimationPlaybackControls,
  HTMLMotionProps,
  animate,
  motion,
} from "framer-motion";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPortal,
  DialogTrigger,
} from "./components/ui/dialog";
import { Progress } from "./components/ui/progress";
import { Textarea } from "./components/ui/textarea";

import { useDebounce, useLongPress } from "@uidotdev/usehooks";
import { TodoItem } from "./store";
import { useGoatActions } from "./goat-store";
import { useItem, useDB } from "@goatdb/goatdb/react";

type Props = HTMLMotionProps<"div"> & {
  task: TodoItem;
};

const MotionProgress = motion(Progress);

export const Task = (props: Props) => {
  const { task } = props;

  const ref = useRef<any>();
  let timeoutRef = useRef<AnimationPlaybackControls>();
  const actions = useGoatActions();

  // Use useItem to get the task item for direct updates
  const db = useDB();
  const userRepoPath = db.currentUser
    ? `/data/${db.currentUser.key}`
    : "/data/anonymous";
  const taskItem = useItem(`${userRepoPath}/${task.id}`);

  const [progress, setProgress] = useState(task.progress);

  const deferredProgress = useDebounce(progress, 350);

  const deleteTask = useCallback(() => {
    if (taskItem) {
      // Move to cemetery first
      actions.deleteTodo(task);
      // Then mark as deleted
      taskItem.isDeleted = true;
    }
  }, [task, actions, taskItem]);

  const updateTaskDescription = (text: string) => {
    if (taskItem) {
      taskItem.set("description", text);
    }
  };

  useEffect(() => {
    if (progress > 100) {
      deleteTask();
    }

    if (taskItem) {
      taskItem.set("progress", progress);
    }
  }, [deferredProgress, taskItem, deleteTask]);

  useEffect(() => {
    return () => {
      timeoutRef.current?.stop();
    };
  }, []);

  const longPressProps = useLongPress(
    () => {
      const setTimer = (to: number) => {
        timeoutRef.current?.stop();

        timeoutRef.current = animate(progress, to, {
          duration: 0.08,

          // onUpdate: now => console.log(`from ${progress} to ${to} and now is ${now}`),
          onComplete: () => {
            if (to >= 100) {
              deleteTask();
            } else {
              setProgress(to);

              const left = (100 - to) * 0.0228;

              setTimer(to + 5 - left);
            }
          },

          type: "spring",
        });
      };

      setTimer(progress + 10);
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
              opacity: 1 - progress / 150,
            }}
          >
            <DialogTrigger>
              <div className="flex items-baseline gap-2">
                <MotionProgress
                  className="box-border h-3 w-[6ch] rounded-br-sm rounded-tl-sm border border-gray-700 p-0 text-center text-xs"
                  value={progress}
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
            onCanPlay={() => setProgress((it) => it + 10)}
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

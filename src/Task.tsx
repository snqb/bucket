import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce, useLongPress } from "@uidotdev/usehooks";
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
import { pb } from "./App";
import { Dialog, DialogTrigger } from "./components/ui/dialog";
import { Progress } from "./components/ui/progress";
import { Todo, TodoState } from "./store";
import * as R from "ramda";

type Props = HTMLMotionProps<"div"> & {
  task: Todo;
  where: keyof TodoState;
};

const MotionProgress = motion(Progress);

export const Task = (props: Props) => {
  const { task, where } = props;
  const ref = useRef<any>();
  const client = useQueryClient();

  let timeoutRef = useRef<AnimationPlaybackControls>();

  const [progress, setProgress] = useState(task.progress);
  const debouncedProgress = useDebounce(progress, 1000);


  const updateProgress = useMutation({
    mutationKey: ["updateProgress", debouncedProgress],
    mutationFn: async () => {
      return pb.collection("tasks").update(task.id, {
        progress,
      });
    },
  });

  useEffect(() => {
    updateProgress.mutate();
    console.log(debouncedProgress)
    if (progress > 100) {
      remove.mutate();
    }
  }, [debouncedProgress]);

  const remove = useMutation({
    mutationFn: async () => {
      return pb.collection("tasks").delete(task.id);
    },
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: ["task", where],
      });
    },
  });

  const longPressProps = useLongPress(
    () => {
      return {
        onFinish: () => {
          console.log("finish at", progress);
        },
      };
    },
    {
      onStart: () => {
        const next = 100;
        timeoutRef.current = animate(progress, next, {
          duration: -(progress - 100) / 10,
          onUpdate: (it) => {
            return setProgress(Math.round(it));
          },
          onComplete: () => {
            remove.mutate();
          },
          damping: 66,
          bounce: 10,
          bounceDamping: 100,
        });
      },
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
            <DialogTrigger asChild>
              <MotionProgress
                className="box-border h-3 w-[5ch] rounded-br-sm rounded-tl-sm border border-gray-700 p-0 text-center text-xs"
                value={progress}
              />
            </DialogTrigger>
            <p className="max-w-[21ch] break-all text-lg">{task.title}</p>
          </motion.div>
          <span
            className="font-bold group peer relative h-6 w-12 rounded-lg px-1 text-white lg:w-12"
            {...longPressProps}
          >
            <button
              // {...sharedPressableProps}
              className="ease absolute inset-0 h-full w-full -translate-x-[4px] -translate-y-[4px] transform bg-blue-900 opacity-80 transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0"
            />
            <button
              // {...sharedPressableProps}
              className="ease absolute inset-0 h-full w-full translate-x-[4px] translate-y-[4px] transform bg-pink-900 opacity-80 mix-blend-screen transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0"
            />
          </span>
        </div>

        <div />
      </div>
    </Dialog>
  );
};

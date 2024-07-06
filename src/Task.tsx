import { useLongPress } from "@uidotdev/usehooks";
import {
  AnimationPlaybackControls,
  HTMLMotionProps,
  animate,
  motion,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPortal,
  DialogTrigger,
} from "./components/ui/dialog";
import { Progress } from "./components/ui/progress";
import { Textarea } from "./components/ui/textarea";
import { getRandomEmoji } from "./emojis";
import {
  Todo,
  TodoState,
  moveTask,
  removeTask,
  updateDescription,
  updateProgress,
  useAppDispatch,
  useAppSelector,
} from "./store";

type Props = HTMLMotionProps<"div"> & {
  task: Todo;
  where: keyof TodoState;
};

const MotionProgress = motion(Progress);

export const Task = (props: Props) => {
  const { task, where } = props;
  const ref = useRef<any>();
  let timeoutRef = useRef<AnimationPlaybackControls>();

  const [progress, setProgress] = useState(task.progress);
  const deleteTask = useCallback(() => {
    // dispatch(
    //   removeTask({
    //     key: where,
    //     id: task.id,
    //   }),
    // );
  }, [updateProgress, progress]);

  const updateTaskDescription = (text: string) => {
    // dispatch(
    //   updateDescription({
    //     key: where,
    //     id: task.id,
    //     text,
    //   }),
    // );
  };

  useEffect(() => {
    if (progress > 100) {
      deleteTask();
    }
  }, [progress]);

  const longPressProps = useLongPress(
    () => {
      {
        const next = progress + 7;
        animate(progress, next, {
          duration: 0,
          onUpdate: (it) => setProgress(Math.round(it)),
        });
        // dispatch(
        //   updateProgress({
        //     key: where,
        //     id: task.id,
        //     progress: next,
        //   }),
        // );
      }
    },
    {
      onStart: () => {
        const next = 100;
        timeoutRef.current = animate(progress, next, {
          duration: 2.8,
          onUpdate: (it) => setProgress(Math.round(it)),
          onComplete: () => {
            deleteTask();
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
      {/* <DialogPortal>
        <DialogContent className="bg-black">
          <DialogHeader>{task.title}</DialogHeader>
          <div
            data-task={task.id}
            className="flex flex-col items-stretch gap-4"
          >
            <h4 className="text-md  text-left">Move to: </h4>
            <div className="grid grid-flow-row gap-1">
              {structure.map((row, index) => (
                <div key={"ss" + index} className="flex flex-row gap-2">
                  {row.map((screen, index) => (
                    <Button
                      tabIndex={-1}
                      key={screen + index}
                      variant="ghost"
                      className="border border-gray-800 px-2 text-white"
                      onClick={() => {
                        dispatch(
                          moveTask({
                            from: where,
                            to: screen,
                            id: task.id,
                          }),
                        );
                      }}
                    >
                      {getRandomEmoji(screen)}
                      {screen}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
            <Textarea
              className="border-0 bg-gray-800 text-white"
              defaultValue={task.description}
              onBlur={(e) => updateTaskDescription(e.currentTarget.value)}
              rows={10}
              placeholder="Longer text"
            />
          </div>
        </DialogContent>
      </DialogPortal> */}
    </Dialog>
  );
};

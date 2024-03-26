import { HTMLMotionProps, animate, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { level$ } from "./App";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
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

export const Task = (props: Props) => {
  const { task, where } = props;
  const dispatch = useAppDispatch();
  const hueref = useRef<number>();
  const { structure } = useAppSelector((state) => state.todo);

  const [progress, setProgress] = useState(task.progress);

  const deleteTask = useCallback(() => {
    dispatch(
      removeTask({
        key: where,
        id: task.id,
      }),
    );
  }, [dispatch, updateProgress, hueref.current, progress]);

  const updateTaskDescription = (text: string) => {
    dispatch(
      updateDescription({
        key: where,
        id: task.id,
        text,
      }),
    );
  };

  useEffect(() => {
    if (progress > 100) {
      deleteTask();
    }
  }, [progress]);

  const isZoomedOut = level$.get() === 1;

  return (
    <Dialog>
      <div className="flex w-full select-none items-baseline py-1">
        <motion.div
          className="flex w-full items-baseline gap-2 "
          style={{
            opacity: 1 - progress / 150,
          }}
        >
          <div className="max-h-6 min-w-[4ch] border border-gray-400 p-1 text-center text-xs">
            {progress}%
          </div>
          <DialogTrigger>
            <p className="text-xl">{task.title.text}</p>
          </DialogTrigger>
        </motion.div>
        {!isZoomedOut && (
          <div className="flex min-w-[100px] items-baseline gap-4">
            <RemoveButton
              onClick={() => {
                animate(progress, 100, {
                  duration: 1,
                  onComplete: deleteTask,
                  onUpdate: (it) => setProgress(Math.round(it)),
                });
              }}
            />
            <button
              onClick={(e) => {
                e.preventDefault();
                const next = progress + 1;
                dispatch(
                  updateProgress({
                    key: where,
                    id: task.id,
                    progress: next,
                  }),
                );
                setProgress(next);
              }}
              className="w-15 group relative h-7 rounded-lg px-1 font-bold text-white"
            >
              <span className="ease absolute inset-0 h-full w-full -translate-x-[4px] -translate-y-[4px] transform bg-purple-800 opacity-80 transition duration-300 group-active:translate-x-0 group-active:translate-y-0"></span>
              <span className="ease absolute inset-0 h-full w-full translate-x-[4px] translate-y-[4px] transform bg-pink-800 opacity-80 mix-blend-screen transition duration-300 group-active:translate-x-0 group-active:translate-y-0"></span>
              <span className="relative">✨✨</span>
            </button>
          </div>
        )}
      </div>
      <DialogContent className="h-full w-full bg-gray-800">
        <DialogHeader>
          <DialogTitle className="mb-4 text-xl">{task.title.text}</DialogTitle>

          <h4 className="text-md text-left">Content:</h4>
          <Textarea
            className="bg-gray-800 text-white"
            defaultValue={task.description}
            onBlur={(e) => updateTaskDescription(e.currentTarget.value)}
            rows={10}
            placeholder="Longer text"
          />

          <h4 className="text-md mt-4 text-left">Move to:</h4>
          <div className="flex flex-col gap-1">
            {structure.map((row, index) => (
              <div key={index} className="flex flex-row gap-1">
                {row.map((screen, index) => (
                  <DialogClose asChild>
                    <Button
                      key={"ss" + index}
                      variant="outline"
                      className="bg-black px-1 text-white"
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
                  </DialogClose>
                ))}
              </div>
            ))}
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

const RemoveButton = ({ onClick }: { onClick: () => void }) => {
  const [pressedCount, setPressedCount] = useState(0);

  if (pressedCount > 1) return null;

  const handleClick = () => {
    if (pressedCount === 1) {
      onClick();
    }
    setPressedCount(1);
  };

  return (
    <button
      className={`text-m ${
        pressedCount === 1 ? "saturate-100" : "saturate-0"
      } scale-${pressedCount ? "110" : "100"} border-gray-900`}
      onClick={handleClick}
    >
      ❌
    </button>
  );
};

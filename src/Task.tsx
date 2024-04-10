import {
  HTMLMotionProps,
  animate,
  motion,
  useAnimate,
  useAnimationFrame,
  useInView,
  useMotionValue,
} from "framer-motion";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { NoPanArea, Pressable, SpaceContext } from "react-zoomable-ui";
import { Button } from "./components/ui/button";
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
  const aProgress = useMotionValue(task.progress);
  const dispatch = useAppDispatch();
  const { structure } = useAppSelector((state) => state.todo);
  const [show, setShow] = useState(false);
  const ref = useRef<any>();

  const [progress, setProgress] = useState(task.progress);
  const { viewPort } = useContext(SpaceContext);
  const isInView = useInView(ref, {
    amount: "all",
  });

  const deleteTask = useCallback(() => {
    dispatch(
      removeTask({
        key: where,
        id: task.id,
      }),
    );
  }, [dispatch, updateProgress, progress]);

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

  const centerCamera = useCallback(() => {
    const element = document.querySelector(`#screen-${where}`) as HTMLElement;

    console.log(element, isInView);

    if (viewPort && !isInView) {
      viewPort.camera.centerFitElementIntoView(element, undefined, {
        durationMilliseconds: 400,
      });
    }
  }, [viewPort, isInView]);

  return (
    <NoPanArea>
      <div
        className="flex w-full select-none items-baseline gap-2 py-1"
        ref={ref}
      >
        <motion.div
          className="flex w-full items-baseline gap-2 "
          style={{
            opacity: 1 - progress / 150,
          }}
        >
          <RemoveButton
            onClick={() => {
              animate(progress, 100, {
                duration: 1,
                onComplete: deleteTask,
                onUpdate: (it) => setProgress(Math.round(it)),
              });
            }}
          >
            <motion.div
              style={{ content: aProgress }}
              className="box-border min-h-5 min-w-[4ch] border border-gray-400 p-1 text-center text-xs"
            >
              {progress > 0 && `${progress}%`}
            </motion.div>
          </RemoveButton>
          <Pressable
            onTap={() => {
              setShow((prev) => !prev);
            }}
          >
            <p className="max-w-[21ch] break-all text-xl">{task.title.text}</p>
          </Pressable>
        </motion.div>
        <div className="flex w-fit items-baseline gap-4">
          <Pressable
            onLongTap={() => {
              console.log(progress);
              animate(progress, progress + 10, {
                duration: 0.5,
                onUpdate: (it) => setProgress(Math.round(it)),
              });
            }}
            longTapThresholdMs={300}
            onTap={() => {
              const next = progress + 1;
              dispatch(
                updateProgress({
                  key: where,
                  id: task.id,
                  progress: next,
                }),
              );
              setProgress(next);
              centerCamera();
            }}
            className="w-15 font-bold group relative h-7 rounded-lg px-1 text-white"
          >
            <span className="ease absolute inset-0 h-full w-full -translate-x-[4px] -translate-y-[4px] transform bg-purple-800 opacity-80 transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0"></span>
            <span className="ease absolute inset-0 h-full w-full translate-x-[4px] translate-y-[4px] transform bg-pink-800 opacity-80 mix-blend-screen transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0"></span>
            <span className="relative">✨✨</span>
          </Pressable>
        </div>
      </div>

      <div
        data-task={task.id}
        className={`${show ? "flex" : "hidden"} flex-col items-stretch`}
      >
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
            <div key={"ss" + index} className="flex flex-row gap-1">
              {row.map((screen, index) => (
                <Button
                  key={screen + index}
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
              ))}
            </div>
          ))}
        </div>
      </div>
      <div />
    </NoPanArea>
  );
};

const RemoveButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => {
  const [pressedCount, setPressedCount] = useState(0);

  if (pressedCount > 1) return null;

  const handleClick = () => {
    if (pressedCount === 1) {
      onClick();
    }
    setPressedCount(1);
    setTimeout(() => {
      setPressedCount(0);
    }, 3000);
  };

  return (
    <button
      className={`text-m ${
        pressedCount === 1 ? "bg-100" : "bg-0"
      } scale-${pressedCount ? "110" : "100"} border-gray-900`}
      onClick={handleClick}
    >
      {pressedCount === 1 ? "❌" : children}
    </button>
  );
};

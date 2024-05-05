import {
  HTMLMotionProps,
  animate,
  motion,
  useInView,
  useMotionValue,
} from "framer-motion";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, PressableProps, SpaceContext } from "react-zoomable-ui";
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
import { Progress } from "./components/ui/progress";

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

  const MotionProgress = motion(Progress);

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

    if (viewPort && !isInView) {
      viewPort.camera.centerFitElementIntoView(element, undefined, {
        durationMilliseconds: 400,
      });
    }
  }, [viewPort, isInView]);

  const sharedPressableProps = useMemo<PressableProps>(() => ({}), []);

  return (
    <div className={`${show ? "border border-gray-200 p-2 py-2" : ""}`}>
      <div
        className="flex w-full select-none items-baseline gap-2 py-1"
        ref={ref}
      >
        <motion.div
          className="flex w-full items-center gap-2 "
          style={{
            opacity: 1 - progress / 150,
          }}
        >
          <MotionProgress
            className="box-border min-h-4 w-[5ch] border border-gray-700 p-0 text-center text-xs"
            value={progress}
          />
          <Pressable
            onTap={() => {
              setShow((prev) => !prev);
            }}
          >
            <p className="max-w-[21ch] break-all text-xl">{task.title.text}</p>
          </Pressable>
        </motion.div>
        <Pressable
          onLongTap={() => {
            animate(progress, progress + 50, {
              duration: 0.6,
              onUpdate: (it) => setProgress(Math.round(it)),
            });
          }}
          longTapThresholdMs={420}
          onTap={() => {
            const next = progress + 10;
            animate(progress, next, {
              duration: 0.2,
              onUpdate: (it) => setProgress(Math.round(it)),
            });
            dispatch(
              updateProgress({
                key: where,
                id: task.id,
                progress: next,
              }),
            );
            centerCamera();
          }}
          className="font-bold group peer relative h-6 w-12 rounded-lg px-1 text-white lg:w-12"
        >
          <span className="ease absolute inset-0 h-full w-full -translate-x-[4px] -translate-y-[4px] transform bg-blue-900 opacity-80 transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0"></span>
          <span className="ease absolute inset-0 h-full w-full translate-x-[4px] translate-y-[4px] transform bg-pink-900 opacity-80 mix-blend-screen transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0"></span>
          <span className="relative">✨✨</span>
        </Pressable>
      </div>

      <div
        data-task={task.id}
        className={`${show ? "flex" : "hidden"} flex-col items-stretch gap-2`}
      >
        <div className="flex items-baseline gap-1">
          <h4 className="text-md my-4 text-left">Move to: </h4>
          {structure.map((row, index) => (
            <div key={"ss" + index} className="flex flex-row gap-1">
              {row.map((screen, index) => (
                <Button
                  key={screen + index}
                  variant="link"
                  className=" px-1 text-white"
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
      <div />
    </div>
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

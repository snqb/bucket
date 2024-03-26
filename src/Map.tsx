import { motion } from "framer-motion";
import { PropsWithChildren } from "react";
import { $currentScreen } from "./App";
import { getRandomEmoji } from "./emojis";
import { useAppSelector } from "./store";

export const Map = () => {
  const { structure } = useAppSelector((state) => state.todo);

  return (
    <motion.div
      className="text-md flex w-min flex-col border-red-400"
      animate={{
        transform: "rotate(3.14deg)",
      }}
      exit={{
        transform: "rotate(0deg)",
      }}
      transition={{ repeat: Infinity, duration: 6.66, repeatType: "reverse" }}
    >
      {structure.map((row, rowIndex) => {
        return (
          <div className="flex gap-0" key={rowIndex}>
            {row.map((name, colIndex) => {
              const isActiveCell = $currentScreen.get() === name;

              return (
                <div key={`${rowIndex}-${colIndex}`}>
                  <GridTitle isActive={isActiveCell}>
                    {getRandomEmoji(name)}
                  </GridTitle>
                </div>
              );
            })}
          </div>
        );
      })}
    </motion.div>
  );
};

const GridTitle = ({
  isActive,
  children,
}: PropsWithChildren<{ isActive: boolean }>) => {
  if (isActive) {
    return (
      <div className="border border-r-2 border-gray-400 px-2 shadow-inner">
        <h3 className="text-md whitespace-nowrap capitalize text-white">
          {children}
        </h3>
      </div>
    );
  }
  return (
    <div className="border border-r-2 border-gray-500 px-1 text-gray-400 opacity-50">
      <h3 className="whitespace-nowrap text-sm capitalize">{children}</h3>
    </div>
  );
};

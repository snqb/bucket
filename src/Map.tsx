import { motion } from "framer-motion";
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
      {structure.map((row, rowIndex) => (
        <div className="flex gap-0" key={rowIndex}>
          {row.map((name, colIndex) => {
            return (
              <div key={`${rowIndex}-${colIndex}`}>
                <div className="border border-r-2 border-gray-500 px-1 text-gray-400 opacity-50">
                  <h3 className="whitespace-nowrap text-sm capitalize">
                    {getRandomEmoji(name)}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
};

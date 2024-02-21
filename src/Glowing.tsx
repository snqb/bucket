import { PropsWithChildren, useRef, useState } from "react";
import { motion } from "framer-motion";

const Glowing = ({ children }: PropsWithChildren) => {
  const [isShining, setIsShining] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleClick = () => {
    setIsShining(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setIsShining(false), 300); // Reset shining after 1 second
  };

  return (
    <motion.div
      initial={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={{
        opacity: isShining ? 1 : 0.5,
        filter: isShining ? "brightness(160%)" : "brightness(100%)",
      }}
      transition={{ duration: 0.3 }}
      onMouseUp={handleClick}
      style={{ cursor: "pointer" }}
    >
      {children}
      {isShining && (
        <motion.span
          role="img"
          aria-label="Sparkles"
          animate={{}}
          style={{
            fontSize: "3em",
            position: "absolute",
            top: "50%",
            left: "10%",
            transform: "translate(-50%, -50%)",
          }}
        >
          ✨
        </motion.span>
      )}
    </motion.div>
  );
};

export default Glowing;

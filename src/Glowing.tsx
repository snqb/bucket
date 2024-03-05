import { PropsWithChildren, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const Glowing = ({ children }: PropsWithChildren) => {
  const [isShining, setIsShining] = useState(false);
  const shining = useSpring(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleClick = () => {
    setIsShining(true);
    shining.set(shining.get() * 1.08);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      shining.set(Math.max(shining.get() / 1.08, 0));
      setIsShining(false);
    }, 420); // Reset shining after 1 second
  };

  return (
    <motion.div
      whileTap={{
        scale: shining.get() < 0.5 ? shining.get() + 0.5 : shining.get(),
      }}
      animate={{
        opacity: isShining ? 1 : 0.5,
        filter: isShining ? "brightness(160%)" : "brightness(100%)",
      }}
      transition={{ duration: 0.67 }}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      {children}
      {isShining && (
        <motion.span
          role="img"
          aria-label="Sparkles"
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

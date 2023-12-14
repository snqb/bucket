import { Box, Button } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { PropsWithChildren, useState } from "react";
import ReactDOM from "react-dom";

const FadingEmoji = ({ x, y, onComplete }) => {
  const animationProps = {
    initial: { scale: 3, opacity: 1 },
    animate: { scale: 1, opacity: 0 },
    transition: { duration: 1 },
    onAnimationComplete: onComplete,
  };

  // Create a portal and position the emoji at the specified (x, y) coordinates
  return ReactDOM.createPortal(
    <motion.div
      style={{
        zIndex: 10,
        position: "absolute",
        left: `${x + 10}px`,
        top: `${y}px`,
        fontSize: "40px",
      }}
      {...animationProps}
    >
      👊
    </motion.div>,
    document.body,
  );
};

const FistButton = ({ children }: PropsWithChildren) => {
  const [coords, setCoords] = useState(null);
  const handleButtonClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = rect.left + window.scrollX;
    const y = rect.top + window.scrollY;
    setCoords({ x, y });
  };

  const handleAnimationComplete = () => {
    setCoords(null);
  };

  return (
    <>
      <Button p={0} onClick={handleButtonClick}>
        {children}
      </Button>
      {coords && (
        <FadingEmoji
          x={coords.x}
          y={coords.y}
          onComplete={handleAnimationComplete}
        />
      )}
    </>
  );
};

export default FistButton;

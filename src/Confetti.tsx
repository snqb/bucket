import { Box, Button } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import ReactDOM from "react-dom";

const MotionBox = motion(Box);

const emojiArray = ["👍", "🎉", "❤️", "🌟", "🎈"];

const ConfettiEmoji = ({ onComplete }) => {
  const randomEmoji = emojiArray[Math.floor(Math.random() * emojiArray.length)];
  const fontSize = Math.random() * 24 + 16; // Random font size between 16 and 40
  const leftPosition = Math.random() * 100; // Random starting position

  const animationProps = {
    initial: { y: "100vh", scale: 0.5 },
    animate: { y: "50vh", scale: [0.5, 1.5], rotate: [0, 360] },
    exit: { opacity: 0 },
    transition: { duration: 2 },
    onAnimationComplete: onComplete,
  };

  return (
    <MotionBox
      position="absolute"
      left={`${leftPosition}vw`}
      bottom="0"
      fontSize={`${fontSize}px`}
      {...animationProps}
    >
      {randomEmoji}
    </MotionBox>
  );
};

const FadingEmoji = ({ x, y, onComplete }) => {
  const animationProps = {
    initial: { scale: 3, opacity: 1 },
    animate: { scale: 1, opacity: 0 },
    transition: { duration: 2 },
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

const EmojiSpawner = ({ children }) => {
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
      <Button p={1} variant="ghost" onClick={handleButtonClick}>
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

export default EmojiSpawner;

import { Box, Button, ButtonProps } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { PropsWithChildren, useState } from "react";
import ReactDOM from "react-dom";

const FadingEmoji = ({
  x,
  y,
  onComplete,
}: {
  x: number;
  y: number;
  onComplete: () => void;
}) => {
  const animationProps = {
    initial: { scale: 3, opacity: 1 },
    animate: { scale: 1, opacity: 0 },
    transition: { duration: 0.3 },
    onAnimationComplete: onComplete,
  };

  // Create a portal and position the emoji at the specified (x, y) coordinates
  return ReactDOM.createPortal(
    <motion.div
      style={{
        zIndex: 10,
        position: "absolute",
        left: `${x}px`,
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

const FistButton = ({ children, ...restProps }: ButtonProps) => {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const handleButtonClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = rect.left + window.scrollX;
    const y = rect.top + window.scrollY;
    setCoords({ x, y });
  };

  const handleAnimationComplete = () => {
    setCoords(null);
    restProps.onClick?.();
  };

  return (
    <>
      <Button
        {...restProps}
        p={0}
        onClick={(e) => {
          handleButtonClick(e);
        }}
      >
        {children}
      </Button>
      {coords && (
        <FadingEmoji
          x={coords.x - 30}
          y={coords.y}
          onComplete={handleAnimationComplete}
        />
      )}
    </>
  );
};

export default FistButton;

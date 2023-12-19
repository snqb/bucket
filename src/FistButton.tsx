import { Button, ButtonProps } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { PropsWithChildren, useState } from "react";
import ReactDOM from "react-dom";

const FadingEmoji = ({
  x,
  y,
  onComplete,
  children,
}: PropsWithChildren<{
  x: number;
  y: number;
  onComplete: () => void;
}>) => {
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
        left: `${x}px`,
        top: `${y}px`,
        fontSize: "40px",
      }}
      {...animationProps}
    >
      {children}
    </motion.div>,
    document.body,
  );
};

const FistButton = ({ children, ...restProps }: ButtonProps) => {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const handleButtonClick = (e: any) => {
    const rect = e.target.getBoundingClientRect();
    const x = rect.left + window.scrollX;
    const y = rect.top + window.scrollY;
    setCoords({ x, y });
  };

  const handleAnimationComplete = () => {
    setCoords(null);
    // @ts-ignore
    restProps.onClick?.();
  };

  return (
    <>
      <Button
        variant="unstyled"
        size="sm"
        borderRadius="50%"
        borderColor="gray.800"
        p={0}
        onClick={handleButtonClick}
        {...restProps}
      >
        {children}
      </Button>
      {coords && (
        <FadingEmoji
          x={coords.x - 30}
          y={coords.y}
          onComplete={handleAnimationComplete}
        >
          {children}
        </FadingEmoji>
      )}
    </>
  );
};

export default FistButton;

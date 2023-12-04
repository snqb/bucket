import React, { useState } from "react";
import { Button, ButtonProps } from "@chakra-ui/react";
import { motion } from "framer-motion";

const BlowEffectButton = (props: ButtonProps) => {
  const [isClicked, setIsClicked] = useState(false);

  const randomX = () => {
    // Random value between -45 and 45
    return (Math.random() - 0.5) * 90;
  };

  const randomY = () => {
    // Random value between -36 and 36
    return (Math.random() - 0.5) * 72;
  };

  // Define variant for each fragment
  const fragmentVariants = {
    initial: { scale: 1, x: 0, y: 0, opacity: 1 },
    shatter: {
      scale: [1, 1.5], // Example scale transformation
      x: [0, randomX()], // Random X position
      y: [0, randomY()], // Random Y position
      opacity: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate={isClicked ? "shatter" : "initial"}
      variants={fragmentVariants}
      onAnimationComplete={() => setIsClicked(false)}
    >
      <Button {...props} />
    </motion.div>
  );
};

export default BlowEffectButton;

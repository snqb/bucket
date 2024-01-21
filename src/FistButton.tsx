import { Box, Button, ButtonProps, Progress } from "@chakra-ui/react";
import 'dough-js'


// https://www.joshwcomeau.com/animation/3d-button/ copy paste basically

interface Props extends ButtonProps {
  progress: number;
}

export const FistButton = ({ children, progress, ...props }: Props) => {

  return (
    <Button
      sx={{
        position: "relative",
        transform: "rotateY(20deg)",
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
        outlineOffset: "4px",
        transition: "filter 250ms",
        _hover: { filter: "brightness(110%)" },
        _focus: { outline: "none" },
      }}
      {...props}
    >
      {/* shadow */}
      <Box
        as="span"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius: "6px",
          background: "hsl(0deg 22% 22% / 0.25)",
          willChange: "transform",
          transform: "translateX(5px)",
          transition: "transform 600ms cubic-bezier(.3, .7, .4, 1)",
          _hover: { transform: "translate3d(14px 140px 14px)", },
          _active: { transform: "translate3d(14px 140px 14px)" },
        }}
      />
      {/* back */}
      <Box
        as="span"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius: "6px",
          background:
            "linear-gradient(to left, hsl(270deg 12% 24%) 0%, hsl(270deg 12% 24%) 8%, hsl(270deg 12% 24%) 92%, hsl(270deg 12% 24%) 100%)",
        }}
      />
      {/* front */}
      <Progress
        as="span"
        value={progress}
        // bg="red.100"
        colorScheme="pink"
        sx={{
          // display: "flex",
          h: "100%",
          w: "100%",
          // justifyContent: "center",
          position: "relative",
          borderRadius: "6px",
          fontSize: "1.25rem",
          color: "white",
          background: "hsl(120deg 0% 53%)",
          willChange: "transform",
          transform: "translateX(2px)",
          transition: "transform font-size 600ms cubic-bezier(.3, .7, .4, 1)",
          _hover: { transform: "translateX(3px)", fontSize: "1.1rem" },
          _active: { transform: "translateX(1px)" },
        }}
      >

      </Progress>
    </Button>
  );
};

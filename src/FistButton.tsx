import { Box, Button, ButtonProps } from "@chakra-ui/react";

// https://www.joshwcomeau.com/animation/3d-button/ copy paste basically

export const FistButton = ({ children, ...props }: ButtonProps) => {
  return (
    <Button
      sx={{
        position: "relative",
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
          borderRadius: "12px",
          background: "hsl(0deg 0% 0% / 0.25)",
          willChange: "transform",
          transform: "translateY(2px)",
          transition: "transform 600ms cubic-bezier(.3, .7, .4, 1)",
          _hover: { transform: "translateY(4px)" },
          _active: { transform: "translateY(1px)" },
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
          borderRadius: "12px",
          background:
            "linear-gradient(to left, hsl(340deg 88% 16%) 0%, hsl(340deg 88% 32%) 8%, hsl(340deg 88% 32%) 92%, hsl(340deg 88% 16%) 100%)",
        }}
      />
      {/* front */}
      <Box
        as="span"
        sx={{
          display: "flex",
          justifyContent: "center",
          position: "relative",
          padding: "2px 6px",
          borderRadius: "12px",
          fontSize: "1.25rem",
          color: "white",
          background: "hsl(345deg 88% 53%)",
          willChange: "transform",
          transform: "translateY(-4px)",
          transition: "transform font-size 600ms cubic-bezier(.3, .7, .4, 1)",
          _hover: { transform: "translateY(-6px)", fontSize: "1.5rem" },
          _active: { transform: "translateY(-2px)" },
        }}
      >
        {children}
      </Box>
    </Button>
  );
};

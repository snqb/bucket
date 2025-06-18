import React, { ReactNode, useEffect } from "react";
import { registerSchemas } from "./goat-schemas";

interface GoatProviderProps {
  children: ReactNode;
}

export function GoatProvider({ children }: GoatProviderProps) {
  useEffect(() => {
    // Register GoatDB schemas on app startup
    registerSchemas();
  }, []);

  return <>{children}</>;
}

import { Provider } from "tinybase/ui-react";
import { store } from "./tinybase-store";

interface TinyBaseProviderProps {
  children: React.ReactNode;
}

export const TinyBaseProvider = ({ children }: TinyBaseProviderProps) => {
  return <Provider store={store}>{children}</Provider>;
};

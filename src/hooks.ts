import { useEffect, useState, useCallback } from "preact/hooks";
import { subscribe } from "./store";

/** Re-render when Yjs data changes */
export function useStore<T>(selector: () => T): T {
  const [value, setValue] = useState(selector);
  useEffect(() => {
    const update = () => setValue(selector());
    update();
    return subscribe(update);
  }, []);
  return value;
}

/** Simple toggle state */
export function useToggle(initial = false): [boolean, () => void] {
  const [v, setV] = useState(initial);
  return [v, useCallback(() => setV((p) => !p), [])];
}

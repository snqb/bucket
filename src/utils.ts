import { useState, useEffect } from "react";

// thanks chatgpt
export function useLocalStorageValue<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? JSON.parse(storedValue) : initialValue;
  });

  useEffect(() => {
    setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }, [key, value]);

  return [value, setValue];
}


import React, { useState, useEffect } from 'react';

// FIX: The original code was missing the default import of 'React', which is necessary to use the 'React' namespace for types like React.Dispatch.
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const prefixedKey = `crewledger_${key}`;

  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(prefixedKey);
      // If the item exists, parse it. Otherwise, return the initial value.
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If parsing fails, log the error and return the initial value.
      console.error(`Error reading localStorage key “${prefixedKey}”:`, error);
      return initialValue;
    }
  });

  // Use useEffect to update localStorage whenever the state or storage key changes.
  useEffect(() => {
    try {
        window.localStorage.setItem(prefixedKey, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting localStorage key “${prefixedKey}”:`, error);
    }
  }, [prefixedKey, value]);

  return [value, setValue];
}

export default useLocalStorage;
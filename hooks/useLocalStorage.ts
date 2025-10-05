
import React, { useState, useEffect } from 'react';

// FIX: The original code was missing the default import of 'React', which is necessary to use the 'React' namespace for types like React.Dispatch.
function useLocalStorage<T,>(key: string, initialValue: T, userId: string | null): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = userId ? `${key}_${userId}` : null;

  const [value, setValue] = useState<T>(() => {
    if (!storageKey) {
        return initialValue;
    }
    try {
      const item = window.localStorage.getItem(storageKey);
      // If the item exists, parse it. Otherwise, return the initial value.
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If parsing fails, log the error and return the initial value.
      console.error(`Error reading localStorage key “${storageKey}”:`, error);
      return initialValue;
    }
  });

  // Effect to update the state when the user ID changes (e.g., login/logout)
  useEffect(() => {
    if (!storageKey) {
        // If user logs out, reset to initial state
        setValue(initialValue);
        return;
    }
    try {
        const item = window.localStorage.getItem(storageKey);
        setValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
        console.error(`Error reading localStorage key “${storageKey}”:`, error);
        setValue(initialValue);
    }
  }, [storageKey]);


  // Use useEffect to update localStorage whenever the state or storage key changes.
  useEffect(() => {
    if (storageKey) {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting localStorage key “${storageKey}”:`, error);
        }
    }
  }, [storageKey, value]);

  return [value, setValue];
}

export default useLocalStorage;
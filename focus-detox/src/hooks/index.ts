import { useState, useEffect, useCallback } from 'react';
import { loadUserData, saveUserData, initializeUserData } from '../utils/storage';
import { UserData } from '../types';

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await loadUserData();
      if (!data) {
        const newData = await initializeUserData();
        setUserData(newData);
      } else {
        setUserData(data);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateData = useCallback(async (updates: Partial<UserData>) => {
    if (!userData) return;
    const newData = { ...userData, ...updates };
    await saveUserData(newData);
    setUserData(newData);
  }, [userData]);

  return { userData, loading, updateData, refresh: loadData };
}

export function useTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((newSeconds?: number) => {
    setSeconds(newSeconds ?? initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  return { seconds, isRunning, start, pause, reset };
}

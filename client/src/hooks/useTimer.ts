import { useState, useEffect, useRef, useCallback } from "react";

interface UseTimerProps {
  initialTime: number;
  isActive?: boolean;
  onTimeUp?: () => void;
}

export default function useTimer({
  initialTime,
  isActive = true,
  onTimeUp
}: UseTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(initialTime);
  const [isTimerLow, setIsTimerLow] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear the timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start/stop timer based on isActive prop
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            if (onTimeUp) {
              onTimeUp();
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (!isActive && timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeRemaining, onTimeUp]);

  // Update isTimerLow state when time gets below 10 seconds
  useEffect(() => {
    setIsTimerLow(timeRemaining <= 10 && timeRemaining > 0);
  }, [timeRemaining]);

  // Reset timer with a new time value
  const resetTimer = useCallback((newTime: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimeRemaining(newTime);
    setIsTimerLow(false);
  }, []);

  return { timeRemaining, isTimerLow, resetTimer };
}

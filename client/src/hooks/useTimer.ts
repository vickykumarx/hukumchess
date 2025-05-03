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
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Only start timer if active and time remaining
    if (isActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          // When timer reaches 0 or below
          if (prevTime <= 1) {
            // Clean up interval
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            // Call onTimeUp callback after a small delay to ensure state updates
            setTimeout(() => {
              if (onTimeUp) {
                onTimeUp();
              }
            }, 50);
            
            return 0;
          }
          
          // Otherwise decrement timer
          return prevTime - 1;
        });
      }, 1000);
    }

    // Cleanup on unmount or deps change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, timeRemaining, onTimeUp]);

  // Update isTimerLow state when time gets below 10 seconds
  useEffect(() => {
    setIsTimerLow(timeRemaining <= 10 && timeRemaining > 0);
  }, [timeRemaining]);

  // Reset timer with a new time value
  const resetTimer = useCallback((newTime: number) => {
    // Ensure newTime is a positive number
    const validTime = Math.max(0, newTime);
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset timer values
    setTimeRemaining(validTime);
    setIsTimerLow(validTime <= 10 && validTime > 0);
    
    // Log timer reset for debugging
    console.log(`Timer reset to ${validTime} seconds`);
    
    return validTime; // Return the new time value for chaining
  }, []);

  return { timeRemaining, isTimerLow, resetTimer };
}

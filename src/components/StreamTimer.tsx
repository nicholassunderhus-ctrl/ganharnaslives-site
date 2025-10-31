import { useState, useEffect } from 'react';

interface StreamTimerProps {
  createdAt: string;
  durationMinutes: number;
  onTimerEnd?: () => void;
}

/**
 * Formata os segundos restantes no formato MM:SS.
 */
const formatTime = (totalSeconds: number): string => {
  if (totalSeconds <= 0) {
    return '00:00';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const StreamTimer = ({ createdAt, durationMinutes, onTimerEnd }: StreamTimerProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    let timerEnded = false;
    const calculateRemainingTime = () => {
      const startTime = new Date(createdAt).getTime();
      const endTime = startTime + durationMinutes * 60 * 1000;
      const now = new Date().getTime();
      const remaining = Math.max(0, (endTime - now) / 1000);
      if (remaining <= 0 && !timerEnded && onTimerEnd) {
        timerEnded = true;
        onTimerEnd();
      }
      return remaining;
    };

    // Define o tempo inicial
    setRemainingSeconds(calculateRemainingTime());

    // Atualiza o tempo a cada segundo se ainda houver tempo
    const interval = setInterval(() => {
      const newRemaining = calculateRemainingTime();
      setRemainingSeconds(newRemaining);
      if (newRemaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(interval);
  }, [createdAt, durationMinutes, onTimerEnd]);

  return (
    <span className="font-mono font-semibold">{formatTime(remainingSeconds)}</span>
  );
};
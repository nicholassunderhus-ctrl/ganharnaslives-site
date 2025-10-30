import { useState, useEffect } from 'react';

interface StreamTimerProps {
  createdAt: string;
  durationMinutes: number;
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

export const StreamTimer = ({ createdAt, durationMinutes }: StreamTimerProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    const calculateRemainingTime = () => {
      const startTime = new Date(createdAt).getTime();
      const endTime = startTime + durationMinutes * 60 * 1000;
      const now = new Date().getTime();
      const remaining = Math.max(0, (endTime - now) / 1000);
      return remaining;
    };

    // Define o tempo inicial
    setRemainingSeconds(calculateRemainingTime());

    // Atualiza o tempo a cada segundo
    const interval = setInterval(() => {
      setRemainingSeconds(calculateRemainingTime());
    }, 1000);

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(interval);
  }, [createdAt, durationMinutes]);

  return (
    <span className="font-mono font-semibold">{formatTime(remainingSeconds)}</span>
  );
};
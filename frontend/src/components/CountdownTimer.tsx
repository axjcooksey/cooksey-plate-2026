import React from 'react';
import { useCountdown } from '../hooks/useCountdown';

interface CountdownTimerProps {
  targetDate: Date;
  onExpired?: () => void;
  label?: string;
}

export default function CountdownTimer({ targetDate, onExpired, label }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  React.useEffect(() => {
    if (isExpired && onExpired) {
      onExpired();
    }
  }, [isExpired, onExpired]);

  if (isExpired) {
    return null;
  }

  const formatTime = (value: number) => String(value).padStart(2, '0');

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-yellow-800 mb-1">
            🔒 Tips Locked
          </h4>
          <p className="text-sm text-yellow-700">
            {label || 'Tips will be visible when lockout period ends'}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-800 font-mono">
            {days > 0 && (
              <span>{days}d </span>
            )}
            {formatTime(hours)}:{formatTime(minutes)}:{formatTime(seconds)}
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            {days > 0 ? 'days:hours:minutes:seconds' : 'hours:minutes:seconds'}
          </div>
        </div>
      </div>
    </div>
  );
}
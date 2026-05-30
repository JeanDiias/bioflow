import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { formatDuration } from '@/lib/reactorUtils';

export default function PhaseTimer({ startDate }) {
  const [display, setDisplay] = useState(formatDuration(startDate));

  useEffect(() => {
    if (!startDate) {
      setDisplay('00:00:00');
      return;
    }
    const interval = setInterval(() => {
      setDisplay(formatDuration(startDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  return (
    <div className="flex items-center gap-2">
      <Timer className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="font-mono text-sm tracking-wider">{display}</span>
    </div>
  );
}

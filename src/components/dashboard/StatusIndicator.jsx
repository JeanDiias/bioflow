import { STATUS_CONFIG } from '@/lib/reactorUtils';
import { cn } from '@/lib/utils';

export default function StatusIndicator({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", config.dotColor)} />
      <span className={cn("text-xs font-semibold uppercase tracking-wider", config.textColor)}>
        {config.label}
      </span>
    </div>
  );
}

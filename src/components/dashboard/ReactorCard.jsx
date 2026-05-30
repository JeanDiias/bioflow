import { STATUS_CONFIG } from '@/lib/reactorUtils';
import { cn } from '@/lib/utils';
import StatusIndicator from './StatusIndicator';
import PhaseTimer from './PhaseTimer';
import {
  FlaskConical, Droplets, Flame, Circle, User, Hash,
  Wrench, Sparkles, RefreshCw, TestTube, ArrowRight
} from 'lucide-react';

// Suggested next phase based on last status
const NEXT_PHASE_MAP = {
  disassembly: 'cleaning',
  cleaning: 'water_sterilization',
  water_sterilization: 'cip',
  cip: 'dry_sterilization',
  dry_sterilization: 'medium_sterilization',
  medium_sterilization: 'in_process',
  in_process: 'disassembly',
};

const iconMap = {
  Circle, Droplets, Flame, FlaskConical, Wrench, Sparkles, RefreshCw, TestTube,
};

export default function ReactorCard({ reactor, onClick }) {
  const config = STATUS_CONFIG[reactor.status] || STATUS_CONFIG.idle;
  const Icon = iconMap[config.icon] || Circle;
  const isPilot = reactor.reactor_type === 'piloto';
  const isIdleWithHistory = reactor.status === 'idle' && reactor.last_status;
  const nextPhase = NEXT_PHASE_MAP[reactor.last_status];
  const nextPhaseConfig = nextPhase ? STATUS_CONFIG[nextPhase] : null;

  return (
    <button
      onClick={() => onClick(reactor)}
      className={cn(
        "relative w-full text-left rounded-xl border-2 p-5 transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-xl cursor-pointer",
        "bg-card/80 backdrop-blur-sm",
        config.color,
        config.glowColor
      )}
    >
      {/* Type badge */}
      <div className="absolute top-3 right-3">
        <span className={cn(
          "text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
          isPilot
            ? "bg-violet-500/10 text-violet-400 border-violet-500/30"
            : "bg-sky-500/10 text-sky-400 border-sky-500/30"
        )}>
          {isPilot ? 'Piloto' : 'Industrial'}
        </span>
      </div>

      {/* Top row */}
      <div className="flex items-start justify-between mb-4 pr-20">
        <div>
          <h2 className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {reactor.reactor_id}
          </h2>
          {isIdleWithHistory ? (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Aguardando próxima etapa
              </span>
            </div>
          ) : (
            <StatusIndicator status={reactor.status} />
          )}
        </div>
        <div className={cn("p-3 rounded-lg border", config.color)}>
          <Icon className={cn("w-6 h-6", config.textColor)} />
        </div>
      </div>

      {/* Timer */}
      {!isIdleWithHistory && (
        <div className="mb-4">
          <PhaseTimer startDate={reactor.phase_started_at} />
        </div>
      )}

      {/* Info rows */}
      <div className="space-y-2 text-sm">
        <div className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1 -mx-2",
          reactor.operator_name
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground"
        )}>
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{reactor.operator_name || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="w-3.5 h-3.5 shrink-0" />
          <span className="font-mono text-xs truncate">{reactor.batch_id || '—'}</span>
        </div>
        {isIdleWithHistory && (
          <>
            <div className="flex items-center gap-2 rounded-md px-2 py-1 -mx-2 bg-slate-500/10 border border-slate-500/20">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Último:</span>
              <span className={cn("text-xs font-semibold", STATUS_CONFIG[reactor.last_status]?.textColor)}>
                {STATUS_CONFIG[reactor.last_status]?.label || reactor.last_status}
              </span>
            </div>
            {nextPhaseConfig && (
              <div className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 -mx-2 border",
                nextPhaseConfig.color
              )}>
                <ArrowRight className={cn("w-3.5 h-3.5 shrink-0", nextPhaseConfig.textColor)} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Próxima etapa:</span>
                <span className={cn("text-xs font-bold", nextPhaseConfig.textColor)}>
                  {nextPhaseConfig.label}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Accent line at bottom */}
      <div className={cn(
        "absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-50",
        config.dotColor
      )} />
    </button>
  );
}

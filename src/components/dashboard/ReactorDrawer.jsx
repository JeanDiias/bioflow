import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Droplets, Flame, FlaskConical, Circle, Loader2,
  Wrench, Sparkles, RefreshCw, TestTube, CheckCircle2, User, RotateCcw, AlertTriangle
} from 'lucide-react';
import StatusIndicator from './StatusIndicator';
import PhaseTimer from './PhaseTimer';
import { cn } from '@/lib/utils';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';

const ACTIONS = [
  { key: 'idle',               label: 'Ocioso',                      icon: Circle,     color: 'bg-slate-500/15 text-slate-400 border-slate-500/30 hover:bg-slate-500/25' },
  { key: 'disassembly',        label: 'Desmontagem',                  icon: Wrench,     color: 'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25' },
  { key: 'cleaning',           label: 'Limpeza',                      icon: Sparkles,   color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25' },
  { key: 'water_sterilization',label: 'Esterilização c/ Água',        icon: Droplets,   color: 'bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-500/25' },
  { key: 'cip',                label: 'CIP',                          icon: RefreshCw,  color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/25' },
  { key: 'dry_sterilization',  label: 'Esterilização a Seco',         icon: Flame,      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25' },
  { key: 'medium_sterilization', label: 'Esteril. Meio de Cultura',   icon: TestTube,   color: 'bg-violet-500/15 text-violet-400 border-violet-500/30 hover:bg-violet-500/25' },
  { key: 'in_process',         label: 'Em Processo',                  icon: FlaskConical, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25' },
];

export default function ReactorDrawer({ reactor, open, onClose, onChangePhase, onRestart }) {
  const [batchId, setBatchId] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [loading, setLoading] = useState(null);
  const [confirmRestart, setConfirmRestart] = useState(false);

  const { data: logs = [] } = useQuery({
    queryKey: ['activityLogs', reactor?.reactor_id, open],
    queryFn: () => api.entities.ActivityLog.filter(
      { reactor_id: reactor.reactor_id },
      '-created_date',
      50
    ),
    enabled: !!reactor && open,
  });

  if (!reactor) return null;

  // Logs chegam em ordem DESC (mais recente primeiro).
  // O log de 'idle' mais recente marca um reinício ou conclusão de processo.
  // Apenas os logs CRIADOS APÓS esse evento pertencem à sessão atual.
  const lastIdleLog = logs.find(l => l.new_status === 'idle');
  const sessionLogs = lastIdleLog
    ? logs.filter(l => l.created_date > lastIdleLog.created_date)
    : logs;

  // Build set of statuses that have been used in this session (based on logs)
  const usedStatuses = new Set(sessionLogs.map(l => l.new_status).filter(Boolean));

  // Map status → most recent operator who performed it
  const statusOperatorMap = sessionLogs.reduce((acc, log) => {
    if (log.new_status && log.operator_name && !acc[log.new_status]) {
      acc[log.new_status] = log.operator_name;
    }
    return acc;
  }, {});

  const handleRestart = async () => {
    setLoading('restart');
    await onRestart(reactor);
    setConfirmRestart(false);
    setLoading(null);
  };

  const handleAction = async (actionKey) => {
    setLoading(actionKey);
    await onChangePhase(reactor, actionKey, batchId || reactor.batch_id, operatorName || reactor.operator_name);
    setBatchId('');
    setOperatorName('');
    setLoading(null);
  };

  const isPilot = reactor.reactor_type === 'piloto';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <SheetTitle className="font-mono text-2xl">{reactor.reactor_id}</SheetTitle>
            <span className={cn(
              "text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
              isPilot
                ? "bg-violet-500/10 text-violet-400 border-violet-500/30"
                : "bg-sky-500/10 text-sky-400 border-sky-500/30"
            )}>
              {isPilot ? 'Piloto' : 'Industrial'}
            </span>
          </div>
          <SheetDescription>Painel de controle do reator</SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          {/* Current Status */}
          <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status Atual</span>
              <StatusIndicator status={reactor.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tempo na Fase</span>
              <PhaseTimer startDate={reactor.phase_started_at} />
            </div>
            {reactor.operator_name && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Operador</span>
                <span className="text-sm font-medium">{reactor.operator_name}</span>
              </div>
            )}
            {reactor.batch_id && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lote</span>
                <span className="font-mono text-sm">{reactor.batch_id}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Batch ID + Operator inputs */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="batch-id" className="text-sm text-muted-foreground">
                Número do Lote
              </Label>
              <Input
                id="batch-id"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder={reactor.batch_id || 'Ex: LOT-2026-001'}
                className="font-mono bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="operator-name" className="text-sm text-muted-foreground">
                Nome do Operador
              </Label>
              <Input
                id="operator-name"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder={reactor.operator_name || 'Ex: Carlos Silva'}
                className="bg-secondary/50 border-border"
              />
            </div>
          </div>

          <Separator />

          {/* Restart Button */}
          {confirmRestart ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 space-y-3">
              <div className="flex items-center gap-2 text-destructive text-sm font-semibold">
                <AlertTriangle className="w-4 h-4" />
                Confirmar reinício do reator?
              </div>
              <p className="text-xs text-muted-foreground">Isso irá limpar o lote, operador e histórico de fases atual.</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={loading === 'restart'}
                  onClick={() => setConfirmRestart(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
                  disabled={loading === 'restart'}
                  onClick={handleRestart}
                >
                  {loading === 'restart' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-10 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive text-sm"
              disabled={loading !== null}
              onClick={() => setConfirmRestart(true)}
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar Reator
            </Button>
          )}

          {/* Complete Process Button */}
          {reactor.status !== 'idle' && (
            <Button
              className="w-full h-12 gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
              disabled={loading !== null}
              onClick={() => handleAction('idle')}
            >
              {loading === 'idle' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              Marcar como Processo Concluído
            </Button>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Trocar de Fase
            </span>
            <div className="grid gap-2 mt-2">
              {ACTIONS.map((action) => {
                const Icon = action.icon;
                const isCurrentStatus = reactor.status === action.key;
                const wasDone = usedStatuses.has(action.key) && !isCurrentStatus;
                const doneByOperator = statusOperatorMap[action.key];
                const isLoadingThis = loading === action.key;

                return (
                  <Button
                    key={action.key}
                    variant="outline"
                    disabled={isCurrentStatus || loading !== null}
                    onClick={() => handleAction(action.key)}
                    className={cn(
                      "justify-start gap-3 border transition-all relative w-full",
                      wasDone ? "h-auto py-2 flex-col items-start" : "h-11",
                      isCurrentStatus
                        ? cn("opacity-100 ring-2 ring-offset-1 ring-offset-card", action.color, "border-current")
                        : wasDone
                        ? cn(action.color, "opacity-70")
                        : action.color
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {isLoadingThis ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <Icon className="w-4 h-4 shrink-0" />
                      )}
                      <span>{action.label}</span>
                      {isCurrentStatus && (
                        <span className="ml-auto flex items-center gap-1 text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          Atual
                        </span>
                      )}
                      {wasDone && (
                        <span className="ml-auto">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    {wasDone && doneByOperator && (
                      <div className="flex items-center gap-1.5 pl-7 text-[11px] opacity-80">
                        <User className="w-3 h-3 shrink-0" />
                        <span>{doneByOperator}</span>
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

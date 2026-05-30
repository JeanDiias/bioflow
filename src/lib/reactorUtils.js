export const STATUS_CONFIG = {
  idle: {
    label: 'Ocioso',
    color: 'bg-slate-500/20 border-slate-500/40',
    textColor: 'text-slate-400',
    dotColor: 'bg-slate-400',
    glowColor: 'shadow-slate-500/20',
    icon: 'Circle',
  },
  disassembly: {
    label: 'Desmontagem',
    color: 'bg-orange-500/15 border-orange-500/40',
    textColor: 'text-orange-400',
    dotColor: 'bg-orange-400',
    glowColor: 'shadow-orange-500/20',
    icon: 'Wrench',
  },
  cleaning: {
    label: 'Limpeza',
    color: 'bg-cyan-500/15 border-cyan-500/40',
    textColor: 'text-cyan-400',
    dotColor: 'bg-cyan-400',
    glowColor: 'shadow-cyan-500/20',
    icon: 'Sparkles',
  },
  water_sterilization: {
    label: 'Esterilização c/ Água',
    color: 'bg-sky-500/15 border-sky-500/40',
    textColor: 'text-sky-400',
    dotColor: 'bg-sky-400',
    glowColor: 'shadow-sky-500/20',
    icon: 'Droplets',
  },
  cip: {
    label: 'CIP',
    color: 'bg-yellow-500/15 border-yellow-500/40',
    textColor: 'text-yellow-400',
    dotColor: 'bg-yellow-400',
    glowColor: 'shadow-yellow-500/20',
    icon: 'RefreshCw',
  },
  dry_sterilization: {
    label: 'Esterilização a Seco',
    color: 'bg-amber-500/15 border-amber-500/40',
    textColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    glowColor: 'shadow-amber-500/20',
    icon: 'Flame',
  },
  medium_sterilization: {
    label: 'Esteril. Meio de Cultura',
    color: 'bg-violet-500/15 border-violet-500/40',
    textColor: 'text-violet-400',
    dotColor: 'bg-violet-400',
    glowColor: 'shadow-violet-500/20',
    icon: 'TestTube',
  },
  in_process: {
    label: 'Em Processo',
    color: 'bg-emerald-500/15 border-emerald-500/40',
    textColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    glowColor: 'shadow-emerald-500/20',
    icon: 'FlaskConical',
  },
};

export function formatDuration(startDate) {
  if (!startDate) return '00:00:00';
  const now = new Date();
  const start = new Date(startDate);
  const diff = Math.floor((now - start) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDurationMinutes(minutes) {
  if (!minutes) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}min`;
}

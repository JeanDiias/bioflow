import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactorCard from '@/components/dashboard/ReactorCard';
import ReactorDrawer from '@/components/dashboard/ReactorDrawer';
import { Loader2, Activity, FlaskConical, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { STATUS_CONFIG } from '@/lib/reactorUtils';

const REACTORS_INIT = [
  { reactor_id: 'R-01', reactor_type: 'industrial' },
  { reactor_id: 'R-02', reactor_type: 'industrial' },
  { reactor_id: 'R-03', reactor_type: 'industrial' },
  { reactor_id: 'R-04', reactor_type: 'industrial' },
  { reactor_id: 'R-05', reactor_type: 'piloto' },
  { reactor_id: 'R-06', reactor_type: 'piloto' },
];

export default function Dashboard() {
  const [selectedReactor, setSelectedReactor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch reactors
  const { data: reactors = [], isLoading, isFetched } = useQuery({
    queryKey: ['bioreactors'],
    queryFn: () => base44.entities.Bioreactor.list(),
  });

  // Initialize reactors only after data is confirmed empty from the server
  useEffect(() => {
    if (isFetched && reactors.length === 0) {
      initializeReactors();
    }
  }, [isFetched, reactors.length]);

  const initializeReactors = async () => {
    const newReactors = REACTORS_INIT.map((r) => ({
      ...r,
      status: 'idle',
      batch_id: '',
      operator_name: '',
      phase_started_at: new Date().toISOString(),
    }));
    await base44.entities.Bioreactor.bulkCreate(newReactors);
    queryClient.invalidateQueries({ queryKey: ['bioreactors'] });
  };

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Change phase mutation
  const changePhase = useMutation({
    mutationFn: async ({ reactor, newStatus, batchId, operatorName: opName }) => {
      const now = new Date().toISOString();
      const operatorName = opName || user?.full_name || user?.email || 'Operador';

      // If going to idle from in_process, save to batch history
      if (newStatus === 'idle' && reactor.status === 'in_process') {
        const start = new Date(reactor.phase_started_at);
        const end = new Date(now);
        const totalMin = Math.round((end - start) / 60000);
        await base44.entities.BatchHistory.create({
          reactor_id: reactor.reactor_id,
          batch_id: reactor.batch_id,
          operator_name: reactor.operator_name,
          started_at: reactor.phase_started_at,
          completed_at: now,
          total_duration_minutes: totalMin,
        });
      }

      // Log the action
      const actionLabel = STATUS_CONFIG[newStatus]?.label || newStatus;
      await base44.entities.ActivityLog.create({
        reactor_id: reactor.reactor_id,
        action: `Fase alterada para: ${actionLabel}`,
        operator_name: operatorName,
        batch_id: batchId || reactor.batch_id || '',
        previous_status: reactor.status,
        new_status: newStatus,
      });

      // Update reactor
      await base44.entities.Bioreactor.update(reactor.id, {
        status: newStatus,
        phase_started_at: now,
        operator_name: newStatus === 'idle' ? '' : operatorName,
        batch_id: newStatus === 'idle' ? '' : (batchId || reactor.batch_id || ''),
        last_status: newStatus === 'idle' ? reactor.status : (reactor.last_status || ''),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bioreactors'] });
      setDrawerOpen(false);
      setSelectedReactor(null);
    },
  });

  const handleCardClick = (reactor) => {
    setSelectedReactor(reactor);
    setDrawerOpen(true);
  };

  const restartReactor = useMutation({
    mutationFn: async (reactor) => {
      const now = new Date().toISOString();
      await base44.entities.ActivityLog.create({
        reactor_id: reactor.reactor_id,
        action: 'Reator reiniciado manualmente',
        operator_name: user?.full_name || user?.email || 'Operador',
        batch_id: reactor.batch_id || '',
        previous_status: reactor.status,
        new_status: 'idle',
      });
      await base44.entities.Bioreactor.update(reactor.id, {
        status: 'idle',
        batch_id: '',
        operator_name: '',
        last_status: '',
        phase_started_at: now,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bioreactors'] });
      setDrawerOpen(false);
      setSelectedReactor(null);
    },
  });

  const handleChangePhase = async (reactor, newStatus, batchId, operatorName) => {
    await changePhase.mutateAsync({ reactor, newStatus, batchId, operatorName });
  };

  // Sort reactors by reactor_id
  const sortedReactors = [...reactors].sort((a, b) => 
    a.reactor_id.localeCompare(b.reactor_id)
  );

  // Summary stats
  const statusCounts = sortedReactors.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={Activity}
          label="Total Reatores"
          value={sortedReactors.length}
          color="text-foreground"
        />
        <SummaryCard
          icon={FlaskConical}
          label="Em Processo"
          value={statusCounts.in_process || 0}
          color="text-emerald-400"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Desmontagem"
          value={statusCounts.disassembly || 0}
          color="text-orange-400"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Ociosos"
          value={statusCounts.idle || 0}
          color="text-slate-400"
        />
      </div>

      {/* Reactor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedReactors.map((reactor) => (
          <ReactorCard
            key={reactor.id}
            reactor={reactor}
            onClick={handleCardClick}
          />
        ))}
      </div>

      {/* Drawer */}
      <ReactorDrawer
        reactor={selectedReactor}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onChangePhase={handleChangePhase}
        onRestart={(reactor) => restartReactor.mutateAsync(reactor)}
      />
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl bg-card/80 border border-border p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-secondary/50">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xl font-mono font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

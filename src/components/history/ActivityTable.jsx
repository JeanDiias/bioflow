import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, FlaskConical, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { STATUS_CONFIG } from '@/lib/reactorUtils';

export default function ActivityTable() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['activityLogs'],
    queryFn: () => base44.entities.ActivityLog.list('-created_date', 100),
    initialData: [],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileText className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">Nenhuma atividade registrada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card/50">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/30 hover:bg-secondary/30">
            <TableHead className="font-mono text-xs">Data/Hora</TableHead>
            <TableHead className="font-mono text-xs">Reator</TableHead>
            <TableHead className="font-mono text-xs">Ação</TableHead>
            <TableHead className="font-mono text-xs">Operador</TableHead>
            <TableHead className="font-mono text-xs">Lote</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const newConfig = STATUS_CONFIG[log.new_status];
            return (
              <TableRow key={log.id} className="border-border/50">
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    {format(new Date(log.created_date), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono bg-secondary/30 border-border">
                    <FlaskConical className="w-3 h-3 mr-1" />
                    {log.reactor_id}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${newConfig?.textColor || ''}`}>
                    {log.action}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <User className="w-3 h-3 text-muted-foreground" />
                    {log.operator_name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {log.batch_id || '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

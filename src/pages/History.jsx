import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, History as HistoryIcon, Clock, FlaskConical, User, Calendar, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDurationMinutes } from '@/lib/reactorUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ActivityTable from '@/components/history/ActivityTable';
import { exportBatchPdf } from '@/lib/exportBatchPdf';

export default function History() {
  const { data: batches, isLoading: loadingBatches } = useQuery({
    queryKey: ['batchHistory'],
    queryFn: () => api.entities.BatchHistory.list('-created_date', 50),
    initialData: [],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/15">
          <HistoryIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-mono">Histórico</h2>
          <p className="text-sm text-muted-foreground">Registro de lotes e atividades</p>
        </div>
      </div>

      <Tabs defaultValue="batches">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="batches">Lotes Finalizados</TabsTrigger>
          <TabsTrigger value="logs">Log de Atividades</TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="mt-4">
          {loadingBatches ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : batches.length === 0 ? (
            <EmptyState message="Nenhum lote finalizado ainda." />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card/50">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                    <TableHead className="font-mono text-xs">Reator</TableHead>
                    <TableHead className="font-mono text-xs">Lote</TableHead>
                    <TableHead className="font-mono text-xs">Operador</TableHead>
                    <TableHead className="font-mono text-xs">Início</TableHead>
                    <TableHead className="font-mono text-xs">Conclusão</TableHead>
                    <TableHead className="font-mono text-xs">Duração Total</TableHead>
                    <TableHead className="font-mono text-xs"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id} className="border-border/50">
                      <TableCell>
                        <Badge variant="outline" className="font-mono bg-secondary/30 border-border">
                          <FlaskConical className="w-3 h-3 mr-1" />
                          {batch.reactor_id}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{batch.batch_id || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {batch.operator_name || '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {batch.started_at
                            ? format(new Date(batch.started_at), "dd/MM/yy HH:mm", { locale: ptBR })
                            : '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {batch.completed_at
                          ? format(new Date(batch.completed_at), "dd/MM/yy HH:mm", { locale: ptBR })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-mono text-sm">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {formatDurationMinutes(batch.total_duration_minutes)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => exportBatchPdf(batch)}
                          className="h-8 px-2 text-muted-foreground hover:text-primary"
                          title="Exportar PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <ActivityTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <HistoryIcon className="w-10 h-10 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

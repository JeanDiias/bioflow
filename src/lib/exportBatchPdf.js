import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function exportBatchPdf(batch) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 0;

  // Header bar
  doc.setFillColor(22, 163, 74); // emerald-600
  doc.rect(0, 0, pageW, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text('BioFlow — Relatório de Lote', margin, 9.5);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(`Gerado em: ${fmt(new Date().toISOString())}`, pageW - margin, 9.5, { align: 'right' });

  y = 24;

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('courier', 'bold');
  doc.setFontSize(18);
  doc.text(`Lote: ${batch.batch_id || '—'}`, margin, y);
  y += 8;

  // Subtitle line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Info section
  const fields = [
    ['Reator',         batch.reactor_id || '—'],
    ['Lote',           batch.batch_id || '—'],
    ['Operador',       batch.operator_name || '—'],
    ['Início',         fmt(batch.started_at)],
    ['Conclusão',      fmt(batch.completed_at)],
    ['Duração Total',  batch.total_duration_minutes != null
      ? `${Math.floor(batch.total_duration_minutes / 60)}h ${batch.total_duration_minutes % 60}min`
      : '—'],
  ];

  fields.forEach(([label, value]) => {
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(label.toUpperCase(), margin, y);

    doc.setFont('courier', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(value, margin, y + 6);
    y += 16;
  });

  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Footer note
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento gerado automaticamente pelo sistema BioFlow.', margin, y);

  doc.save(`bioflow_lote_${batch.batch_id || batch.id}.pdf`);
}

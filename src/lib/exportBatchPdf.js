import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_LABELS = {
  disassembly:        'Desmontagem',
  cleaning:           'Limpeza',
  water_sterilization:'Esterilização c/ Água',
  cip:                'CIP',
  dry_sterilization:  'Esterilização a Seco',
  medium_sterilization:'Esteril. Meio de Cultura',
  in_process:         'Em Processo',
  idle:               'Ocioso',
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

function fmtDur(min) {
  if (min == null || min === 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

/**
 * @param {object} batch       - Registro de BatchHistory
 * @param {Array}  phaseLogs   - Registros de PhaseLog do lote (opcional)
 */
export function exportBatchPdf(batch, phaseLogs = []) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 0;

  // ── Header bar ────────────────────────────────────────────────
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, pageW, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text('BioFlow — Relatório de Lote', margin, 9.5);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(`Gerado em: ${fmt(new Date().toISOString())}`, pageW - margin, 9.5, { align: 'right' });

  y = 24;

  // ── Título ────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFont('courier', 'bold');
  doc.setFontSize(18);
  doc.text(`Lote: ${batch.batch_id || '—'}`, margin, y);
  y += 8;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Campos do lote ────────────────────────────────────────────
  const fields = [
    ['Reator',        batch.reactor_id || '—'],
    ['Lote',          batch.batch_id || '—'],
    ['Operador',      batch.operator_name || '—'],
    ['Início',        fmt(batch.started_at)],
    ['Conclusão',     fmt(batch.completed_at)],
    ['Duração Total', fmtDur(batch.total_duration_minutes)],
  ];

  fields.forEach(([label, value]) => {
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
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
  y += 10;

  // ── Tabela de fases ───────────────────────────────────────────
  if (phaseLogs.length > 0) {
    // Ordena cronologicamente
    const sorted = [...phaseLogs].sort((a, b) => a.started_at.localeCompare(b.started_at));

    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('SEQUÊNCIA DE FASES', margin, y);
    y += 6;

    // Cabeçalho da tabela
    const colX = [margin, margin + 48, margin + 90, margin + 118, margin + 146];
    const headers = ['Fase', 'Início', 'Fim', 'Duração', 'Operador'];

    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, pageW - margin * 2, 7, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // slate-600
    headers.forEach((h, i) => doc.text(h.toUpperCase(), colX[i], y + 5));
    y += 9;

    // Linhas da tabela
    sorted.forEach((pl, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(margin, y - 1, pageW - margin * 2, 7, 'F');
      }

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      const label = STATUS_LABELS[pl.phase] || pl.phase;
      const interrupted = pl.interrupted ? ' ⚠' : '';

      doc.text(label + interrupted,         colX[0], y + 4.5, { maxWidth: 44 });
      doc.text(fmt(pl.started_at),          colX[1], y + 4.5);
      doc.text(fmt(pl.ended_at),            colX[2], y + 4.5);
      doc.text(fmtDur(pl.duration_minutes), colX[3], y + 4.5);
      doc.text(pl.operator_name || '—',    colX[4], y + 4.5, { maxWidth: 38 });
      y += 8;
    });

    // Total
    const totalMin = sorted.reduce((s, p) => s + (p.duration_minutes || 0), 0);
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL DO CICLO', colX[0], y);
    doc.text(fmtDur(totalMin), colX[3], y);
    y += 10;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
  }

  // ── Rodapé ────────────────────────────────────────────────────
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento gerado automaticamente pelo sistema BioFlow.', margin, y);

  doc.save(`bioflow_lote_${batch.batch_id || batch.id}.pdf`);
}

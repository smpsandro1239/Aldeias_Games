import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Constants
const PRIMARY_COLOR = [37, 99, 235];
const SECONDARY_COLOR = [100, 116, 139];
const LIGHT_GRAY = [248, 250, 252];
const DARK_GRAY = [30, 41, 59];
const MUTED_GRAY = [148, 163, 184];

// Safe JSON parsing
function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

interface ParticipacaoData {
  id: string;
  dadosParticipacao: string;
  nomeCliente?: string;
  telefoneCliente?: string;
  emailCliente?: string;
  valorPago: number;
  createdAt: string;
  estadoPagamento?: string;
  jogo?: {
    nome: string;
    tipo: string;
  };
  evento?: {
    nome: string;
    aldeia?: {
      nome: string;
    };
  };
}

export interface ExportOptions {
  titulo: string;
  subtitulo?: string;
  aldeia?: string;
}

export function exportParticipacoesPDF(
  participacoes: ParticipacaoData[],
  options: ExportOptions
): void {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(options.titulo, 14, 22);

  if (options.subtitulo) {
    doc.setFontSize(12);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(options.subtitulo, 14, 30);
  }

  if (options.aldeia) {
    doc.setFontSize(10);
    doc.text(`Organização: ${options.aldeia}`, 14, 38);
  }

  doc.setFontSize(10);
  doc.text(`Exportado em: ${new Date().toLocaleDateString('pt-PT')}`, 14, options.aldeia ? 44 : 38);

  const tableData = participacoes.map((p, index) => {
    const dados = safeJsonParse(p.dadosParticipacao, {});
    return [
      (index + 1).toString(),
      p.jogo?.nome || '-',
      dados.numero || `${dados.letra || ''}${dados.numero || ''}` || '-',
      p.nomeCliente || p.emailCliente || p.telefoneCliente || 'Anónimo',
      `${p.valorPago.toFixed(2)}€`,
      new Date(p.createdAt).toLocaleDateString('pt-PT'),
      p.estadoPagamento || 'concluido'
    ];
  });

  (doc as any).autoTable({
    head: [['#', 'Jogo', 'Número', 'Cliente', 'Valor', 'Data', 'Estado']],
    body: tableData,
    startY: options.aldeia ? 50 : 44,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: LIGHT_GRAY,
    },
    theme: 'striped',
  });

  const total = participacoes.reduce((acc, p) => acc + p.valorPago, 0);
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.setTextColor(...DARK_GRAY);
  doc.text(`Total de participantes: ${participacoes.length}`, 14, finalY);
  doc.text(`Valor total angariado: ${total.toFixed(2)}€`, 14, finalY + 6);

  doc.save(`${options.titulo.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`);
}

export function exportVendasExcel(
  vendas: Array<{
    id: string;
    valor: number;
    comissao: number;
    metodoPagamento: string;
    dadosCliente?: string;
    createdAt: string;
    vendedor?: { nome: string };
  }>,
  options: ExportOptions
): void {
  const csvContent = [
    ['#', 'Vendedor', 'Cliente', 'Valor', 'Comissão', 'Método', 'Data'].join(','),
    ...vendas.map((v, index) => [
      index + 1,
      v.vendedor?.nome || '-',
      v.dadosCliente ? safeJsonParse(v.dadosCliente, {}).nome || '-' : '-',
      v.valor.toFixed(2),
      v.comissao.toFixed(2),
      v.metodoPagamento,
      new Date(v.createdAt).toLocaleString('pt-PT')
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${options.titulo.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.csv`;
  link.click();
}

export function exportBilhetePDF(
  participacao: ParticipacaoData,
  aldeiaNome: string,
  contacto?: string
): void {
  const doc = new jsPDF();
  const dados = safeJsonParse(participacao.dadosParticipacao, {});
  const numero = dados.numero || `${dados.letra || ''}${dados.numero || ''}` || 'N/A';

  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('BILHETE DE PARTICIPAÇÃO', 105, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.text(participacao.jogo?.nome || 'Sorteio', 105, 30, { align: 'center' });

  doc.setFontSize(48);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(numero, 105, 80, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(...SECONDARY_COLOR);
  doc.text(`Evento: ${participacao.evento?.nome}`, 105, 95, { align: 'center' });
  doc.text(`Organização: ${aldeiaNome}`, 105, 102, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(...MUTED_GRAY);
  doc.text(`Data: ${new Date(participacao.createdAt).toLocaleDateString('pt-PT')}`, 105, 115, { align: 'center' });
  doc.text(`ID: ${participacao.id.slice(0, 8)}`, 105, 120, { align: 'center' });

  if (contacto) {
    doc.setFontSize(9);
    doc.text(`Contacto: ${contacto}`, 105, 135, { align: 'center' });
  }

  doc.setFontSize(8);
  doc.setTextColor(...MUTED_GRAY);
  doc.text('Guarde este comprovativo até ao sorteio', 105, 280, { align: 'center' });

  doc.save(`bilhete-${numero}-${Date.now()}.pdf`);
}
import { Star, Gift, Gamepad2, Award, Ticket } from 'lucide-react';

export interface JogoInfo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  sorteado: boolean;
  dataSorteio: string | null;
  evento: {
    id: string;
    nome: string;
    aldeia: { id: string; nome: string; slug: string };
  };
}

export interface UserInfo {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
}

export interface NumeroVendido {
  numero: number;
}

export interface Participacao {
  id: string;
  valorPago: number;
  metodoPagamento: string;
  estadoPagamento: string;
  dadosParticipacao: string;
  hashParticipacao: string | null;
  hashRaspe: string | null;
  dadosVerificacao: string | null;
  seedRaspe: string | null;
  resultadoRaspe: string | null;
  revelado: boolean;
  ganhador: boolean;
  premioEntregue: boolean;
  nomeCliente: string | null;
  telefoneCliente: string | null;
  emailCliente: string | null;
  createdAt: string;
  vendedorId: string | null;
  userId: string | null;
  jogo: JogoInfo;
  vendedor: UserInfo | null;
  user: UserInfo | null;
  numerosVendidos: NumeroVendido[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AldeiaOption {
  id: string;
  nome: string;
}

export interface JogadorContact {
  nome: string;
  email?: string | null;
  telefone?: string | null;
}

export function parseDados(raw: string): { numeros?: number[]; coordenadas?: { letra: string; numero: number }[] } | null {
  try { return JSON.parse(raw); } catch { return null; }
}

export function formatNumero(num: number): string {
  return num.toString().padStart(3, '0');
}

export function formatCoordenada(c: { letra: string; numero: number }): string {
  return `${c.letra}${c.numero}`;
}

export function getHash(p: Participacao): string | null {
  return p.hashRaspe || p.hashParticipacao || null;
}

export function getJogoTipoLabel(tipo: string): string {
  switch (tipo) {
    case 'rifa': return 'Rifa';
    case 'raspadinha': return 'Raspadinha';
    case 'poio_da_vaca': return 'Poio da Vaca';
    case 'euromilhoes': return 'Euromilhões';
    default: return tipo;
  }
}

export function getJogoTipoColor(tipo: string): string {
  switch (tipo) {
    case 'rifa': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'raspadinha': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'poio_da_vaca': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'euromilhoes': return 'bg-green-500/20 text-green-400 border-green-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function getJogoAccent(tipo: string): string {
  switch (tipo) {
    case 'rifa': return 'from-blue-500/60 to-blue-500/10';
    case 'raspadinha': return 'from-purple-500/60 to-purple-500/10';
    case 'poio_da_vaca': return 'from-amber-500/60 to-amber-500/10';
    case 'euromilhoes': return 'from-green-500/60 to-green-500/10';
    default: return 'from-gray-500/60 to-gray-500/10';
  }
}

export function getJogoChip(tipo: string): string {
  switch (tipo) {
    case 'rifa': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'raspadinha': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'poio_da_vaca': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'euromilhoes': return 'bg-green-500/10 text-green-500 border-green-500/20';
    default: return 'bg-primary/10 text-primary border-primary/20';
  }
}

export function getJogoIcon(tipo: string) {
  switch (tipo) {
    case 'rifa': return Star;
    case 'raspadinha': return Gift;
    case 'poio_da_vaca': return Gamepad2;
    case 'euromilhoes': return Award;
    default: return Ticket;
  }
}

export function getPaymentLabel(metodo: string): string {
  switch (metodo) {
    case 'saldo': return 'Saldo';
    case 'dinheiro': return 'Dinheiro';
    case 'mbway': return 'MB Way';
    case 'stripe': return 'Cartão';
    case 'transferencia': return 'Transferência';
    case 'vendedor': return 'Vendedor';
    default: return metodo;
  }
}

export function getJogadorContact(p: Participacao): JogadorContact {
  if (p.user?.nome) {
    return {
      nome: p.user.nome,
      email: p.user.email || p.emailCliente,
      telefone: p.user.telefone || p.telefoneCliente,
    };
  }
  if (p.nomeCliente) {
    return { nome: p.nomeCliente, email: p.emailCliente, telefone: p.telefoneCliente };
  }
  return {
    nome: p.emailCliente || p.user?.email || '—',
    email: p.emailCliente,
    telefone: p.telefoneCliente,
  };
}
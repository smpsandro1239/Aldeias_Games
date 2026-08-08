export interface AldeiaData {
  id: string
  nome: string
  slug: string
  descricao: string | null
  tipoOrganizacao: string
  verificado: boolean
  ativo: boolean
  logoUrl: string | null
  bannerUrl: string | null
  telefone: string | null
  email: string | null
  morada: string | null
  codigoPostal: string | null
  localidade: string | null
  responsavel: string | null
  iban: string | null
  nomeTitularConta: string | null
  nomeEscola: string | null
  codigoEscola: string | null
  nivelEnsino: string | null
  autorizacaoCM: boolean
  numeroAlvara: string | null
  documentosVerificados: boolean
  metodosPagamentoAceites: string | null
  nivel: number
  pontos: number
  createdAt: string
  userAldeiaRoles: Array<{
    id: string
    userId: string
    role: { name: string }
    user: { id: string; nome: string; role: string }
  }>
  admins: Array<{ id: string; nome: string }>
  vendedores: Array<{ id: string; nome: string }>
  _count: { userAldeiaRoles: number; eventos: number; jogos: number; premios: number }
  eventos?: Array<{
    id: string
    nome: string
    dataInicio: string
    dataFim: string | null
    estado: string
    jogos: Array<{
      id: string
      nome: string
      tipo: string
      preco: number
      ativo: boolean
      _count: { participacoes: number }
    }>
  }>
}

export const ALL_ROLES = [
  { value: "MEMBRO", label: "Utilizador", color: "bg-secondary text-secondary-foreground" },
  { value: "COLABORADOR", label: "Vendedor", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { value: "MODERADOR", label: "Admin Aldeia", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "ALDEIA_ADMIN", label: "Super Admin", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
]

export const GAME_TYPES = [
  { value: "rifa", label: "Rifa", icon: "🎫", defaultPreco: 2 },
  { value: "raspadinha", label: "Raspadinha", icon: "🎰", defaultPreco: 3 },
  { value: "euromilhoes", label: "Euromilhões", icon: "⭐", defaultPreco: 3 },
  { value: "poio_da_vaca", label: "Poio da Vaca", icon: "🐄", defaultPreco: 2 },
]

export function gameRoute(tipo: string, jogoId: string): string {
  const route = tipo === "poio_da_vaca" ? "poio-da-vaca" : tipo === "raspadinha" ? "raspadinha-premium" : tipo
  return `/jogos/${route}?jogoId=${jogoId}`
}
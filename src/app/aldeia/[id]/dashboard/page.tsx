import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UsersIcon } from '@radix-ui/react-icons'
import { Clock } from 'lucide-react'
import { mensagemErro } from '@/lib/utils'

export default async function AldeiaDashboardPage({ params }: { params: { id: string } }) {
  const aldeiaId = params.id
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/aldeia/${aldeiaId}/dashboard`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao buscar dados do dashboard')
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(mensagemErro(err))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [aldeiaId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
            <p className="mt-4 text-gray-500">Carregando dashboard da aldeia...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
          <div className="text-center py-12">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum dado encontrado para esta aldeia.</p>
          </div>
        </div>
      </div>
    )
  }

  const { aldeia, recentMembers, onlineMembers, recentEvents, recentJogos } = data

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
            {aldeia.logoUrl ? (
              <img src={aldeia.logoUrl} alt={aldeia.nome} className="h-8 w-8 rounded" />
            ) : (
              <div className="h-8 w-8 bg-primary flex items-center justify-center rounded text-white font-semibold">
                {aldeia.nome.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold">{aldeia.nome}</h2>
              <p className="text-muted-foreground">{aldeia.descricao || 'Sem descrição'}</p>
            </div>
          </h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>• Membros ativos: <strong>{aldeia.membrosAtivos}</strong></span>
            <span>• Nível: <strong>{aldeia.nivel}</strong></span>
            <span>• Pontos: <strong>{aldeia.pontos.toLocaleString()}</strong></span>
            <span>• Moeda interna: <strong>{aldeia.moedaInterna.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Main content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Left column: Stats and Progress */}
          <div className="lg:col-span-2">
            {/* Level Progress */}
            <Card className="mb-6">
              <CardHeader className="flex items-center justify-between pb-4">
                <h3 className="text-lg font-semibold">Progresso de Nível</h3>
                <span className="text-sm text-muted-foreground">
                  Nível {aldeia.nivel} → {aldeia.nivel + 1}
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span>Experiência atual</span>
                </div>
                <Progress 
                  value={aldeia.progressoNivel} 
                  className="h-2.5"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{aldeia.experiencia} XP</span>
                  <span>${Math.ceil((aldeia.nivel + 1) * 1000 - aldeia.experiencia)} XP para próximo nível</span>
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-semibold">Recursos da Aldeia</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Moeda Interna</p>
                    <p className="text-2xl font-bold">{aldeia.moedaInterna.toLocaleString()} 🪙</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pontos Totais</p>
                    <p className="text-2xl font-bold">{aldeia.pontos.toLocaleString()} ⭐</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Members and Activity */}
          <div className="lg:col-span-1">
            {/* Online Members */}
            <Card className="mb-6">
              <CardHeader className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Membros Online</h3>
                <span className="text-sm text-muted-foreground">{onlineMembers.length} online</span>
              </CardHeader>
              <CardContent className="space-y-3">
                {onlineMembers.length > 0 ? (
                  <div className="space-y-2">
                    {onlineMembers.map((member, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.fotoUrl || '/default-avatar.png'} alt={member.nome} />
                          <AvatarFallback>{member.nome.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.nome}</p>
                          <p className="text-xs text-muted-foreground">Membro</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">Nenhum membro online no momento</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Members */}
            <Card className="mb-6">
              <CardHeader className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Novos Membros</h3>
                <span className="text-sm text-muted-foreground">{recentMembers.length} recentes</span>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentMembers.length > 0 ? (
                  <div className="space-y-2">
                    {recentMembers.map((member, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-muted/50 rounded">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={member.user.fotoUrl || '/default-avatar.png'} alt={member.user.nome} />
                          <AvatarFallback>{member.user.nome.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{member.user.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.role.name} • {new Date(member.entrouEm).toLocaleDateString('pt-PT')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">Nenhum membro recente</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Full width: Events and Games */}
          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Events */}
              <Card>
                <CardHeader className="flex items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold">Eventos Recentes</h3>
                  <Link href={`/aldeia/${aldeiaId}/eventos`} className="text-sm text-muted-foreground hover:underline">
                    Ver todos
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentEvents.length > 0 ? (
                    <div className="space-y-4">
                      {recentEvents.map((evento, index) => (
                        <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{evento.nome}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full 
                              ${evento.estado === 'ativo' ? 'bg-green-100 text-green-800' : 
                                evento.estado === 'rascunho' ? 'bg-yellow-100 text-yellow-800' : 
                                evento.estado === 'pausado' ? 'bg-blue-100 text-blue-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {evento.estado}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(evento.dataInicio).toLocaleDateString('pt-PT')} - 
                            {new Date(evento.dataFim).toLocaleDateString('pt-PT')}
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <div>
                              <p className="font-medium text-muted-foreground">Objetivo</p>
                              <p className="font-bold">{evento.objectivoAngariacao ? `€${evento.objectivoAngariacao.toLocaleString()}` : 'Não definido'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">Angariado</p>
                              <p className="font-bold">€{evento.totalAngariado.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">Participações</p>
                              <p className="font-bold">{evento.totalParticipacoes}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-6">Nenhum evento encontrado</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Games */}
              <Card>
                <CardHeader className="flex items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold">Jogos Recentes</h3>
                  <Link href={`/aldeia/${aldeiaId}/jogos`} className="text-sm text-muted-foreground hover:underline">
                    Ver todos
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentJogos.length > 0 ? (
                    <div className="space-y-4">
                      {recentJogos.map((jogo, index) => (
                        <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{jogo.nome}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full 
                              ${jogo.estado === 'aberto' ? 'bg-green-100 text-green-800' : 
                                jogo.estado === 'finalizado' ? 'bg-blue-100 text-blue-800' : 
                                jogo.estado === 'pausado' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {jogo.estado}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Tipo: {jogo.tipo.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <div>
                              <p className="font-medium text-muted-foreground">Preço</p>
                              <p className="font-bold">€{jogo.preco}</p>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">Stock</p>
                              <p className="font-bold">{jogo.stockAtual}/{jogo.stockInicial}</p>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">Participações</p>
                              <p className="font-bold">{jogo.totalParticipacoes}</p>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">Angariado</p>
                              <p className="font-bold">€{jogo.totalAngariado.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-6">Nenhum jogo encontrado</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
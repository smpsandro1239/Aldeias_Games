"use client";
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function AldeiasPage() {
  const [search, setSearch] = useState('')
  const [tipoOrganizacao, setTipoOrganizacao] = useState('')

  const handleCreateAldeia = async () => {
    // TODO: Implement aldeia creation modal/form
    alert('Funcionalidade de criação de aldeia em desenvolvimento')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Aldeias</h1>
          <Button variant="outline" onClick={handleCreateAldeia}>
            Criar Aldeia
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for aldeia cards */}
          <div className="col-span-full">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Input
                  placeholder="Buscar aldeias..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-auto max-w-xs"
                />
                <select
                  value={tipoOrganizacao}
                  onChange={(e) => setTipoOrganizacao(e.target.value)}
                  className="border rounded px-3 py-2 bg-white text-sm shadow-sm"
                >
                  <option value="">Todos os tipos</option>
                  <option value="aldeia">Aldeia</option>
                  <option value="escola">Escola</option>
                  <option value="associacao_pais">Associação de Pais</option>
                  <option value="clube">Clube</option>
                </select>
              </div>

              {/* Aldeia cards will be loaded here from API */}
              <div className="space-y-4">
                {/* Example aldeia card */}
                <Link href="/aldeia/1" className="block hover:shadow-lg transition-shadow">
                  <Card className="h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold">Aldeia Exemplo</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Uma aldeia tradicional de montanha
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3"/>
                        </svg>
                        <span>120 membros</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6"/>
                        </svg>
                        <span>Nível 3</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8c-2.21 0-4 1.79-4 4v2a2 2 0 002 2h2a2 2 0 002-2v-2c0-1.11.89-2 2-2z"/>
                        </svg>
                        <span>1.250 pontos</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-4">
                      <span className="text-sm text-muted-foreground">
                        Ativa • Verificada
                      </span>
                      <Button variant="ghost" size="icon" className="p-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 5l7 7-7 7"/>
                        </svg>
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>

                {/* More cards would be rendered here from API data */}
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma aldeia encontrada com os filtros aplicados.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
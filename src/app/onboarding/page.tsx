"use client";

import type { User } from '@/hooks/use-auth';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

function getDashboardPath(role?: string) {
  switch (role) {
    case 'super_admin': return '/superadmindashboard';
    case 'aldeia_admin': return '/admindashboard';
    case 'vendedor': return '/vendedordashboard';
    default: return '/clientedashboard';
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.onboardingCompleted) {
      router.replace(getDashboardPath(user.role));
    }
  }, [user, router]);

  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (!stored) router.replace('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const updateData: Partial<User> = {
        nome: nome.trim(),
        telefone: telefone.trim() || undefined,
        onboardingCompleted: true,
      };
      await updateUser(updateData);
      router.replace(getDashboardPath(user?.role));
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Erro ao salvar informações. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await updateUser({ onboardingCompleted: true } as Partial<User>);
    } catch {}
    router.replace(getDashboardPath(user?.role));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold text-center">
            Bem-vindo à Aldeias Games!
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Vamos completar o teu perfil para começar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="O teu nome completo"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: +351 912 345 678"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'A guardar...' : 'Continuar'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={handleSkip}
                className="underline hover:text-foreground/80"
              >
                Pular por agora
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

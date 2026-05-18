import { useState, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If user already completed onboarding, redirect to dashboard
    if (user?.onboardingCompleted) {
      const role = user.role;
      if (role === 'super_admin') router.push('/admin');
      else if (role === 'aldeia_admin') router.push('/aldeia/dashboard');
      else if (role === 'vendedor') router.push('/vendedor/dashboard');
      else router.push('/jogador/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Update user with onboarding info
      await updateUser({
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        onboardingCompleted: true,
      });

      // Redirect to appropriate dashboard based on role
      const role = user?.role;
      if (role === 'super_admin') router.push('/admin');
      else if (role === 'aldeia_admin') router.push('/aldeia/dashboard');
      else if (role === 'vendedor') router.push('/vendedor/dashboard');
      else router.push('/jogador/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Erro ao salvar informações. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold text-center">
            Bem-vindo à Aldeias Games!
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Vamos completar seu perfil para começar.
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
                placeholder="Seu nome completo"
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
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Continuar'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  // Skip onboarding
                  updateUser({ onboardingCompleted: true });
                  const role = user?.role;
                  if (role === 'super_admin') router.push('/admin');
                  else if (role === 'aldeia_admin') router.push('/aldeia/dashboard');
                  else if (role === 'vendedor') router.push('/vendedor/dashboard');
                  else router.push('/jogador/dashboard');
                }}
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
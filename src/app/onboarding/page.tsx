"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setTelefone(user.telefone || '');
      if (user.onboardingCompleted) {
        redirectByRole(user.role);
      }
    }
  }, [user]);

  const redirectByRole = (role: string) => {
    if (role === 'super_admin') router.push('/superadmindashboard');
    else if (role === 'aldeia_admin') router.push('/admindashboard');
    else if (role === 'vendedor') router.push('/vendedordashboard');
    else router.push('/clientedashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await apiRequest('/api/users/perfil', {
        method: 'PATCH',
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone.trim() || null,
          onboardingCompleted: true,
        }),
      });

      if (res.ok) {
        updateUser({ nome: nome.trim(), telefone: telefone.trim(), onboardingCompleted: true });
        toast.success("Perfil atualizado!");
        redirectByRole(user?.role || 'user');
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar");
      }
    } catch (err) {
      toast.error("Erro de conexão");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-accent italic text-center">Aldeia Viva</CardTitle>
          <CardDescription className="text-center">Bem-vindo! Vamos completar o seu perfil.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telemóvel (Opcional)</Label>
              <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="+351 9XXXXXXXX" disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full h-11 bg-primary font-bold" disabled={isLoading}>
              {isLoading ? "A guardar..." : "Concluir Registo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

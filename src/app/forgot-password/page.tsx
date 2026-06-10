"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao processar o pedido');
        return;
      }

      setMessage(data.message || 'Se o email existir, receberá um link de recuperação');
      setEmail('');
    } catch (err) {
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold text-center mb-6">
            Esqueci-me da Password
          </h2>
          
          <p className="text-center text-gray-600 mb-8">
            Introduza o seu endereço de email para receber um link de
            recuperação de password.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800">{message}</p>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Lembra-se da sua password?{' '}
            <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Fazer login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
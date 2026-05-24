"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [novaPassword, setNovaPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get token from URL
  const urlToken = searchParams.get('token') || '';

  // Initialize token from URL if not set
  if (urlToken && !token) {
    setToken(urlToken);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!token) {
      setError('Token inválido ou expirado');
      setLoading(false);
      return;
    }

    if (novaPassword !== confirmPassword) {
      setError('As passwords não coincidem');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao redefinir password');
        return;
      }

      setMessage('Password alterada com sucesso');
      setNovaPassword('');
      setConfirmPassword('');

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login?message=password_reset_success');
      }, 1500);
    } catch (err) {
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = searchParams.get('message') === 'password_reset_success';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        {showSuccess ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-green-800 mb-4">
              Password redefinida com sucesso!
            </h2>
            <p className="text-green-700 mb-6">
              Sua password foi alterada. Agora você pode fazer login com a nova password.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Fazer login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">
              Redefinir Password
            </h2>
            
            <p className="text-center text-gray-600 mb-8">
              Crie uma nova password para a sua conta.
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="reset-password">Nova Password</Label>
                <Input
                  id="reset-password"
                  type="password"
                  placeholder="••••••••"
                  value={novaPassword}
                  onChange={(e) => setNovaPassword(e.target.value)}
                  required
                  minLength={12}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="reset-password-confirm">Confirmar Nova Password</Label>
                <Input
                  id="reset-password-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={12}
                  disabled={loading}
                />
              </div>

              <p className="text-xs text-gray-500 mb-2">
                A password deve ter pelo menos 12 caracteres e conter:
              </p>
              <ul className="text-xs text-gray-500 space-y-2 pl-4">
                <li>1 letra maiúscula</li>
                <li>1 letra minúscula</li>
                <li>1 número</li>
                <li>1 carácter especial (!@#$%^&*()_+-=[]{};':"\\|,.<>/?)</li>
              </ul>

              <Button
                type="submit"
                disabled={loading || !token || !novaPassword || !confirmPassword}
                className="w-full"
              >
                {loading ? 'Redefinindo...' : 'Redefinir Password'}
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
          </form>
        )}
      </div>
    </div>
  );
}
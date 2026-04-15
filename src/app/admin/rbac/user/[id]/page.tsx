"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function UserRbacPage() {
  const params = useParams();
  const userId = params?.id as string | undefined;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      setError(null);

      try {
        // Browser automatically sends httpOnly cookies
        const res = await fetch(`/api/rbac/user/${userId}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error || `Erro ${res.status}`);
        }

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar utilizador");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [userId]);

  if (loading) {
    return <div className="p-6">A carregar…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Erro: {error}</div>;
  }

  if (!user) {
    return <div className="p-6">Utilizador não encontrado.</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Gestão de Permissões — {user.nome}</h1>
      <p>Email: {user.email}</p>
      <p>ID: {user.id}</p>
    </div>
  );
}

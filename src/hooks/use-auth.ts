"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  nome: string;
  telefone?: string;
  role: "super_admin" | "aldeia_admin" | "vendedor" | "user";
  aldeiaId?: string;
  aldeia?: {
    id: string;
    nome: string;
    slug: string;
    tipoOrganizacao: string;
  };
  notificacoesEmail: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  nome: string;
  email: string;
  password: string;
  telefone?: string;
  role?: "user" | "vendedor" | "aldeia_admin";
  tipoOrganizacao?: "aldeia" | "escola" | "associacao_pais" | "clube";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Inicializar a partir do localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (token && user) {
          setState({
            user: JSON.parse(user),
            token,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setState({
        user: data.user,
        token: data.token,
        isLoading: false,
        isAuthenticated: true,
      });

      toast.success(`Bem-vindo, ${data.user.nome}!`);
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao fazer login";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao registar");
      }

      localStorage.setItem("token", responseData.token);
      localStorage.setItem("user", JSON.stringify(responseData.user));

      setState({
        user: responseData.user,
        token: responseData.token,
        isLoading: false,
        isAuthenticated: true,
      });

      toast.success("Registo bem-sucedido!");
      return { success: true, data: responseData };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao registar";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });

    toast.success("Sessão terminada");
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      
      const updatedUser = { ...prev.user, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      return {
        ...prev,
        user: updatedUser,
      };
    });
  }, []);

  const getAuthHeaders = useCallback(() => {
    return state.token ? { Authorization: `Bearer ${state.token}` } : {};
  }, [state.token]);

  // Helpers de role
  const isSuperAdmin = state.user?.role === "super_admin";
  const isAldeiaAdmin = state.user?.role === "aldeia_admin";
  const isVendedor = state.user?.role === "vendedor";
  const isUser = state.user?.role === "user";
  const isAdmin = isSuperAdmin || isAldeiaAdmin;

  return {
    ...state,
    login,
    register,
    logout,
    updateUser,
    getAuthHeaders,
    isSuperAdmin,
    isAldeiaAdmin,
    isVendedor,
    isUser,
    isAdmin,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkCookie = () => {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));
      if (authCookie) {
        const tokenValue = authCookie.split('=')[1];
        setToken(tokenValue);
      } else {
        setToken(null);
      }
    };

    checkCookie();

    const interval = setInterval(checkCookie, 1000);
    return () => clearInterval(interval);
  }, []);

  return token;
}

export function getAuthHeaders(): HeadersInit {
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));
  
  if (authCookie) {
    const token = authCookie.split('=')[1];
    return { Authorization: `Bearer ${token}` };
  }
  
  return {};
}
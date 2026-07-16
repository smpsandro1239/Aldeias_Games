'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook que detecta estado online/offline do browser e mostra notificações.
 * Também提供 retry automático para requests falhados.
 */
export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const retryQueueRef = useRef<Array<{ url: string; options: RequestInit; resolve: (v: Response) => void; reject: (e: Error) => void }>>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.success('Conexão restaurada!');
        processRetryQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.error('Sem ligação à internet. As operações serão retidas.', {
        duration: Infinity,
        id: 'offline-toast',
      });
    };

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  const processRetryQueue = async () => {
    const queue = retryQueueRef.current;
    retryQueueRef.current = [];

    for (const item of queue) {
      try {
        const res = await fetch(item.url, item.options);
        item.resolve(res);
      } catch (err) {
        item.reject(err instanceof Error ? err : new Error(String(err)));
      }
    }
  };

  const fetchWithRetry = async (url: string, options: RequestInit = {}): Promise<Response> => {
    if (!navigator.onLine) {
      return new Promise((resolve, reject) => {
        retryQueueRef.current.push({ url, options, resolve, reject });
        toast.info('Pedido enfileirado. Será enviado quando a ligação for restaurada.', {
          id: `queue-${url}`,
        });
      });
    }

    try {
      return await fetch(url, options);
    } catch (err) {
      if (!navigator.onLine) {
        return new Promise((resolve, reject) => {
          retryQueueRef.current.push({ url, options, resolve, reject });
          toast.info('Pedido enfileirado para retry automático.', {
            id: `retry-${url}`,
          });
        });
      }
      throw err;
    }
  };

  return { isOnline, fetchWithRetry };
}

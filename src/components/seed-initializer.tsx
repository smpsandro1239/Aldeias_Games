'use client';

import { useEffect, useRef } from 'react';

export function SeedInitializer() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    fetch('/api/seed', { method: 'POST' }).catch(() => {});
  }, []);

  return null;
}

'use client';

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function VerificarRaspadinhaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hash = searchParams.get("hash");
    const query = hash ? `?hash=${encodeURIComponent(hash)}` : "";
    router.replace(`/verificar${query}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">A redirecionar...</p>
      </div>
    </div>
  );
}

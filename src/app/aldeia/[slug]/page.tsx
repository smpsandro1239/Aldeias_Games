"use client";

import { useState, useEffect, Suspense, use } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PartyPopper, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { RaspadinhaGameView } from "@/features/raspadinhas/raspadinha-game-view";

function AldeiaPageContent() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/public/aldeia/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Card className="max-w-md mx-4 bg-surface-container border-outline-variant/20">
          <CardContent className="p-8 text-center">
            <PartyPopper className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold mb-2 text-on-surface">Ops!</h1>
            <p className="text-on-surface-variant">Esta organização não foi encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use the new immersive view
  return <RaspadinhaGameView data={data} />;
}

export default function AldeiaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    }>
      <AldeiaPageContent />
    </Suspense>
  );
}

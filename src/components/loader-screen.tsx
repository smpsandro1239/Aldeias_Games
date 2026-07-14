"use client";

import { SplashScreen } from "./splash-screen";

interface LoaderScreenProps {
  message?: string;
}

export function LoaderScreen({ message = "A Iniciar" }: LoaderScreenProps) {
  return <SplashScreen message={message} />;
}

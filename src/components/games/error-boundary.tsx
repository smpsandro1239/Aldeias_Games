"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary para componentes de jogo
 * Captura erros de rendering e exibe UI de fallback
 */
export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log do erro (poderia enviar para serviço de monitorização)
    console.error("Game Error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-surface-container rounded-2xl border border-outline-variant/20 text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <div>
            <h3 className="text-lg font-bold text-accent">Algo correu mal</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Ocorreu um erro inesperado no jogo.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

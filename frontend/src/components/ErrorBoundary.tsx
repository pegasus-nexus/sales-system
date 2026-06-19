import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorId: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorId: `ERR-UI-${Math.random().toString(36).substring(2, 9).toUpperCase()}` };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error in UI:", error, errorInfo);
        // Here we could also log the error to Sentry or another service
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorId: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Ups! Algo salió mal</h1>
                        <p className="text-gray-500 mb-6">
                            La interfaz encontró un error inesperado al intentar renderizar esta pantalla.
                        </p>
                        
                        <div className="w-full bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                            <p className="text-xs font-mono text-gray-500 text-left truncate">
                                Código de error: {this.state.errorId}
                            </p>
                            <p className="text-xs font-mono text-gray-400 text-left mt-1 truncate">
                                {this.state.error?.message}
                            </p>
                        </div>

                        <button
                            onClick={this.handleReset}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Recargar y volver al inicio
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

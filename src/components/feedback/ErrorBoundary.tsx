import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/utils/logger';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Global render-error boundary. Never shows technical details to users. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Unhandled render error', { error, componentStack: info.componentStack });
  }

  render() {
    return this.state.hasError ? <ErrorFallback /> : this.props.children;
  }
}

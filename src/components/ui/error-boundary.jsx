import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Widget-level error state UI.
 * Shown inside ErrorBoundary fallback or when a query fails.
 */
export function WidgetErrorState({ title = 'שגיאה בטעינת הנתונים', message, onRetry, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-4' : 'py-10 px-6'}`}>
      <div className={`rounded-2xl bg-destructive/10 flex items-center justify-center mb-3 ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
        <AlertTriangle className={`text-destructive ${compact ? 'w-5 h-5' : 'w-7 h-7'}`} />
      </div>
      <h3 className={`font-semibold text-foreground mb-1 ${compact ? 'text-sm' : 'text-base'}`}>
        {title}
      </h3>
      {message && (
        <p className={`text-muted-foreground max-w-xs mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
          {message}
        </p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 mt-1">
          <RefreshCw className="w-3.5 h-3.5" />
          נסה שוב
        </Button>
      )}
    </div>
  );
}

/**
 * React Error Boundary — wraps individual widgets so one failure
 * doesn't crash the entire page.
 *
 * Usage:
 *   <ErrorBoundary fallbackTitle="שגיאה בטעינת מדדים">
 *     <BusinessHealthGauges ... />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', this.props.fallbackTitle || 'Widget error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <WidgetErrorState
              title={this.props.fallbackTitle || 'שגיאה בטעינת הרכיב'}
              message="אירעה שגיאה בלתי צפויה. נסה לרענן את הרכיב."
              onRetry={this.handleReset}
            />
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

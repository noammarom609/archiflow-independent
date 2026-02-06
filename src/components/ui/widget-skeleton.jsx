import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Standard widget skeleton for dashboard cards.
 * Variants: 'gauges' | 'table' | 'list' | 'card'
 * Uses CSS-only animate-pulse via the base Skeleton component. Zero framer-motion.
 */
export function WidgetSkeleton({ variant = 'card', className }) {
  if (variant === 'gauges') {
    return (
      <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-6', className)}>
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 flex flex-col items-center">
              <Skeleton className="w-12 h-12 rounded-xl mb-4" />
              <Skeleton className="w-24 h-24 rounded-full mb-4" />
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-20 rounded-lg" />
                <Skeleton className="h-4 w-16 hidden sm:block" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'list') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: generic card
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 flex-1 rounded-xl" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

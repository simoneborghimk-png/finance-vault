import * as React from 'react';
import { cn } from '../../lib/utils';

export function EmptyState({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-border rounded-2xl bg-card/50',
        className
      )}
      {...props}
    />
  );
}

export function EmptyStateIcon({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="empty-state-icon"
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4 [&_svg]:size-6 [&_i]:text-xl',
        className
      )}
      {...props}
    />
  );
}

export function EmptyStateTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4
      data-slot="empty-state-title"
      className={cn(
        'text-base sm:text-lg font-semibold tracking-tight text-foreground mb-1.5',
        className
      )}
      {...props}
    />
  );
}

export function EmptyStateDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="empty-state-description"
      className={cn(
        'text-xs sm:text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed',
        className
      )}
      {...props}
    />
  );
}

export function EmptyStateActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="empty-state-actions"
      className={cn('flex flex-wrap items-center justify-center gap-3', className)}
      {...props}
    />
  );
}

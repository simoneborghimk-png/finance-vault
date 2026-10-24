import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const ArrowUp = ({ className, ...props }: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </svg>
);

const ArrowDown = ({ className, ...props }: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
);

const Minus = ({ className, ...props }: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M5 12h14" />
  </svg>
);

export type StatCardProps = React.HTMLAttributes<HTMLDivElement>;

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="stat-card"
      className={cn(
        'rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs transition-shadow duration-200 hover:shadow-sm',
        className
      )}
      {...props}
    />
  )
);
StatCard.displayName = 'StatCard';

export type StatCardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const StatCardHeader = React.forwardRef<HTMLDivElement, StatCardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="stat-card-header"
      className={cn('flex items-center justify-between space-x-2 pb-2', className)}
      {...props}
    />
  )
);
StatCardHeader.displayName = 'StatCardHeader';

export type StatCardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export const StatCardTitle = React.forwardRef<HTMLHeadingElement, StatCardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      data-slot="stat-card-title"
      className={cn('text-sm font-medium text-muted-foreground tracking-tight', className)}
      {...props}
    />
  )
);
StatCardTitle.displayName = 'StatCardTitle';

export type StatCardIconProps = React.HTMLAttributes<HTMLDivElement>;

export const StatCardIcon = React.forwardRef<HTMLDivElement, StatCardIconProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="stat-card-icon"
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);
StatCardIcon.displayName = 'StatCardIcon';

export type StatCardValueProps = React.HTMLAttributes<HTMLDivElement>;

export const StatCardValue = React.forwardRef<HTMLDivElement, StatCardValueProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="stat-card-value"
      className={cn('text-2xl sm:text-3xl font-bold tracking-tight text-foreground', className)}
      {...props}
    />
  )
);
StatCardValue.displayName = 'StatCardValue';

const statTrendVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide',
  {
    variants: {
      trend: {
        positive: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        negative: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        neutral: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      trend: 'neutral',
    },
  }
);

export interface StatCardTrendProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statTrendVariants> {
  value: string | number;
  label?: string;
  showIcon?: boolean;
}

export const StatCardTrend = React.forwardRef<HTMLDivElement, StatCardTrendProps>(
  ({ className, trend = 'neutral', value, label, showIcon = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="stat-card-trend"
        className={cn('flex items-center gap-2 pt-2 text-xs text-muted-foreground', className)}
        {...props}
      >
        <span className={cn(statTrendVariants({ trend }))}>
          {showIcon && (
            <>
              {trend === 'positive' && <ArrowUp className="h-3 w-3" />}
              {trend === 'negative' && <ArrowDown className="h-3 w-3" />}
              {trend === 'neutral' && <Minus className="h-3 w-3" />}
            </>
          )}
          {value}
        </span>
        {label && <span className="text-muted-foreground">{label}</span>}
      </div>
    );
  }
);
StatCardTrend.displayName = 'StatCardTrend';

export type StatCardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const StatCardDescription = React.forwardRef<HTMLParagraphElement, StatCardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="stat-card-description"
      className={cn('text-xs text-muted-foreground mt-1', className)}
      {...props}
    />
  )
);
StatCardDescription.displayName = 'StatCardDescription';

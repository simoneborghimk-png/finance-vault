import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export type TimelineProps = React.HTMLAttributes<HTMLOListElement>;

export const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      data-slot="timeline"
      className={cn('relative space-y-6 pl-2', className)}
      {...props}
    />
  )
);
Timeline.displayName = 'Timeline';

export type TimelineItemProps = React.LiHTMLAttributes<HTMLLIElement>;

export const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  ({ className, children, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="timeline-item"
      className={cn('group relative flex gap-4 text-left last:before:hidden', className)}
      {...props}
    >
      {children}
    </li>
  )
);
TimelineItem.displayName = 'TimelineItem';

export type TimelineConnectorProps = React.HTMLAttributes<HTMLDivElement>;

export const TimelineConnector = React.forwardRef<HTMLDivElement, TimelineConnectorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="timeline-connector"
      aria-hidden="true"
      className={cn(
        'absolute left-[15px] top-7 bottom-0 w-[2px] bg-border transition-colors group-last:hidden',
        className
      )}
      {...props}
    />
  )
);
TimelineConnector.displayName = 'TimelineConnector';

const timelineIconVariants = cva(
  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium shadow-xs transition-all duration-150',
  {
    variants: {
      variant: {
        default: 'border-border bg-background text-foreground',
        primary: 'border-transparent bg-primary text-primary-foreground',
        success: 'border-transparent bg-emerald-600 text-white dark:bg-emerald-500',
        warning: 'border-transparent bg-amber-600 text-white dark:bg-amber-500',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        muted: 'border-border bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TimelineIconProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof timelineIconVariants> {}

export const TimelineIcon = React.forwardRef<HTMLDivElement, TimelineIconProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="timeline-icon"
      className={cn(timelineIconVariants({ variant }), className)}
      {...props}
    />
  )
);
TimelineIcon.displayName = 'TimelineIcon';

export type TimelineContentProps = React.HTMLAttributes<HTMLDivElement>;

export const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="timeline-content"
      className={cn('flex flex-1 flex-col pt-0.5 pb-2', className)}
      {...props}
    />
  )
);
TimelineContent.displayName = 'TimelineContent';

export type TimelineHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const TimelineHeader = React.forwardRef<HTMLDivElement, TimelineHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="timeline-header"
      className={cn('flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5', className)}
      {...props}
    />
  )
);
TimelineHeader.displayName = 'TimelineHeader';

export type TimelineHeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';

export interface TimelineTitleProps extends React.HTMLAttributes<HTMLElement> {
  as?: TimelineHeadingLevel;
}

export const TimelineTitle = React.forwardRef<HTMLElement, TimelineTitleProps>(
  ({ className, as: Component = 'h4', ...props }, ref) => (
    <Component
      ref={ref as React.Ref<HTMLHeadingElement>}
      data-slot="timeline-title"
      className={cn('text-sm font-semibold tracking-tight text-foreground', className)}
      {...props}
    />
  )
);
TimelineTitle.displayName = 'TimelineTitle';

export type TimelineTimeProps = React.TimeHTMLAttributes<HTMLTimeElement>;

export const TimelineTime = React.forwardRef<HTMLTimeElement, TimelineTimeProps>(
  ({ className, ...props }, ref) => (
    <time
      ref={ref}
      data-slot="timeline-time"
      className={cn('text-xs text-muted-foreground tabular-nums', className)}
      {...props}
    />
  )
);
TimelineTime.displayName = 'TimelineTime';

export type TimelineDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const TimelineDescription = React.forwardRef<HTMLParagraphElement, TimelineDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="timeline-description"
      className={cn('text-sm text-muted-foreground mt-1', className)}
      {...props}
    />
  )
);
TimelineDescription.displayName = 'TimelineDescription';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap shrink-0 w-fit rounded-full font-semibold leading-normal transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_i]:leading-none select-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'border border-border text-foreground',
        info: 'border border-info/30 bg-info/10 text-info hover:bg-info/20',
        success: 'border border-success/30 bg-success/10 text-success hover:bg-success/20',
        warning: 'border border-warning/30 bg-warning/10 text-warning hover:bg-warning/20',
      },
      size: {
        sm: 'px-2 py-0 text-[10px] gap-1 [&_svg]:size-2.5 [&_i]:text-[10px]',
        default: 'px-2.5 py-0.5 text-xs gap-1.5 [&_svg]:size-3 [&_i]:text-[11px]',
        lg: 'px-3 py-1 text-sm gap-2 [&_svg]:size-3.5 [&_i]:text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  /** Icon element to display before the badge text */
  icon?: React.ReactNode;
  /** @deprecated Prefer using `icon` prop instead of dot indicator */
  withDot?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  icon,
  withDot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon ? (
        <span
          className="inline-flex shrink-0 items-center justify-center leading-none -translate-y-[0.5px]"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : withDot ? (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'destructive' && 'bg-destructive-foreground',
            variant === 'info' && 'bg-info',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            (!variant || variant === 'default') && 'bg-primary-foreground',
            variant === 'secondary' && 'bg-secondary-foreground',
            variant === 'outline' && 'bg-foreground'
          )}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </div>
  );
}

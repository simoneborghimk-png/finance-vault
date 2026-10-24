import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const alertVariants = cva(
  'relative flex w-full items-start gap-3.5 rounded-lg border p-4 text-sm transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border [&_svg]:text-foreground',
        destructive:
          'border-destructive/40 text-destructive dark:border-destructive/60 bg-destructive/5 dark:bg-destructive/10 [&_svg]:text-destructive',
        info: 'border-info/40 text-info dark:border-info/60 bg-info/5 dark:bg-info/10 [&_svg]:text-info',
        success:
          'border-success/40 text-success dark:border-success/60 bg-success/5 dark:bg-success/10 [&_svg]:text-success',
        warning:
          'border-warning/40 text-warning dark:border-warning/60 bg-warning/5 dark:bg-warning/10 [&_svg]:text-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
}

export function Alert({ className, variant, icon, children, ...props }: AlertProps) {
  let renderedIcon = icon;
  let renderedChildren = children;

  // Supporta sia la prop icon sia l'icona passata come primo child
  if (!renderedIcon && React.Children.count(children) > 1) {
    const childrenArray = React.Children.toArray(children);
    const firstChild = childrenArray[0];
    if (
      React.isValidElement(firstChild) &&
      (typeof firstChild.type === 'string'
        ? firstChild.type === 'svg' || firstChild.type === 'i'
        : true) &&
      firstChild.type !== AlertTitle &&
      firstChild.type !== AlertDescription
    ) {
      renderedIcon = firstChild;
      renderedChildren = childrenArray.slice(1);
    }
  }

  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {renderedIcon && (
        <span className="shrink-0 mt-0.5 text-base flex items-center justify-center">
          {renderedIcon}
        </span>
      )}
      <div className="flex-1 min-w-0 space-y-1">{renderedChildren}</div>
    </div>
  );
}

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';

export interface AlertTitleProps extends React.HTMLAttributes<HTMLElement> {
  as?: HeadingLevel;
}

export function AlertTitle({ className, as: Component = 'h5', ...props }: AlertTitleProps) {
  return (
    <Component
      className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn('text-sm [&_p]:leading-relaxed opacity-90', className)} {...props} />;
}
